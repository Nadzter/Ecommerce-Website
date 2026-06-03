import { Text } from "@react-email/components";

import { EmailLayout, emailStyles } from "./_shared";

export interface PaymentReceivedEmailProps {
  studio: { name: string; primaryColor: string; logoUrl: string | null };
  membershipName: string;
  amount: string;
  currency: string;
  invoiceUrl?: string;
}

export function PaymentReceivedEmail({
  studio,
  membershipName,
  amount,
  currency,
  invoiceUrl,
}: PaymentReceivedEmailProps): JSX.Element {
  return (
    <EmailLayout
      preview={`Payment received — ${membershipName}`}
      studio={studio}
    >
      <Text style={emailStyles.heading}>Payment received.</Text>
      <Text style={emailStyles.paragraph}>
        Thanks — your purchase of <strong>{membershipName}</strong> at{" "}
        {studio.name} is complete.
      </Text>
      <Text style={emailStyles.meta}>
        <strong>Amount:</strong> {amount} {currency}
      </Text>
      {invoiceUrl ? (
        <a href={invoiceUrl} style={emailStyles.ctaButton(studio.primaryColor)}>
          Download invoice
        </a>
      ) : null}
    </EmailLayout>
  );
}

export default PaymentReceivedEmail;
