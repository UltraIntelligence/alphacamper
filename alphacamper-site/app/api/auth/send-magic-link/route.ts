import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import { MagicLinkEmail } from '@/emails/MagicLinkEmail'

export async function POST(req: NextRequest) {
  try {
    const { email, redirectTo, campgroundName } = await req.json() as {
      email?: string
      redirectTo?: string
      campgroundName?: string
    }

    if (!email || !redirectTo) {
      return NextResponse.json({ error: 'email and redirectTo are required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const resendApiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    if (!resendApiKey || !fromEmail) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    // Generate magic link via Supabase admin (does not send email)
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    })

    if (linkError || !data?.properties?.action_link) {
      return NextResponse.json({ error: linkError?.message ?? 'Failed to generate link' }, { status: 500 })
    }

    const magicLink = data.properties.action_link

    // Render React Email template to HTML
    const html = await render(MagicLinkEmail({ magicLink, campgroundName }))

    // Send via Resend
    const resend = new Resend(resendApiKey)
    const { error: sendError } = await resend.emails.send({
      from: `Alphacamper <${fromEmail}>`,
      to: email,
      subject: 'Sign in to Alphacamper',
      html,
    })

    if (sendError) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ error: null })
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
