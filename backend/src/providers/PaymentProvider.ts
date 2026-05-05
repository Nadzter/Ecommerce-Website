import type { Money } from '../lib/money.js';
import type { TransferState } from '../modules/transfers/state-machine.js';

export type Routing =
  | { type: 'iban'; iban: string }
  | { type: 'bank_account'; bankCode: string; accountNumber: string };

// ─── Bank linking ──────────────────────────────────────────────────────────

export interface BankLinkSession {
  providerSessionId: string;
  authorizationUrl: string;
  expiresAt: Date;
}

export interface BankLinkResult {
  providerLinkRef: string;
  institutionId: string;
  institutionName: string;
  accountLast4: string;
  currency: string;
  consentExpiresAt: Date | null;
}

// ─── Initiation ────────────────────────────────────────────────────────────

export interface InitiateTransferRequest {
  idempotencyKey: string;
  ourTransferId: string;
  bankLinkRef: string;
  amount: Money;
  destination: Routing;
  reference: string;
  metadata?: Record<string, string>;
}

export interface InitiateTransferResult {
  providerPaymentId: string;
  state: TransferState;
  authorizationUrl?: string;
  raw: unknown;
}

// ─── Status ────────────────────────────────────────────────────────────────

export interface TransferStatus {
  providerPaymentId: string;
  state: TransferState;
  failureCode?: string;
  failureMessage?: string;
  bankReference?: string;
  raw: unknown;
}

// ─── Webhooks ──────────────────────────────────────────────────────────────

export interface ProviderWebhookEvent {
  providerPaymentId: string;
  state: TransferState;
  failureCode?: string;
  failureMessage?: string;
  bankReference?: string;
  occurredAt: Date;
  raw: unknown;
}

export class WebhookSignatureError extends Error {
  constructor(message = 'Invalid webhook signature') {
    super(message);
    this.name = 'WebhookSignatureError';
  }
}

export class NotImplementedError extends Error {
  constructor(provider: string, method: string) {
    super(`${provider}.${method} is not implemented yet (Phase 2).`);
    this.name = 'NotImplementedError';
  }
}

// ─── Provider contract ─────────────────────────────────────────────────────

export type ProviderName = 'mock' | 'lean' | 'flutterwave';

export interface PaymentProvider {
  readonly name: ProviderName;
  readonly supportedCountries: readonly string[];
  readonly supportedCurrencies: readonly string[];

  createBankLinkSession(params: {
    userId: string;
    country: string;
    redirectUri: string;
  }): Promise<BankLinkSession>;

  completeBankLink(params: {
    providerSessionId: string;
    callbackParams: Record<string, string>;
  }): Promise<BankLinkResult>;

  revokeBankLink(params: { providerLinkRef: string }): Promise<void>;

  initiateTransfer(req: InitiateTransferRequest): Promise<InitiateTransferResult>;

  getTransferStatus(providerPaymentId: string): Promise<TransferStatus>;

  parseWebhook(params: {
    rawBody: Buffer;
    headers: Record<string, string | string[] | undefined>;
  }): Promise<ProviderWebhookEvent>;
}
