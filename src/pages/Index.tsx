import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AttendanceCalendar } from '@/components/AttendanceCalendar';
import { ClassNameModal } from '@/components/ClassNameModal';
import { SessionCard } from '@/components/SessionCard';
import { BottomNav } from '@/components/BottomNav';
import { useAttendance } from '@/context/AttendanceContext';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { getSessionsByDate, createSession, setCurrentSession } = useAttendance();
  const navigate = useNavigate();

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleStartNewSession = () => {
    if (selectedDate) {
      setIsModalOpen(true);
    }
  };

  const handleConfirmClass = (className: string) => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const session = createSession(dateStr, className);
      setCurrentSession(session);
      setIsModalOpen(false);
      navigate('/scanner');
    }
  };

  const sessionsForSelectedDate = selectedDate
    ? getSessionsByDate(format(selectedDate, 'yyyy-MM-dd'))
    : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="safe-area-top gradient-primary">
        <div className="px-4 pt-6 pb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-2xl font-bold text-primary-foreground">
              Attendance
            </h1>
            <p className="text-primary-foreground/80 mt-1">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="-mt-4"
      >
        <AttendanceCalendar
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
      </motion.div>

      {/* Selected Date Actions */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-4 mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {format(selectedDate, 'MMMM d, yyyy')}
            </h2>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStartNewSession}
              className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-primary-foreground font-medium shadow-glow"
            >
              <Plus className="w-5 h-5" />
              <span>New Class</span>
            </motion.button>
          </div>

          {/* Sessions for selected date */}
          {sessionsForSelectedDate.length > 0 ? (
            <div className="space-y-3">
              {sessionsForSelectedDate.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onClick={() => {
                    setCurrentSession(session);
                    navigate('/scanner');
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <ScanLine className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                No classes on this date yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Tap "New Class" to start taking attendance
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* No date selected message */}
      {!selectedDate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12 px-4"
        >
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <ScanLine className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            Select a date to start taking attendance
          </p>
        </motion.div>
      )}

      <ClassNameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmClass}
        selectedDate={selectedDate || new Date()}
      />

      <BottomNav />
    </div>
  );
};

export default Index;
