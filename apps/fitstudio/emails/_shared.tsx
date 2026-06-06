import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

export interface EmailLayoutProps {
  preview: string;
  studio: {
    name: string;
    primaryColor: string;
    logoUrl: string | null;
  };
  children: ReactNode;
  footerText?: string;
}

const baseFont =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

export function EmailLayout({
  preview,
  studio,
  children,
  footerText,
}: EmailLayoutProps): JSX.Element {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#F8FAFC",
          color: "#0F172A",
          fontFamily: baseFont,
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            margin: "24px auto",
            maxWidth: 560,
            padding: 32,
            boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
          }}
        >
          <Section>
            {studio.logoUrl ? (
              <Img
                src={studio.logoUrl}
                alt={`${studio.name} logo`}
                width={64}
                height={64}
                style={{ borderRadius: 8, marginBottom: 16 }}
              />
            ) : (
              <Text
                style={{
                  display: "inline-block",
                  margin: "0 0 16px 0",
                  padding: "8px 16px",
                  backgroundColor: studio.primaryColor,
                  color: "#FFFFFF",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  letterSpacing: 0.4,
                }}
              >
                {studio.name}
              </Text>
            )}
          </Section>
          <Section>{children}</Section>
          <Hr
            style={{
              borderColor: "#E2E8F0",
              margin: "32px 0 16px 0",
            }}
          />
          <Text
            style={{
              color: "#64748B",
              fontSize: 12,
              margin: 0,
            }}
          >
            {footerText ??
              `Sent by ${studio.name} · You're receiving this email because you booked a class or purchased a membership.`}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const emailStyles = {
  heading: {
    fontFamily: baseFont,
    fontSize: 24,
    fontWeight: 600,
    lineHeight: "32px",
    margin: "0 0 8px 0",
    color: "#0F172A",
  },
  paragraph: {
    fontFamily: baseFont,
    fontSize: 15,
    lineHeight: "24px",
    margin: "0 0 16px 0",
    color: "#334155",
  },
  ctaButton: (background: string): React.CSSProperties => ({
    display: "inline-block",
    backgroundColor: background,
    color: "#FFFFFF",
    fontWeight: 600,
    fontSize: 14,
    padding: "12px 20px",
    borderRadius: 8,
    textDecoration: "none",
    margin: "8px 0 16px 0",
  }),
  meta: {
    fontFamily: baseFont,
    fontSize: 14,
    lineHeight: "20px",
    color: "#475569",
    margin: "4px 0",
  },
};
