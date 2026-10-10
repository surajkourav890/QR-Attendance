import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Plus, 
  Users, 
  ChevronRight, 
  ArrowLeft,
  Trash2,
  Edit2,
  Calendar,
  Check,
  Download,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { format, getDaysInMonth, startOfMonth, getDate } from 'date-fns';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegister, Student, ClassRegister } from '@/context/RegisterContext';
import { useAttendance } from '@/context/AttendanceContext';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { exportRegisterToCSV, exportRegisterToPDF } from '@/lib/exportUtils';
import { enrollmentIdsEqual } from '@/lib/enrollmentUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ViewMode = 'list' | 'register' | 'add-student';

const Register = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'register' | 'student'; className: string; enrollmentNumber?: string } | null>(null);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  // New student form state
  const [newStudent, setNewStudent] = useState<Student>({
    rollNumber: '',
    name: '',
    enrollmentNumber: '',
  });

  const { 
    registers, 
    createRegister, 
    addStudent, 
    updateStudent,
    deleteStudent, 
    deleteRegister, 
    getRegister,
    getClassAttendanceForDate 
  } = useRegister();
  
  const { getAllClasses } = useAttendance();

  // Get all unique class names from both registers and sessions
  const allClasses = [...new Set([...registers.map(r => r.className), ...getAllClasses()])];

  const handleCreateClass = () => {
    if (!newClassName.trim()) {
      toast.error('Please enter a class name');
      return;
    }
    createRegister(newClassName.trim());
    toast.success(`Register created for ${newClassName}`);
    setNewClassName('');
    setIsAddingClass(false);
  };

  const handleAddStudent = () => {
    if (!selectedClass) return;
    
    if (!newStudent.rollNumber.trim() || !newStudent.name.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    // Enrollment Number is the value stored in QR codes.
    // This app uses the Roll Number as the enrollment/QR identifier.
    const enrollmentNumber = newStudent.rollNumber.trim();
    const studentToAdd = { ...newStudent, enrollmentNumber };

    const success = addStudent(selectedClass, studentToAdd);
    if (success) {
      toast.success('Student added successfully');
      setNewStudent({ rollNumber: '', name: '', enrollmentNumber: '' });
      setViewMode('register');
    } else {
      toast.error('Student with this roll number already exists');
    }
  };

  const handleUpdateStudent = () => {
    if (!selectedClass || !editingStudent) return;
    
    // When editing, keep the original enrollment number
    const studentToUpdate = { 
      ...newStudent, 
      enrollmentNumber: editingStudent.enrollmentNumber 
    };
    
    const success = updateStudent(selectedClass, editingStudent.enrollmentNumber, studentToUpdate);
    if (success) {
      toast.success('Student updated successfully');
      setNewStudent({ rollNumber: '', name: '', enrollmentNumber: '' });
      setEditingStudent(null);
      setViewMode('register');
    } else {
      toast.error('Failed to update student');
    }
  };

  const handleExportCSV = () => {
    if (!register) return;
    exportRegisterToCSV(register, selectedMonth);
    toast.success('Register exported as CSV');
  };

  const handleExportPDF = () => {
    if (!register) return;
    exportRegisterToPDF(register, selectedMonth);
    toast.success('Opening print dialog for PDF');
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'register') {
      deleteRegister(itemToDelete.className);
      toast.success('Register deleted');
      setSelectedClass(null);
      setViewMode('list');
    } else if (itemToDelete.type === 'student' && itemToDelete.enrollmentNumber) {
      deleteStudent(itemToDelete.className, itemToDelete.enrollmentNumber);
      toast.success('Student removed');
    }
    
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const openRegister = (className: string) => {
    // Ensure register exists
    const register = getRegister(className);
    if (!register) {
      createRegister(className);
    }
    setSelectedClass(className);
    setViewMode('register');
  };

  const register = selectedClass ? getRegister(selectedClass) : null;
  const daysInMonth = getDaysInMonth(selectedMonth);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Calculate attendance totals for each student
  const calculateStudentTotal = (enrollmentNumber: string): number => {
    if (!register) return 0;
    return Object.values(register.attendance).filter(
      enrollments => enrollments.some(e => enrollmentIdsEqual(e, enrollmentNumber))
    ).length;
  };

  // Check if student is present on a specific day
  const isPresent = (enrollmentNumber: string, day: number): boolean => {
    if (!register) return false;
    const dateStr = format(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day), 'yyyy-MM-dd');
    const attendance = register.attendance[dateStr] || [];
    return attendance.some(e => enrollmentIdsEqual(e, enrollmentNumber));
  };

  // Register View
  if (viewMode === 'register' && selectedClass && register) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="safe-area-top bg-card border-b border-border">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedClass(null);
                  setViewMode('list');
                }}
                className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-foreground" />
              </button>
              <h1 className="text-xl font-semibold text-foreground">{selectedClass}</h1>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCSV} className="gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    Export as CSV/Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
                    <FileText className="w-4 h-4" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setItemToDelete({ type: 'register', className: selectedClass });
                  setDeleteDialogOpen(true);
                }}
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setNewStudent({ rollNumber: '', name: '', enrollmentNumber: '' });
                  setEditingStudent(null);
                  setViewMode('add-student');
                }}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </Button>
            </div>
          </div>
        </div>

        {/* Month Selector */}
        <div className="px-4 py-3 flex items-center justify-between bg-card border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
          >
            ←
          </Button>
          <span className="font-medium text-foreground">
            {format(selectedMonth, 'MMMM yyyy')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
          >
            →
          </Button>
        </div>

        {/* Register Table */}
        <div className="p-4">
          {register.students.length > 0 ? (
            <div className="bg-card rounded-xl shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="sticky left-0 bg-card z-10 px-3 py-2 text-left text-xs font-semibold text-muted-foreground w-12">
                        Roll
                      </th>
                      <th className="sticky left-12 bg-card z-10 px-3 py-2 text-left text-xs font-semibold text-muted-foreground min-w-[100px]">
                        Name
                      </th>
                      {monthDays.map(day => (
                        <th key={day} className="px-1 py-2 text-center text-xs font-medium text-muted-foreground w-8">
                          {day}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center text-xs font-semibold text-muted-foreground w-12">
                        Total
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground w-16">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {register.students.map((student, index) => (
                      <tr 
                        key={student.enrollmentNumber}
                        className={cn(
                          "border-b border-border/50 last:border-b-0",
                          index % 2 === 0 ? "bg-background/50" : "bg-card"
                        )}
                      >
                        <td className="sticky left-0 bg-inherit z-10 px-3 py-2 text-sm font-medium text-foreground">
                          {student.rollNumber}
                        </td>
                        <td className="sticky left-12 bg-inherit z-10 px-3 py-2">
                          <div className="text-sm font-medium text-foreground truncate max-w-[100px]">
                            {student.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {student.enrollmentNumber}
                          </div>
                        </td>
                        {monthDays.map(day => (
                          <td key={day} className="px-1 py-2 text-center">
                            {isPresent(student.enrollmentNumber, day) ? (
                              <span className="text-success font-bold text-sm">P</span>
                            ) : (
                              <span className="text-muted-foreground/30 text-sm">-</span>
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {calculateStudentTotal(student.enrollmentNumber)}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingStudent(student);
                                setNewStudent(student);
                                setViewMode('add-student');
                              }}
                              className="p-1.5 rounded hover:bg-secondary transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => {
                                setItemToDelete({
                                  type: 'student',
                                  className: selectedClass,
                                  enrollmentNumber: student.enrollmentNumber,
                                });
                                setDeleteDialogOpen(true);
                              }}
                              className="p-1.5 rounded hover:bg-secondary transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl shadow-card">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No students in this register</p>
              <Button
                onClick={() => {
                  setNewStudent({ rollNumber: '', name: '', enrollmentNumber: '' });
                  setEditingStudent(null);
                  setViewMode('add-student');
                }}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add First Student
              </Button>
            </div>
          )}
        </div>

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
        />
        <BottomNav />
      </div>
    );
  }

  // Add Student View
  if (viewMode === 'add-student' && selectedClass) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="safe-area-top bg-card border-b border-border">
          <div className="flex items-center gap-4 px-4 py-4">
            <button
              onClick={() => {
                setEditingStudent(null);
                setViewMode('register');
              }}
              className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <h1 className="text-xl font-semibold text-foreground">
              {editingStudent ? 'Edit Student' : 'Add Student'}
            </h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-card rounded-xl p-4 shadow-card space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Roll Number
              </label>
              <Input
                placeholder="e.g., 1"
                value={newStudent.rollNumber}
                onChange={(e) => setNewStudent(prev => ({ ...prev, rollNumber: e.target.value }))}
                disabled={!!editingStudent}
              />
              {editingStudent && (
                <p className="text-xs text-muted-foreground mt-1">
                  Roll number cannot be changed
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">
                Student Name
              </label>
              <Input
                placeholder="e.g., John Doe"
                value={newStudent.name}
                onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <Button
              onClick={editingStudent ? handleUpdateStudent : handleAddStudent}
              className="w-full gradient-primary"
            >
              {editingStudent ? 'Update Student' : 'Add Student'}
            </Button>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  // Class List View (default)
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="safe-area-top bg-card border-b border-border">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Register</h1>
          <Button
            size="sm"
            onClick={() => setIsAddingClass(true)}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            New Class
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {allClasses.length > 0 ? (
          allClasses.map(className => {
            const register = getRegister(className);
            const studentCount = register?.students.length || 0;
            
            return (
              <motion.button
                key={className}
                whileTap={{ scale: 0.98 }}
                onClick={() => openRegister(className)}
                className="w-full bg-card rounded-xl p-4 shadow-card flex items-center gap-4 text-left"
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{className}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{studentCount} students</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            );
          })
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No classes yet</p>
            <p className="text-sm text-muted-foreground">
              Create a class from the calendar or add one here
            </p>
          </div>
        )}
      </div>

      {/* Add Class Dialog */}
      <Dialog open={isAddingClass} onOpenChange={setIsAddingClass}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Class Register</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Class Name (e.g., CS-101)"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateClass()}
            />
            <Button onClick={handleCreateClass} className="w-full gradient-primary">
              Create Register
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />

      <BottomNav />
    </div>
  );
};

export default Register;
