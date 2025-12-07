import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { addDays, subDays, startOfDay } from 'date-fns'

interface SelectedDateContextType {
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  goToToday: () => void
  goToPrevDay: () => void
  goToNextDay: () => void
  isToday: boolean
}

const SelectedDateContext = createContext<SelectedDateContextType | undefined>(undefined)

interface SelectedDateProviderProps {
  children: ReactNode
}

export function SelectedDateProvider({ children }: SelectedDateProviderProps) {
  const [selectedDate, setSelectedDateState] = useState<Date>(() => startOfDay(new Date()))

  const setSelectedDate = useCallback((date: Date) => {
    setSelectedDateState(startOfDay(date))
  }, [])

  const goToToday = useCallback(() => {
    setSelectedDateState(startOfDay(new Date()))
  }, [])

  const goToPrevDay = useCallback(() => {
    setSelectedDateState(prev => subDays(prev, 1))
  }, [])

  const goToNextDay = useCallback(() => {
    setSelectedDateState(prev => addDays(prev, 1))
  }, [])

  const isToday = startOfDay(new Date()).getTime() === selectedDate.getTime()

  return (
    <SelectedDateContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        goToToday,
        goToPrevDay,
        goToNextDay,
        isToday,
      }}
    >
      {children}
    </SelectedDateContext.Provider>
  )
}

export function useSelectedDate() {
  const context = useContext(SelectedDateContext)
  if (context === undefined) {
    throw new Error('useSelectedDate must be used within a SelectedDateProvider')
  }
  return context
}

