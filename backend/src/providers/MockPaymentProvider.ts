import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { Env } from '../config/env.js';
import { requiresSca } from '../lib/sca.js';
import type { TransferState } from '../modules/transfers/state-machine.js';
import {
  type BankLinkResult,
  type BankLinkSession,
  type InitiateTransferRequest,
  type InitiateTransferResult,
  type PaymentProvider,
  type ProviderWebhookEvent,
  type TransferStatus,
  WebhookSignatureError,
} from './PaymentProvider.js';

const SIGNATURE_HEADER = 'x-amwali-signature';

const MOCK_BANKS = [
  { id: 'mock_enbd', name: 'Mock Emirates NBD' },
  { id: 'mock_adcb', name: 'Mock ADCB' },
  { id: 'mock_fab', name: 'Mock First Abu Dhabi Bank' },
  { id: 'mock_gcb', name: 'Mock GCB Bank (Ghana)' },
];

interface MockState {
  payments: Map<string, TransferStatus>;
}

interface MockOpts {
  env: Env;
  webhookUrl: string;
  authBaseUrl: string;
  schedule?: (fn: () => Promise<void>, delayMs: number) => void;
}

export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';
  readonly supportedCountries = ['AE', 'GH'] as const;
  readonly supportedCurrencies = ['AED', 'GHS'] as const;

  private readonly state: MockState = { payments: new Map() };

  constructor(private readonly opts: MockOpts) {}

  async createBankLinkSession(params: {
    userId: string;
    country: string;
    redirectUri: string;
  }): Promise<BankLinkSession> {
    const sessionId = randomUUID();
    const url = new URL(`${this.opts.authBaseUrl}/v1/dev/mock-bank/authorize`);
    url.searchParams.set('session', sessionId);
    url.searchParams.set('redirect', params.redirectUri);
    return {
      providerSessionId: sessionId,
      authorizationUrl: url.toString(),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    };
  }

  async completeBankLink(params: {
    providerSessionId: string;
    callbackParams: Record<string, string>;
  }): Promise<BankLinkResult> {
    const bank =
      MOCK_BANKS[Math.floor(parseInt(params.providerSessionId.replace(/\D/g, '0').slice(-3), 10) % MOCK_BANKS.length)] ??
      MOCK_BANKS[0]!;
    const currency = params.callbackParams['country'] === 'GH' ? 'GHS' : 'AED';
    return {
      providerLinkRef: `mock_link_${randomUUID()}`,
      institutionId: bank.id,
      institutionName: bank.name,
      accountLast4: '0142',
      currency,
      consentExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60_000),
    };
  }

  async revokeBankLink(_params: { providerLinkRef: string }): Promise<void> {
    // Mock: nothing to do.
  }

  async initiateTransfer(req: InitiateTransferRequest): Promise<InitiateTransferResult> {
    const providerPaymentId = `mock_pay_${randomUUID()}`;
    const sca = requiresSca(this.opts.env, req.amount);
    const failure = req.metadata?.['__mock_fail'];

    const initialState: TransferState = sca ? 'pending' : 'authorized';
    const result: InitiateTransferResult = {
      providerPaymentId,
      state: initialState,
      raw: {
        provider: 'mock',
        ourTransferId: req.ourTransferId,
        sca_required: sca,
      },
    };

    if (sca) {
      const url = new URL(`${this.opts.authBaseUrl}/v1/dev/mock-bank/sca`);
      url.searchParams.set('payment', providerPaymentId);
      result.authorizationUrl = url.toString();
    }

    this.state.payments.set(providerPaymentId, {
      providerPaymentId,
      state: initialState,
      raw: { mock: true, failure },
    });

    if (!sca) {
      // Below-threshold path: schedule the submitted/completed/failed webhook flow.
      this.scheduleWebhookProgression(providerPaymentId, failure);
    }
    return result;
  }

  async getTransferStatus(providerPaymentId: string): Promise<TransferStatus> {
    const s = this.state.payments.get(providerPaymentId);
    if (!s) {
      return { providerPaymentId, state: 'failed', failureCode: 'not_found', raw: {} };
    }
    return s;
  }

  async parseWebhook(params: {
    rawBody: Buffer;
    headers: Record<string, string | string[] | undefined>;
  }): Promise<ProviderWebhookEvent> {
    const provided = headerValue(params.headers, SIGNATURE_HEADER);
    if (!provided) throw new WebhookSignatureError('Missing X-Amwali-Signature header.');
    const expected = createHmac('sha256', this.opts.env.MOCK_WEBHOOK_SECRET)
      .update(params.rawBody)
      .digest('hex');
    if (!safeEqual(provided, expected)) throw new WebhookSignatureError();

    const body = JSON.parse(params.rawBody.toString('utf8')) as {
      providerPaymentId: string;
      state: TransferState;
      failureCode?: string;
      failureMessage?: string;
      bankReference?: string;
      occurredAt?: string;
    };

    const event: ProviderWebhookEvent = {
      providerPaymentId: body.providerPaymentId,
      state: body.state,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
      raw: body,
    };
    if (body.failureCode !== undefined) event.failureCode = body.failureCode;
    if (body.failureMessage !== undefined) event.failureMessage = body.failureMessage;
    if (body.bankReference !== undefined) event.bankReference = body.bankReference;
    return event;
  }

  /** Used by tests (and the `/v1/dev/mock-bank/sca` callback) to advance pending → authorized. */
  approveSca(providerPaymentId: string): void {
    const current = this.state.payments.get(providerPaymentId);
    if (!current || current.state !== 'pending') return;
    this.state.payments.set(providerPaymentId, { ...current, state: 'authorized' });
    this.scheduleWebhookProgression(providerPaymentId, undefined);
  }

  private scheduleWebhookProgression(providerPaymentId: string, failure: string | undefined): void {
    const { MOCK_WEBHOOK_DELAY_MIN_MS, MOCK_WEBHOOK_DELAY_MAX_MS } = this.opts.env;
    const delay = randInt(MOCK_WEBHOOK_DELAY_MIN_MS, MOCK_WEBHOOK_DELAY_MAX_MS);
    const schedule = this.opts.schedule ?? defaultSchedule;
    schedule(async () => {
      const submitted: TransferStatus = {
        providerPaymentId,
        state: 'submitted',
        raw: { mock: true },
      };
      this.state.payments.set(providerPaymentId, submitted);
      await this.fireWebhook(submitted);

      const finalStatus: TransferStatus = failure
        ? {
            providerPaymentId,
            state: 'failed',
            failureCode: failure,
            failureMessage: `mock failure: ${failure}`,
            raw: { mock: true, failure },
          }
        : {
            providerPaymentId,
            state: 'completed',
            bankReference: `MOCKREF-${providerPaymentId.slice(-8).toUpperCase()}`,
            raw: { mock: true },
          };
      this.state.payments.set(providerPaymentId, finalStatus);
      await this.fireWebhook(finalStatus);
    }, delay);
  }

  private async fireWebhook(status: TransferStatus): Promise<void> {
    if (!this.opts.webhookUrl) return;
    const body = JSON.stringify({
      providerPaymentId: status.providerPaymentId,
      state: status.state,
      failureCode: status.failureCode,
      failureMessage: status.failureMessage,
      bankReference: status.bankReference,
      occurredAt: new Date().toISOString(),
    });
    const signature = createHmac('sha256', this.opts.env.MOCK_WEBHOOK_SECRET).update(body).digest('hex');
    try {
      await fetch(this.opts.webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', [SIGNATURE_HEADER]: signature },
        body,
      });
    } catch {
      // Mock fire-and-forget. Reconciler will recover via getTransferStatus.
    }
  }
}

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const v = headers[name];
  if (Array.isArray(v)) return v[0];
  return v;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function randInt(min: number, max: number): number {
  if (max <= min) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function defaultSchedule(fn: () => Promise<void>, delayMs: number): void {
  setTimeout(() => {
    void fn();
  }, delayMs);
}
