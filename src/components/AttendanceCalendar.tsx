import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAttendance } from '@/context/AttendanceContext';

interface AttendanceCalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AttendanceCalendar = ({ onDateSelect, selectedDate }: AttendanceCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);
  const { sessions } = useAttendance();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of the week the month starts on (0-6)
  const startDayOfWeek = getDay(monthStart);
  
  // Create empty slots for days before the month starts
  const emptySlots = Array(startDayOfWeek).fill(null);

  // Check if a date has sessions
  const hasSessionsOnDate = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.some(s => s.date === dateStr);
  };

  const getSessionCount = (date: Date): number => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.filter(s => s.date === dateStr).length;
  };

  const goToPrevMonth = () => {
    setDirection(-1);
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setDirection(1);
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-4 mx-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goToPrevMonth}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </motion.button>
        
        <h2 className="text-xl font-semibold text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={goToNextMonth}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-foreground" />
        </motion.button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={format(currentMonth, 'yyyy-MM')}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="grid grid-cols-7 gap-1"
        >
          {/* Empty slots */}
          {emptySlots.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}
          
          {/* Days */}
          {daysInMonth.map(day => {
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const hasSessions = hasSessionsOnDate(day);
            const sessionCount = getSessionCount(day);

            return (
              <motion.button
                key={day.toISOString()}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDateSelect(day)}
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center relative",
                  "transition-all duration-200",
                  isSelected && "gradient-primary text-primary-foreground shadow-glow",
                  !isSelected && isTodayDate && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                  !isSelected && !isTodayDate && "hover:bg-secondary",
                  !isSameMonth(day, currentMonth) && "opacity-30"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-primary-foreground" : "text-foreground"
                )}>
                  {format(day, 'd')}
                </span>
                
                {hasSessions && !isSelected && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {Array(Math.min(sessionCount, 3)).fill(null).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full bg-accent"
                      />
                    ))}
                  </div>
                )}
                
                {hasSessions && isSelected && (
                  <span className="text-[10px] mt-0.5 text-primary-foreground/80">
                    {sessionCount} class{sessionCount > 1 ? 'es' : ''}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
