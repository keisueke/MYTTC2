import { DailyRecord } from '../../types'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface MealTableProps {
  records: DailyRecord[]
}

export default function MealTable({ records }: MealTableProps) {
  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-text-tertiary)]">
        データがありません
      </div>
    )
  }

  const hasMealData = records.some(r => r.breakfast || r.lunch || r.dinner || r.snack)
  
  if (!hasMealData) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-text-tertiary)]">
        食事の記録がありません
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left p-3 font-display text-xs tracking-[0.1em] uppercase text-[var(--color-text-primary)]">
              日付
            </th>
            <th className="text-left p-3 font-display text-xs tracking-[0.1em] uppercase text-[var(--color-text-primary)]">
              朝食
            </th>
            <th className="text-left p-3 font-display text-xs tracking-[0.1em] uppercase text-[var(--color-text-primary)]">
              昼食
            </th>
            <th className="text-left p-3 font-display text-xs tracking-[0.1em] uppercase text-[var(--color-text-primary)]">
              夕食
            </th>
            <th className="text-left p-3 font-display text-xs tracking-[0.1em] uppercase text-[var(--color-text-primary)]">
              間食
            </th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const hasMeal = record.breakfast || record.lunch || record.dinner || record.snack
            if (!hasMeal) return null

            return (
              <tr key={record.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]">
                <td className="p-3 text-[var(--color-text-primary)]">
                  {format(new Date(record.date), 'yyyy年MM月dd日(E)', { locale: ja })}
                </td>
                <td className="p-3 text-[var(--color-text-secondary)]">
                  {record.breakfast || <span className="text-[var(--color-text-tertiary)]">記録なし</span>}
                </td>
                <td className="p-3 text-[var(--color-text-secondary)]">
                  {record.lunch || <span className="text-[var(--color-text-tertiary)]">記録なし</span>}
                </td>
                <td className="p-3 text-[var(--color-text-secondary)]">
                  {record.dinner || <span className="text-[var(--color-text-tertiary)]">記録なし</span>}
                </td>
                <td className="p-3 text-[var(--color-text-secondary)]">
                  {record.snack || <span className="text-[var(--color-text-tertiary)]">記録なし</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

