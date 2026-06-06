import { Text } from "@react-email/components";

import { EmailLayout, emailStyles } from "./_shared";

export interface BookingConfirmationEmailProps {
  studio: { name: string; primaryColor: string; logoUrl: string | null };
  memberName: string;
  className: string;
  instructorName: string;
  date: string;
  time: string;
  cancellationLink?: string;
}

export function BookingConfirmationEmail({
  studio,
  memberName,
  className,
  instructorName,
  date,
  time,
  cancellationLink,
}: BookingConfirmationEmailProps): JSX.Element {
  return (
    <EmailLayout
      preview={`Your ${className} booking is confirmed`}
      studio={studio}
    >
      <Text style={emailStyles.heading}>You're booked in, {memberName}.</Text>
      <Text style={emailStyles.paragraph}>
        See you at {studio.name} for {className} with {instructorName}.
      </Text>
      <Text style={emailStyles.meta}>
        <strong>When:</strong> {date} · {time}
      </Text>
      <Text style={emailStyles.meta}>
        <strong>Instructor:</strong> {instructorName}
      </Text>
      {cancellationLink ? (
        <Text style={emailStyles.paragraph}>
          Can't make it?{" "}
          <a
            href={cancellationLink}
            style={{ color: studio.primaryColor, fontWeight: 500 }}
          >
            Cancel your booking
          </a>{" "}
          up to two hours before class.
        </Text>
      ) : null}
    </EmailLayout>
  );
}

export default BookingConfirmationEmail;
