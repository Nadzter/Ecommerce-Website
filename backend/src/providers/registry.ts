import type { Env } from '../config/env.js';
import { FlutterwaveProvider } from './FlutterwaveProvider.js';
import { LeanProvider } from './LeanProvider.js';
import { MockPaymentProvider } from './MockPaymentProvider.js';
import type { PaymentProvider, ProviderName } from './PaymentProvider.js';

export interface ProviderRegistry {
  byName(name: ProviderName): PaymentProvider;
  forCountryCurrency(country: string, currency: string): PaymentProvider;
}

interface BuildOpts {
  env: Env;
  publicBaseUrl: string;
}

export function buildRegistry(opts: BuildOpts): ProviderRegistry {
  const mock = new MockPaymentProvider({
    env: opts.env,
    webhookUrl: `${opts.publicBaseUrl}/v1/webhooks/mock`,
    authBaseUrl: opts.publicBaseUrl,
  });
  const lean = new LeanProvider();
  const flutterwave = new FlutterwaveProvider();

  const providers: Record<ProviderName, PaymentProvider> = { mock, lean, flutterwave };

  return {
    byName(name) {
      const p = providers[name];
      if (!p) throw new Error(`Unknown provider: ${name}`);
      return p;
    },
    forCountryCurrency(country, currency) {
      // Phase 1: PROVIDER_OVERRIDE wins. Phase 2 we route by (country, currency).
      if (opts.env.PROVIDER_OVERRIDE) return providers[opts.env.PROVIDER_OVERRIDE];
      if (country === 'AE' && currency === 'AED') return lean;
      if (country === 'GH' && currency === 'GHS') return flutterwave;
      return mock;
    },
  };
}
