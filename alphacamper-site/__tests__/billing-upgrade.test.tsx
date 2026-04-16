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

  it('uses the shared Stripe payment link everywhere once configured', async () => {
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_123'

    const { UpgradeLink, getUpgradeHref } = await import('@/components/billing/UpgradeLink')
    const { TwoProducts } = await import('@/components/landing/TwoProducts')
    const { UpgradeCTA } = await import('@/components/dashboard/UpgradeCTA')

    expect(getUpgradeHref('/watch/new')).toBe('https://buy.stripe.com/test_123')

    render(
      <>
        <UpgradeLink>Upgrade now</UpgradeLink>
        <TwoProducts />
        <UpgradeCTA />
      </>
    )

    expect(screen.getByText('Exact dates only')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Upgrade now' }).getAttribute('href')).toBe('https://buy.stripe.com/test_123')
    expect(screen.getByRole('link', { name: 'Unlock Pro' }).getAttribute('href')).toBe('https://buy.stripe.com/test_123')
    expect(screen.getByRole('link', { name: 'See Pro features →' }).getAttribute('href')).toBe('https://buy.stripe.com/test_123')
  })
})
