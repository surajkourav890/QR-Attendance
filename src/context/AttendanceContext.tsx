import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AttendanceRecord {
  enrollmentNumber: string;
  timestamp: string;
}

export interface ClassSession {
  id: string;
  date: string;
  className: string;
  attendance: AttendanceRecord[];
  createdAt: string;
}

interface AttendanceContextType {
  isLoaded: boolean;
  sessions: ClassSession[];
  currentSession: ClassSession | null;
  createSession: (date: string, className: string) => ClassSession;
  setCurrentSession: (session: ClassSession | null) => void;
  markAttendance: (sessionId: string, enrollmentNumber: string) => boolean;
  deleteSession: (sessionId: string) => void;
  getSessionsByDate: (date: string) => ClassSession[];
  getSessionsByClass: (className: string) => ClassSession[];
  getStudentAttendance: (enrollmentNumber: string) => { present: ClassSession[]; dates: string[] };
  getAllClasses: () => string[];
  isStudentMarked: (sessionId: string, enrollmentNumber: string) => boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

const STORAGE_KEY = 'attendance_sessions';

export const AttendanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSession, setCurrentSession] = useState<ClassSession | null>(null);

  // Load stored sessions before allowing the app to create a startup session.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse stored sessions:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save only after the initial stored data has loaded.
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions, isLoaded]);

  const createSession = (date: string, className: string): ClassSession => {
    const newSession: ClassSession = {
      id: `${date}-${className}-${Date.now()}`,
      date,
      className,
      attendance: [],
      createdAt: new Date().toISOString(),
    };
    setSessions(prev => [...prev, newSession]);
    setCurrentSession(newSession);
    return newSession;
  };

  // Helper function to sort attendance by enrollment number (ascending)
  const sortAttendance = (attendance: AttendanceRecord[]): AttendanceRecord[] => {
    return [...attendance].sort((a, b) => 
      a.enrollmentNumber.localeCompare(b.enrollmentNumber, undefined, { numeric: true })
    );
  };

  const markAttendance = (sessionId: string, enrollmentNumber: string): boolean => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return false;

    // Check for duplicate
    if (session.attendance.some(a => a.enrollmentNumber === enrollmentNumber)) {
      return false;
    }

    const newRecord: AttendanceRecord = {
      enrollmentNumber,
      timestamp: new Date().toISOString(),
    };

    setSessions(prev =>
      prev.map(s =>
        s.id === sessionId
          ? { ...s, attendance: sortAttendance([...s.attendance, newRecord]) }
          : s
      )
    );

    // Update current session if it's the one being modified
    if (currentSession?.id === sessionId) {
      setCurrentSession(prev => prev ? {
        ...prev,
        attendance: sortAttendance([...prev.attendance, newRecord])
      } : null);
    }

    return true;
  };

  const isStudentMarked = (sessionId: string, enrollmentNumber: string): boolean => {
    const session = sessions.find(s => s.id === sessionId);
    return session?.attendance.some(a => a.enrollmentNumber === enrollmentNumber) ?? false;
  };

  const deleteSession = (sessionId: string): void => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
  };

  const getSessionsByDate = (date: string): ClassSession[] => {
    return sessions.filter(s => s.date === date);
  };

  const getSessionsByClass = (className: string): ClassSession[] => {
    return sessions.filter(s => s.className.toLowerCase() === className.toLowerCase());
  };

  const getStudentAttendance = (enrollmentNumber: string) => {
    const presentSessions = sessions.filter(s =>
      s.attendance.some(a => a.enrollmentNumber === enrollmentNumber)
    );
    return {
      present: presentSessions,
      dates: [...new Set(presentSessions.map(s => s.date))],
    };
  };

  const getAllClasses = (): string[] => {
    return [...new Set(sessions.map(s => s.className))];
  };

  return (
    <AttendanceContext.Provider
      value={{
        sessions,
        isLoaded,
        currentSession,
        createSession,
        setCurrentSession,
        markAttendance,
        deleteSession,
        getSessionsByDate,
        getSessionsByClass,
        getStudentAttendance,
        getAllClasses,
        isStudentMarked,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within AttendanceProvider');
  }
  return context;
};


