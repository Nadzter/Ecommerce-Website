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
 * Lean Technologies (UAE/Saudi). Phase 2 stub — implementing this means:
 *  - OAuth-style consent flow with Lean's link tokens
 *  - Payment initiation via Lean's PIS API
 *  - Webhook signature verification per Lean's docs
 *  - Mapping Lean's payment status enum to our TransferState
 */
export class LeanProvider implements PaymentProvider {
  readonly name = 'lean';
  readonly supportedCountries = ['AE'] as const;
  readonly supportedCurrencies = ['AED'] as const;

  createBankLinkSession(): Promise<BankLinkSession> {
    throw new NotImplementedError('LeanProvider', 'createBankLinkSession');
  }
  completeBankLink(): Promise<BankLinkResult> {
    throw new NotImplementedError('LeanProvider', 'completeBankLink');
  }
  revokeBankLink(): Promise<void> {
    throw new NotImplementedError('LeanProvider', 'revokeBankLink');
  }
  initiateTransfer(_req: InitiateTransferRequest): Promise<InitiateTransferResult> {
    throw new NotImplementedError('LeanProvider', 'initiateTransfer');
  }
  getTransferStatus(): Promise<TransferStatus> {
    throw new NotImplementedError('LeanProvider', 'getTransferStatus');
  }
  parseWebhook(): Promise<ProviderWebhookEvent> {
    throw new NotImplementedError('LeanProvider', 'parseWebhook');
  }
}
