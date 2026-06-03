import { Text } from "@react-email/components";

import { EmailLayout, emailStyles } from "./_shared";

export interface BookingReminderEmailProps {
  studio: { name: string; primaryColor: string; logoUrl: string | null };
  className: string;
  time: string;
}

export function BookingReminderEmail({
  studio,
  className,
  time,
}: BookingReminderEmailProps): JSX.Element {
  return (
    <EmailLayout
      preview={`Your ${className} class starts in 1 hour`}
      studio={studio}
    >
      <Text style={emailStyles.heading}>See you in an hour.</Text>
      <Text style={emailStyles.paragraph}>
        {className} at {studio.name} starts at {time}. Arrive 10 minutes
        early so you can settle in.
      </Text>
    </EmailLayout>
  );
}

export default BookingReminderEmail;
