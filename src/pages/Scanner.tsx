import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ScanLine } from 'lucide-react';
import { QRScanner } from '@/components/QRScanner';
import { BottomNav } from '@/components/BottomNav';
import { useAttendance } from '@/context/AttendanceContext';
import { useRegister } from '@/context/RegisterContext';

const Scanner = () => {
  const {
    currentSession,
    setCurrentSession,
    createSession,
    isLoaded: attendanceLoaded,
  } = useAttendance();
  const { isLoaded: registersLoaded } = useRegister();
  const navigate = useNavigate();
  const startupSessionCreated = useRef(false);

  useEffect(() => {
    if (
      attendanceLoaded &&
      registersLoaded &&
      !currentSession &&
      !startupSessionCreated.current
    ) {
      startupSessionCreated.current = true;
      createSession(format(new Date(), 'yyyy-MM-dd'), 'Quick Attendance');
    }
  }, [attendanceLoaded, registersLoaded, currentSession, createSession]);

  const handleClose = () => {
    setCurrentSession(null);
    navigate('/calendar');
  };

  if (currentSession) {
    return <QRScanner session={currentSession} onClose={handleClose} />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6"
        >
          <ScanLine className="w-10 h-10 text-primary animate-pulse" />
        </motion.div>
        <h1 className="text-xl font-semibold text-foreground">Starting QR scanner</h1>
        <p className="text-muted-foreground mt-2">
          Preparing today's Quick Attendance session
        </p>
      </div>
      <BottomNav />
    </div>
  );
};

export default Scanner;
