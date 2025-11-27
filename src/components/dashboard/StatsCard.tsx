import { Task } from '../../types'

interface StatsCardProps {
  title: string
  value: number
  icon: string
  color: 'blue' | 'green' | 'red' | 'yellow'
}

const colorClasses = {
  blue: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300',
  green: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300',
  red: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300',
  yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300',
}

export default function StatsCard({ title, value, icon, color }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className={`p-4 rounded-full ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  )
}

