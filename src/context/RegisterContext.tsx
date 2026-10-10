import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { enrollmentIdsEqual } from '@/lib/enrollmentUtils';

export interface Student {
  rollNumber: string;
  name: string;
  enrollmentNumber: string;
}

export interface ClassRegister {
  className: string;
  students: Student[];
  attendance: Record<string, string[]>; // date -> array of enrollment numbers present
  createdAt: string;
}

interface RegisterContextType {
  isLoaded: boolean;
  registers: ClassRegister[];
  createRegister: (className: string) => ClassRegister;
  addStudent: (className: string, student: Student) => boolean;
  updateStudent: (className: string, enrollmentNumber: string, updatedStudent: Student) => boolean;
  deleteStudent: (className: string, enrollmentNumber: string) => void;
  deleteRegister: (className: string) => void;
  getRegister: (className: string) => ClassRegister | undefined;
  markAttendanceInRegister: (className: string, date: string, enrollmentNumber: string) => boolean;
  getStudentAttendanceInRegister: (className: string, enrollmentNumber: string) => string[];
  getClassAttendanceForDate: (className: string, date: string) => string[];
  getAllRegisters: () => ClassRegister[];
  findStudentByEnrollment: (enrollmentNumber: string) => { student: Student; className: string } | null;
  markAttendanceByEnrollment: (date: string, enrollmentNumber: string) => { success: boolean; className?: string; message: string };
}

const RegisterContext = createContext<RegisterContextType | undefined>(undefined);

const REGISTER_STORAGE_KEY = 'class_registers';

export const RegisterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [registers, setRegisters] = useState<ClassRegister[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load stored registers before the scanner starts.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(REGISTER_STORAGE_KEY);
      if (stored) {
        setRegisters(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse stored registers:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save only after the initial stored data has loaded.
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(REGISTER_STORAGE_KEY, JSON.stringify(registers));
    }
  }, [registers, isLoaded]);

  const createRegister = (className: string): ClassRegister => {
    const existingRegister = registers.find(
      r => r.className.toLowerCase() === className.toLowerCase()
    );
    if (existingRegister) {
      return existingRegister;
    }

    const newRegister: ClassRegister = {
      className,
      students: [],
      attendance: {},
      createdAt: new Date().toISOString(),
    };
    setRegisters(prev => [...prev, newRegister]);
    return newRegister;
  };

  const addStudent = (className: string, student: Student): boolean => {
    const register = registers.find(
      r => r.className.toLowerCase() === className.toLowerCase()
    );
    if (!register) return false;

    // Check for duplicate enrollment number (normalized)
    if (register.students.some(s => enrollmentIdsEqual(s.enrollmentNumber, student.enrollmentNumber))) {
      return false;
    }

    // Sort students by roll number after adding
    const updatedStudents = [...register.students, student].sort((a, b) =>
      a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true })
    );

    setRegisters(prev =>
      prev.map(r =>
        r.className.toLowerCase() === className.toLowerCase()
          ? { ...r, students: updatedStudents }
          : r
      )
    );
    return true;
  };

  const updateStudent = (className: string, enrollmentNumber: string, updatedStudent: Student): boolean => {
    const register = registers.find(
      r => r.className.toLowerCase() === className.toLowerCase()
    );
    if (!register) return false;

    const studentIndex = register.students.findIndex(s => s.enrollmentNumber === enrollmentNumber);
    if (studentIndex === -1) return false;

    const updatedStudents = [...register.students];
    updatedStudents[studentIndex] = updatedStudent;

    // Sort by roll number
    updatedStudents.sort((a, b) =>
      a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true })
    );

    setRegisters(prev =>
      prev.map(r =>
        r.className.toLowerCase() === className.toLowerCase()
          ? { ...r, students: updatedStudents }
          : r
      )
    );
    return true;
  };

  const deleteStudent = (className: string, enrollmentNumber: string): void => {
    setRegisters(prev =>
      prev.map(r =>
        r.className.toLowerCase() === className.toLowerCase()
          ? { ...r, students: r.students.filter(s => s.enrollmentNumber !== enrollmentNumber) }
          : r
      )
    );
  };

  const deleteRegister = (className: string): void => {
    setRegisters(prev =>
      prev.filter(r => r.className.toLowerCase() !== className.toLowerCase())
    );
  };

  const getRegister = (className: string): ClassRegister | undefined => {
    return registers.find(r => r.className.toLowerCase() === className.toLowerCase());
  };

  const markAttendanceInRegister = (className: string, date: string, enrollmentNumber: string): boolean => {
    const register = registers.find(
      r => r.className.toLowerCase() === className.toLowerCase()
    );
    if (!register) return false;

    // Find student in register using normalized matching and use the stored (canonical) enrollmentNumber
    const student = register.students.find(s => enrollmentIdsEqual(s.enrollmentNumber, enrollmentNumber));
    if (!student) return false;
    const canonicalEnrollment = student.enrollmentNumber;

    // Check if already marked
    const dateAttendance = register.attendance[date] || [];
    const alreadyMarked = dateAttendance.some(e => enrollmentIdsEqual(e, canonicalEnrollment));

    // If it was already marked with a legacy/non-canonical value, normalize it so UI exports/grid show correctly.
    if (alreadyMarked) {
      setRegisters(prev =>
        prev.map(r =>
          r.className.toLowerCase() === className.toLowerCase()
            ? {
                ...r,
                attendance: {
                  ...r.attendance,
                  [date]: [
                    ...(r.attendance[date] || []).filter(e => !enrollmentIdsEqual(e, canonicalEnrollment)),
                    canonicalEnrollment,
                  ],
                },
              }
            : r
        )
      );
      return false;
    }

    setRegisters(prev =>
      prev.map(r =>
        r.className.toLowerCase() === className.toLowerCase()
          ? {
              ...r,
              attendance: {
                ...r.attendance,
                [date]: [...dateAttendance, canonicalEnrollment],
              },
            }
          : r
      )
    );
    return true;
  };

  const getStudentAttendanceInRegister = (className: string, enrollmentNumber: string): string[] => {
    const register = registers.find(
      r => r.className.toLowerCase() === className.toLowerCase()
    );
    if (!register) return [];

    return Object.entries(register.attendance)
      .filter(([_, enrollments]) => enrollments.some(e => enrollmentIdsEqual(e, enrollmentNumber)))
      .map(([date]) => date);
  };

  const getClassAttendanceForDate = (className: string, date: string): string[] => {
    const register = registers.find(
      r => r.className.toLowerCase() === className.toLowerCase()
    );
    if (!register) return [];

    return register.attendance[date] || [];
  };

  const getAllRegisters = (): ClassRegister[] => {
    return registers;
  };

  // Find a student across all registers by enrollment number
  const findStudentByEnrollment = (enrollmentNumber: string): { student: Student; className: string } | null => {
    for (const register of registers) {
      const student = register.students.find(s => enrollmentIdsEqual(s.enrollmentNumber, enrollmentNumber));
      if (student) {
        return { student, className: register.className };
      }
    }
    return null;
  };

  // Mark attendance automatically finding the student's class
  const markAttendanceByEnrollment = (date: string, enrollmentNumber: string): { success: boolean; className?: string; message: string } => {
    const result = findStudentByEnrollment(enrollmentNumber);
    
    if (!result) {
      return { success: false, message: 'Student not registered in any class' };
    }

    const { className, student } = result;
    const canonicalEnrollment = student.enrollmentNumber;
    
    // Check if already marked for this date
    const register = registers.find(r => r.className.toLowerCase() === className.toLowerCase());
    if (register) {
      const dateAttendance = register.attendance[date] || [];
      if (dateAttendance.some(e => enrollmentIdsEqual(e, canonicalEnrollment))) {
        // Ensure canonical value is stored (migration for legacy values)
        markAttendanceInRegister(className, date, canonicalEnrollment);
        return { success: false, className, message: 'Already marked present' };
      }
    }

    const success = markAttendanceInRegister(className, date, canonicalEnrollment);
    
    if (success) {
      return { success: true, className, message: `Marked present in ${className}` };
    }
    
    return { success: false, className, message: 'Failed to mark attendance' };
  };

  return (
    <RegisterContext.Provider
      value={{
        registers,
        isLoaded,
        createRegister,
        addStudent,
        updateStudent,
        deleteStudent,
        deleteRegister,
        getRegister,
        markAttendanceInRegister,
        getStudentAttendanceInRegister,
        getClassAttendanceForDate,
        getAllRegisters,
        findStudentByEnrollment,
        markAttendanceByEnrollment,
      }}
    >
      {children}
    </RegisterContext.Provider>
  );
};

export const useRegister = () => {
  const context = useContext(RegisterContext);
  if (!context) {
    throw new Error('useRegister must be used within RegisterProvider');
  }
  return context;
};


