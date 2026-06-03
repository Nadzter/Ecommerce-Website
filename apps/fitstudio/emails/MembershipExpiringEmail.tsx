import { Text } from "@react-email/components";

import { EmailLayout, emailStyles } from "./_shared";

export interface MembershipExpiringEmailProps {
  studio: { name: string; primaryColor: string; logoUrl: string | null };
  membershipName: string;
  expiryDate: string;
  renewUrl: string;
}

export function MembershipExpiringEmail({
  studio,
  membershipName,
  expiryDate,
  renewUrl,
}: MembershipExpiringEmailProps): JSX.Element {
  return (
    <EmailLayout
      preview={`Your ${membershipName} expires on ${expiryDate}`}
      studio={studio}
    >
      <Text style={emailStyles.heading}>Time to renew.</Text>
      <Text style={emailStyles.paragraph}>
        Your <strong>{membershipName}</strong> membership at {studio.name}{" "}
        expires on <strong>{expiryDate}</strong>. Renew now to avoid an
        interruption to your bookings.
      </Text>
      <a href={renewUrl} style={emailStyles.ctaButton(studio.primaryColor)}>
        Renew membership
      </a>
    </EmailLayout>
  );
}

export default MembershipExpiringEmail;
