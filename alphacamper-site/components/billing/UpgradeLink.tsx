import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

const PAYMENT_LINK = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK?.trim() ?? ''

function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

export function hasStripePaymentLink(): boolean {
  return isExternalUrl(PAYMENT_LINK)
}

export function getUpgradeHref(fallbackHref = '/#pricing'): string {
  return hasStripePaymentLink() ? PAYMENT_LINK : fallbackHref
}

interface UpgradeLinkProps {
  children: ReactNode
  className?: string
  fallbackHref?: string
  style?: CSSProperties
}

export function UpgradeLink({
  children,
  className,
  fallbackHref = '/#pricing',
  style,
}: UpgradeLinkProps) {
  const href = getUpgradeHref(fallbackHref)

  if (isExternalUrl(href)) {
    return (
      <a className={className} href={href} style={style}>
        {children}
      </a>
    )
  }

  return (
    <Link className={className} href={href} style={style}>
      {children}
    </Link>
  )
}
