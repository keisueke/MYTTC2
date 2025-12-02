interface StatsCardProps {
  title: string
  value: number | string
  icon: string
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange'
  subtitle?: string
}

const colorClasses = {
  blue: {
    border: 'border-l-[var(--color-tertiary)]',
    icon: 'text-[var(--color-tertiary)]',
    glow: 'group-hover:shadow-[0_0_20px_rgba(91,141,239,0.2)]',
  },
  green: {
    border: 'border-l-[var(--color-secondary)]',
    icon: 'text-[var(--color-secondary)]',
    glow: 'group-hover:shadow-[0_0_20px_rgba(0,212,170,0.2)]',
  },
  red: {
    border: 'border-l-[var(--color-error)]',
    icon: 'text-[var(--color-error)]',
    glow: 'group-hover:shadow-[0_0_20px_rgba(255,71,87,0.2)]',
  },
  yellow: {
    border: 'border-l-[var(--color-warning)]',
    icon: 'text-[var(--color-warning)]',
    glow: 'group-hover:shadow-[0_0_20px_rgba(255,184,0,0.2)]',
  },
  purple: {
    border: 'border-l-purple-500',
    icon: 'text-purple-500',
    glow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]',
  },
  orange: {
    border: 'border-l-[var(--color-accent)]',
    icon: 'text-[var(--color-accent)]',
    glow: 'group-hover:shadow-[0_0_20px_rgba(255,107,53,0.2)]',
  },
}

export default function StatsCard({ title, value, icon, color, subtitle }: StatsCardProps) {
  const classes = colorClasses[color]
  
  return (
    <div className={`group card-industrial p-6 border-l-4 ${classes.border} ${classes.glow} transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-tertiary)] mb-3">
            {title}
          </p>
          <p className="font-display text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {value}
          </p>
          {subtitle && (
            <p className="font-display text-xs text-[var(--color-text-tertiary)] mt-2">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`text-3xl ${classes.icon} opacity-50 group-hover:opacity-100 transition-opacity`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
