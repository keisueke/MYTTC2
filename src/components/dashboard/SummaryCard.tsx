import { Link } from 'react-router-dom'

interface AdditionalLink {
  to: string
  label: string
}

interface SummaryCardProps {
  title: string
  icon: string
  value: string | number
  subtitle?: string
  linkTo: string
  linkLabel?: string
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  additionalLinks?: AdditionalLink[]
}

export default function SummaryCard({
  title,
  icon,
  value,
  subtitle,
  linkTo,
  linkLabel = '詳細を見る',
  color = 'blue',
  additionalLinks = [],
}: SummaryCardProps) {
  const colorClasses = {
    blue: 'border-[var(--color-accent)]/30 bg-[var(--color-accent)]/5',
    green: 'border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
    orange: 'border-orange-500/30 bg-orange-500/5',
    red: 'border-[var(--color-error)]/30 bg-[var(--color-error)]/5',
  }

  return (
    <div className={`card-industrial p-4 border-2 ${colorClasses[color]} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="font-display text-sm font-semibold text-[var(--color-text-primary)]">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {additionalLinks.map((link, index) => (
            <Link
              key={index}
              to={link.to}
              className="btn-industrial text-xs px-3 py-1.5 hover:bg-[var(--color-secondary)] hover:text-[var(--color-bg-primary)] transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to={linkTo}
            className="btn-industrial text-xs px-3 py-1.5 hover:bg-[var(--color-accent)] hover:text-[var(--color-bg-primary)] transition-colors whitespace-nowrap"
          >
            {linkLabel} →
          </Link>
        </div>
      </div>
      
      <div className="flex items-baseline gap-3">
        <div className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
          {value}
        </div>
        {subtitle && (
          <p className="font-display text-xs text-[var(--color-text-tertiary)]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

