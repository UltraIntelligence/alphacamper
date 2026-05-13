// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

afterEach(() => {
  cleanup()
  vi.resetModules()
  delete process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK
})

describe('upgrade links', () => {
  it('falls back to the on-site pricing section until a payment link is configured', async () => {
    const { UpgradeLink, getUpgradeHref } = await import('@/components/billing/UpgradeLink')

    expect(getUpgradeHref('/watch/new')).toBe('/watch/new')

    render(<UpgradeLink>Upgrade now</UpgradeLink>)

    const link = screen.getByRole('link', { name: 'Upgrade now' })
    expect(link.getAttribute('href')).toBe('/#pricing')
  })

  it('uses the shared Stripe payment link on UpgradeLink consumers once configured', async () => {
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_123'

    const { UpgradeLink, getUpgradeHref } = await import('@/components/billing/UpgradeLink')
    const { TwoProducts } = await import('@/components/landing/TwoProducts')

    expect(getUpgradeHref('/watch/new')).toBe('https://buy.stripe.com/test_123')

    render(
      <>
        <UpgradeLink>Upgrade now</UpgradeLink>
        <TwoProducts />
      </>,
    )

    expect(screen.getByText('Exact dates only')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Upgrade now' }).getAttribute('href')).toBe(
      'https://buy.stripe.com/test_123',
    )
    expect(screen.getByRole('link', { name: 'Unlock Pro' }).getAttribute('href')).toBe(
      'https://buy.stripe.com/test_123',
    )
  })

  it('dashboard UpgradeCTA sends customers to free watch setup while checkout is not configured', async () => {
    const { UpgradeCTA } = await import('@/components/dashboard/UpgradeCTA')

    render(<UpgradeCTA />)

    const cta = screen.getByRole('link', { name: /Set up free watch/i })
    expect(cta.getAttribute('href')).toBe('/watch/new')
  })
})
