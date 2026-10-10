import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Users, X, ScanLine } from 'lucide-react';
import { format } from 'date-fns';
import { useAttendance, ClassSession } from '@/context/AttendanceContext';
import { useRegister } from '@/context/RegisterContext';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  session: ClassSession;
  onClose: () => void;
}

type ScanStatus = 'idle' | 'success' | 'duplicate' | 'warning' | 'error';

export const QRScanner = ({ session, onClose }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [lastScanned, setLastScanned] = useState<string>('');
  const [lastClassName, setLastClassName] = useState<string>('');
  const [attendanceCount, setAttendanceCount] = useState(session.attendance.length);
  const { markAttendance, isStudentMarked } = useAttendance();
  const { markAttendanceByEnrollment, findStudentByEnrollment } = useRegister();
  const cooldownRef = useRef(false);

  const handleScan = useCallback((decodedText: string) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;

    const enrollmentNumber = decodedText.trim();
    setLastScanned(enrollmentNumber);

    // Step 1: Always try to mark attendance in the current session (for records)
    const alreadyMarkedInSession = isStudentMarked(session.id, enrollmentNumber);
    
    if (!alreadyMarkedInSession) {
      const sessionSuccess = markAttendance(session.id, enrollmentNumber);
      if (sessionSuccess) {
        setAttendanceCount(prev => prev + 1);
      }
    }

    // Step 2: Try to find student in any register and mark in their own class
    const studentInfo = findStudentByEnrollment(enrollmentNumber);
    
    if (!studentInfo) {
      // Student not found in any register - still added to session records above
      // Show warning but it's not a complete error since session attendance was recorded
      setScanStatus('warning');
      setLastClassName('');
      
      setTimeout(() => {
        setScanStatus('idle');
        cooldownRef.current = false;
      }, 2000);
      return;
    }

    // Step 3: Mark in the student's OWN class register (auto-detected)
    const registerDate = format(new Date(session.date), 'yyyy-MM-dd');
    const registerResult = markAttendanceByEnrollment(registerDate, enrollmentNumber);
    
    if (registerResult.success) {
      // Successfully marked in their register
      setScanStatus('success');
      setLastClassName(registerResult.className || studentInfo.className);
    } else if (registerResult.message === 'Already marked present') {
      // Already marked in register for this date
      setScanStatus(alreadyMarkedInSession ? 'duplicate' : 'success');
      setLastClassName(registerResult.className || studentInfo.className);
    } else {
      // Some other issue - but student was found
      setScanStatus('success');
      setLastClassName(studentInfo.className);
    }

    // Reset status after delay
    setTimeout(() => {
      setScanStatus('idle');
      cooldownRef.current = false;
    }, 2000);
  }, [session.id, session.date, markAttendance, isStudentMarked, markAttendanceByEnrollment, findStudentByEnrollment]);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          handleScan,
          () => {} // Ignore errors during scanning
        );
        setIsScanning(true);
      } catch (err) {
        console.error('Failed to start scanner:', err);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [handleScan]);

  const getStatusIcon = () => {
    switch (scanStatus) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-success" />;
      case 'duplicate':
        return <AlertCircle className="w-8 h-8 text-accent" />;
      case 'warning':
        return <AlertCircle className="w-8 h-8 text-accent" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (scanStatus) {
      case 'success':
        return lastClassName ? `✓ Present in ${lastClassName}` : 'Attendance Recorded!';
      case 'duplicate':
        return lastClassName ? `Already marked in ${lastClassName}` : 'Already Marked';
      case 'warning':
        return 'Recorded (student not registered)';
      case 'error':
        return 'Not in any register (added to session)';
      default:
        return 'Scan Student QR Code';
    }
  };

  const getStatusBg = () => {
    switch (scanStatus) {
      case 'success':
        return 'bg-success';
      case 'duplicate':
        return 'bg-accent';
      case 'warning':
        return 'bg-accent';
      case 'error':
        return 'bg-destructive';
      default:
        return 'bg-card';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground flex flex-col">
      {/* Header */}
      <div className="safe-area-top bg-card/95 backdrop-blur-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">{session.className}</h2>
            <p className="text-sm text-muted-foreground">
              {format(new Date(session.date), 'MMM d, yyyy')}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">{attendanceCount}</span>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-6 h-6 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Scanner Container */}
      <div className="flex-1 flex flex-col items-center justify-center relative bg-black">
        {/* QR Reader */}
        <div className="relative">
          <div 
            id="qr-reader" 
            className="w-72 h-72 overflow-hidden rounded-2xl"
          />
          
          {/* Scanning animation overlay */}
          {isScanning && scanStatus === 'idle' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-0 right-0 h-0.5 gradient-primary animate-scan-line" />
            </div>
          )}

          {/* Corner decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
          </div>
        </div>

        {/* Status indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={scanStatus}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mt-8 px-6 py-3 rounded-2xl flex items-center gap-3 ${getStatusBg()}`}
          >
            {scanStatus !== 'idle' && getStatusIcon()}
            {scanStatus === 'idle' && <ScanLine className="w-6 h-6 text-muted-foreground" />}
            <div>
              <p className={`font-semibold ${scanStatus === 'idle' ? 'text-foreground' : 'text-white'}`}>
                {getStatusMessage()}
              </p>
              {lastScanned && scanStatus !== 'idle' && (
                <p className="text-sm text-white/80">
                  {lastScanned}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="safe-area-bottom bg-card p-4">
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full h-12 text-base rounded-xl"
        >
          Done ({attendanceCount} students marked)
        </Button>
      </div>
    </div>
  );
};
