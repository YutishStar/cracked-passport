import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { copy, fmt } from "@/lib/copy";

export interface AcceptanceEmailProps {
  fellowNumber: number;
  claimUrl: string;
}

export function AcceptanceEmail({ fellowNumber, claimUrl }: AcceptanceEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{copy.email.body}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>CRACKED · FELLOW #{fmt(fellowNumber)}</Text>
          <Heading style={heading}>{copy.email.heading}</Heading>
          <Text style={text}>{copy.email.body}</Text>
          <Section style={{ marginTop: 32 }}>
            <Button href={claimUrl} style={button}>
              {copy.email.button}
            </Button>
          </Section>
          <Text style={muted}>
            This link is just for you and expires in 14 days.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AcceptanceEmail;

const body = { backgroundColor: "#fafaf7", fontFamily: "Georgia, serif", margin: 0 };
const container = { maxWidth: "480px", margin: "0 auto", padding: "56px 32px" };
const eyebrow = {
  fontFamily: "monospace",
  fontSize: "11px",
  letterSpacing: "0.18em",
  color: "#5a5a58",
  margin: "0 0 24px",
};
const heading = { fontSize: "44px", lineHeight: "1.05", color: "#0b0b0b", margin: "0 0 16px" };
const text = { fontSize: "17px", lineHeight: "1.6", color: "#2a2a2a", margin: 0 };
const button = {
  backgroundColor: "#0b0b0b",
  color: "#fafaf7",
  borderRadius: "999px",
  padding: "14px 28px",
  fontSize: "14px",
  fontFamily: "Arial, sans-serif",
  textDecoration: "none",
};
const muted = { fontSize: "12px", color: "#8b8b88", marginTop: "24px" };
