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
} from '@react-email/components'

interface MagicLinkEmailProps {
  magicLink: string
  campgroundName?: string
}

export function MagicLinkEmail({ magicLink, campgroundName }: MagicLinkEmailProps) {
  const preview = campgroundName
    ? `Sign in to finish setting up your ${campgroundName} watch.`
    : 'Sign in to Alphacamper.'

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={wordmark}>Alphacamper</Text>
            <Text style={kicker}>Sign-in link</Text>
          </Section>

          <Section style={card}>
            <Heading style={heading}>
              Pick up where you left off.
            </Heading>

            {campgroundName ? (
              <Text style={bodyText}>
                Click the button below to sign in. We&apos;ll save your watch for{' '}
                <strong style={strongText}>{campgroundName}</strong> and take you straight to
                your dashboard.
              </Text>
            ) : (
              <Text style={bodyText}>
                Click the button below to sign in and go straight to your dashboard.
              </Text>
            )}

            <Section style={buttonWrap}>
              <Button style={button} href={magicLink}>
                Sign in to Alphacamper →
              </Button>
            </Section>

            <Text style={hint}>
              Or paste this link into your browser:
            </Text>
            <Text style={linkText}>
              <a href={magicLink} style={link}>{magicLink}</a>
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This link expires in one hour and can only be used once.
            </Text>
            <Text style={footerText}>
              If you didn&apos;t request this, you can safely ignore it — nothing happens
              until the link is clicked.
            </Text>
            <Text style={footerSignature}>
              Alphacamper · We get you the campsite.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default MagicLinkEmail

// ─── Styles — DESIGN.md palette (forest / paradiso / sprig / paper) ───

const body: React.CSSProperties = {
  backgroundColor: '#F4F7F6', // --cloud
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  padding: '48px 16px',
  color: '#0E2A2A',
}

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  backgroundColor: '#FFFFFF',
  borderRadius: '20px',
  overflow: 'hidden',
  border: '1px solid #E6EBEA',
  boxShadow: '0 24px 60px -30px rgba(14,42,42,0.25)',
}

const header: React.CSSProperties = {
  padding: '28px 36px 20px',
  borderBottom: '1px solid #E6EBEA',
  textAlign: 'left',
}

const wordmark: React.CSSProperties = {
  color: '#0E2A2A',
  fontFamily:
    "Georgia, 'Times New Roman', 'Instrument Serif', serif", // serif stack for editorial feel; Instrument Serif won't render in most clients but shows as Georgia fallback
  fontSize: '22px',
  fontWeight: 400,
  letterSpacing: '-0.015em',
  margin: 0,
}

const kicker: React.CSSProperties = {
  color: '#2F847C',
  fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  margin: '6px 0 0',
}

const card: React.CSSProperties = {
  padding: '32px 36px 28px',
}

const heading: React.CSSProperties = {
  color: '#0E2A2A',
  fontFamily:
    "Georgia, 'Times New Roman', 'Instrument Serif', serif",
  fontSize: '28px',
  fontWeight: 400,
  lineHeight: '1.1',
  letterSpacing: '-0.015em',
  margin: '0 0 18px',
}

const bodyText: React.CSSProperties = {
  color: '#4B5F5F',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 28px',
}

const strongText: React.CSSProperties = {
  color: '#0E2A2A',
  fontWeight: 600,
}

const buttonWrap: React.CSSProperties = {
  textAlign: 'center',
  margin: '0 0 24px',
}

const button: React.CSSProperties = {
  backgroundColor: '#0E2A2A',
  borderRadius: '9999px',
  color: '#FFFFFF',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  padding: '16px 32px',
  textDecoration: 'none',
}

const hint: React.CSSProperties = {
  color: '#8BA39E',
  fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  margin: '0 0 6px',
}

const linkText: React.CSSProperties = {
  color: '#4B5F5F',
  fontSize: '12.5px',
  lineHeight: '1.5',
  wordBreak: 'break-all',
  margin: 0,
}

const link: React.CSSProperties = {
  color: '#2F847C',
  textDecoration: 'underline',
}

const footer: React.CSSProperties = {
  padding: '20px 36px 28px',
  backgroundColor: '#F4F7F6',
  borderTop: '1px solid #E6EBEA',
}

const footerText: React.CSSProperties = {
  color: '#8BA39E',
  fontSize: '12.5px',
  lineHeight: '1.55',
  margin: '0 0 8px',
}

const footerSignature: React.CSSProperties = {
  color: '#2F847C',
  fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
  fontSize: '11px',
  fontWeight: 500,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  margin: '16px 0 0',
}
