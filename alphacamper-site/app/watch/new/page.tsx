import { WatchWizard } from '@/components/watch/WatchWizard'

export const metadata = {
  title: 'Create a Watch — Alphacamper',
  description: 'Tell Alpha where you want to camp. We\'ll watch 24/7 and alert you when a site opens up.',
}

export default function WatchNewPage() {
  return (
    <main className="wizard-container">
      <div className="wizard-header">
        <h1>Set up your campsite watch</h1>
        <p>Tell Alpha where you want to camp. We'll watch 24/7 and alert you when a site opens.</p>
      </div>
      <div className="illustration-placeholder" style={{ marginBottom: '32px', maxWidth: '240px', marginInline: 'auto', minHeight: '120px' }}>
        Alpha with binoculars — eager to help
      </div>
      <WatchWizard />
    </main>
  )
}
