import {
  type BankLinkResult,
  type BankLinkSession,
  type InitiateTransferRequest,
  type InitiateTransferResult,
  NotImplementedError,
  type PaymentProvider,
  type ProviderWebhookEvent,
  type TransferStatus,
} from './PaymentProvider.js';

/**
 * Flutterwave (Pan-African). Phase 2 stub — implementing this means:
 *  - Bank account linking via Flutterwave's account/bank verification API
 *  - Payouts API for the actual transfer
 *  - Webhook secret hash header verification
 *  - Mapping Flutterwave's transfer.status to our TransferState
 */
export class FlutterwaveProvider implements PaymentProvider {
  readonly name = 'flutterwave';
  readonly supportedCountries = ['GH'] as const;
  readonly supportedCurrencies = ['GHS'] as const;

  createBankLinkSession(): Promise<BankLinkSession> {
    throw new NotImplementedError('FlutterwaveProvider', 'createBankLinkSession');
  }
  completeBankLink(): Promise<BankLinkResult> {
    throw new NotImplementedError('FlutterwaveProvider', 'completeBankLink');
  }
  revokeBankLink(): Promise<void> {
    throw new NotImplementedError('FlutterwaveProvider', 'revokeBankLink');
  }
  initiateTransfer(_req: InitiateTransferRequest): Promise<InitiateTransferResult> {
    throw new NotImplementedError('FlutterwaveProvider', 'initiateTransfer');
  }
  getTransferStatus(): Promise<TransferStatus> {
    throw new NotImplementedError('FlutterwaveProvider', 'getTransferStatus');
  }
  parseWebhook(): Promise<ProviderWebhookEvent> {
    throw new NotImplementedError('FlutterwaveProvider', 'parseWebhook');
  }
}
