import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
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
  return (
    <Html>
      <Head />
      <Preview>Your Alphacamper sign-in link is ready</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Text style={wordmark}>🏕️ Alphacamper</Text>
          </Section>

          {/* Body */}
          <Section style={card}>
            <Heading style={heading}>Your sign-in link is ready</Heading>

            {campgroundName ? (
              <Text style={bodyText}>
                Click below and Alpha will sign you in and save your watch for{' '}
                <strong>{campgroundName}</strong>.
              </Text>
            ) : (
              <Text style={bodyText}>
                Click below and Alpha will take you straight to your dashboard.
              </Text>
            )}

            <Button style={button} href={magicLink}>
              Sign in to Alphacamper
            </Button>

            <Text style={hint}>
              Button not working?{' '}
              <a href={magicLink} style={link}>Copy this link</a>
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              This link expires in 1 hour and can only be used once.
            </Text>
            <Text style={footerText}>
              If you didn&apos;t request this, you can safely ignore it.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

export default MagicLinkEmail

// ─── Styles ───────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: '#f2f3f4',
  fontFamily: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  margin: 0,
  padding: '40px 0',
}

const container: React.CSSProperties = {
  maxWidth: '520px',
  margin: '0 auto',
}

const header: React.CSSProperties = {
  backgroundColor: '#1a2a2a',
  borderRadius: '12px 12px 0 0',
  padding: '24px 32px',
}

const wordmark: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '700',
  letterSpacing: '-0.3px',
  margin: 0,
}

const card: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '0 0 12px 12px',
  padding: '40px 32px 36px',
}

const heading: React.CSSProperties = {
  color: '#1a2a2a',
  fontSize: '24px',
  fontWeight: '700',
  letterSpacing: '-0.5px',
  lineHeight: '1.2',
  margin: '0 0 16px',
}

const bodyText: React.CSSProperties = {
  color: '#444444',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 32px',
}

const button: React.CSSProperties = {
  backgroundColor: '#2F847C',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  padding: '14px 28px',
  textDecoration: 'none',
}

const hint: React.CSSProperties = {
  color: '#888888',
  fontSize: '13px',
  marginTop: '20px',
}

const link: React.CSSProperties = {
  color: '#2F847C',
  textDecoration: 'underline',
}

const divider: React.CSSProperties = {
  borderColor: '#e0e0e0',
  margin: '0 0 24px',
}

const footer: React.CSSProperties = {
  padding: '0 8px',
}

const footerText: React.CSSProperties = {
  color: '#999999',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0 0 4px',
}
