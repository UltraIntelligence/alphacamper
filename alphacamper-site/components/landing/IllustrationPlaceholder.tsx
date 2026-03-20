interface IllustrationPlaceholderProps {
  description: string
  dark?: boolean
  hero?: boolean
}

export function IllustrationPlaceholder({ description, dark, hero }: IllustrationPlaceholderProps) {
  const classes = [
    'illust-placeholder',
    dark && 'illust-placeholder-dark',
    hero && 'illust-hero',
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <p>{description}</p>
    </div>
  )
}
