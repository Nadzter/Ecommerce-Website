import { Text } from "@react-email/components";

import { EmailLayout, emailStyles } from "./_shared";

export interface WaitlistPromotedEmailProps {
  studio: { name: string; primaryColor: string; logoUrl: string | null };
  className: string;
  date: string;
}

export function WaitlistPromotedEmail({
  studio,
  className,
  date,
}: WaitlistPromotedEmailProps): JSX.Element {
  return (
    <EmailLayout
      preview={`A spot opened in ${className}`}
      studio={studio}
    >
      <Text style={emailStyles.heading}>You're off the waitlist.</Text>
      <Text style={emailStyles.paragraph}>
        A seat just opened up for {className} on {date} at {studio.name} and
        your booking is now <strong>CONFIRMED</strong>.
      </Text>
    </EmailLayout>
  );
}

export default WaitlistPromotedEmail;
