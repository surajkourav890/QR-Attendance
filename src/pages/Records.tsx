import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  BookOpen, 
  User, 
  Search, 
  ArrowLeft,
  ChevronRight,
  Users,
  ScanLine
} from 'lucide-react';
import { format } from 'date-fns';
import { BottomNav } from '@/components/BottomNav';
import { SessionCard } from '@/components/SessionCard';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { ExportDropdown } from '@/components/ExportDropdown';
import { useAttendance, ClassSession } from '@/context/AttendanceContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  exportSessionToCSV, 
  exportClassToCSV, 
  exportToCSV,
  exportSessionToPDF,
  exportClassToPDF,
  exportToPDF
} from '@/lib/exportUtils';
import { toast } from 'sonner';

type ViewMode = 'date' | 'class' | 'student';

interface TabProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const Tab = ({ icon: Icon, label, isActive, onClick }: TabProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all",
      isActive 
        ? "gradient-primary text-primary-foreground shadow-glow" 
        : "bg-secondary text-secondary-foreground"
    )}
  >
    <Icon className="w-4 h-4" />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

const Records = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const { sessions, getAllClasses, getSessionsByClass, getStudentAttendance, deleteSession, setCurrentSession } = useAttendance();
  const navigate = useNavigate();

  const handleContinueScanning = (session: ClassSession) => {
    setCurrentSession(session);
    navigate('/scanner');
    toast.success(`Continue scanning for ${session.className}`);
  };

  const handleExportSessionCSV = (e: React.MouseEvent, session: ClassSession) => {
    e.stopPropagation();
    exportSessionToCSV(session);
    toast.success('Attendance exported to CSV');
  };

  const handleExportSessionPDF = (session: ClassSession) => {
    exportSessionToPDF(session);
    toast.success('PDF export opened');
  };

  const handleExportClassCSV = (className: string, classSessions: ClassSession[]) => {
    exportClassToCSV(classSessions, className);
    toast.success(`${className} attendance exported to CSV`);
  };

  const handleExportClassPDF = (className: string, classSessions: ClassSession[]) => {
    exportClassToPDF(classSessions, className);
    toast.success('PDF export opened');
  };

  const handleExportAllCSV = () => {
    if (sessions.length === 0) {
      toast.error('No attendance records to export');
      return;
    }
    exportToCSV(sessions, 'all_attendance');
    toast.success('All attendance exported to CSV');
  };

  const handleExportAllPDF = () => {
    if (sessions.length === 0) {
      toast.error('No attendance records to export');
      return;
    }
    exportToPDF(sessions, 'all_attendance');
    toast.success('PDF export opened');
  };

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (sessionToDelete) {
      deleteSession(sessionToDelete);
      setSessionToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  // Group sessions by date
  const sessionsByDate = sessions.reduce((acc, session) => {
    if (!acc[session.date]) {
      acc[session.date] = [];
    }
    acc[session.date].push(session);
    return acc;
  }, {} as Record<string, ClassSession[]>);

  const sortedDates = Object.keys(sessionsByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const allClasses = getAllClasses();

  // Search for student
  const studentResults = searchQuery.trim() 
    ? getStudentAttendance(searchQuery.trim())
    : null;

  // Detail view for a session
  if (selectedSession) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="safe-area-top bg-card border-b border-border">
          <div className="flex items-center gap-4 px-4 py-4">
            <button
              onClick={() => setSelectedSession(null)}
              className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{selectedSession.className}</h1>
              <p className="text-sm text-muted-foreground">
                {format(new Date(selectedSession.date), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between gap-2 mb-4 p-4 bg-card rounded-xl shadow-card">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">
                {selectedSession.attendance.length} Students Present
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleContinueScanning(selectedSession)}
                className="gap-1"
              >
                <ScanLine className="w-4 h-4" />
                <span className="hidden sm:inline">Scan More</span>
              </Button>
              <ExportDropdown
                onExportCSV={() => {
                  exportSessionToCSV(selectedSession);
                  toast.success('Attendance exported to CSV');
                }}
                onExportPDF={() => handleExportSessionPDF(selectedSession)}
              />
            </div>
          </div>

          {selectedSession.attendance.length > 0 ? (
            <div className="space-y-2">
              {selectedSession.attendance.map((record, index) => (
                <motion.div
                  key={record.enrollmentNumber}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-card rounded-xl shadow-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{record.enrollmentNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(record.timestamp), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No attendance records</p>
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    );
  }

  // Class list view
  if (selectedClass) {
    const classSessions = getSessionsByClass(selectedClass);
    
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="safe-area-top bg-card border-b border-border">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedClass(null)}
                className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-foreground" />
              </button>
              <h1 className="text-xl font-semibold text-foreground">{selectedClass}</h1>
            </div>
            <ExportDropdown
              onExportCSV={() => handleExportClassCSV(selectedClass, classSessions)}
              onExportPDF={() => handleExportClassPDF(selectedClass, classSessions)}
              label="Export All"
            />
          </div>
        </div>

        <div className="p-4 space-y-3">
          {classSessions.length > 0 ? (
            classSessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                showDate
                onClick={() => setSelectedSession(session)}
                onDelete={(e) => handleDeleteClick(e, session.id)}
                onContinueScan={() => handleContinueScanning(session)}
                onExport={(e) => handleExportSessionCSV(e, session)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No sessions found</p>
            </div>
          )}
        </div>

        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
        />

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="safe-area-top bg-card border-b border-border">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Attendance Records</h1>
          {sessions.length > 0 && (
            <ExportDropdown
              onExportCSV={handleExportAllCSV}
              onExportPDF={handleExportAllPDF}
              label="Export All"
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4">
        <div className="flex gap-2">
          <Tab
            icon={CalendarIcon}
            label="By Date"
            isActive={viewMode === 'date'}
            onClick={() => setViewMode('date')}
          />
          <Tab
            icon={BookOpen}
            label="By Class"
            isActive={viewMode === 'class'}
            onClick={() => setViewMode('class')}
          />
          <Tab
            icon={User}
            label="Student"
            isActive={viewMode === 'student'}
            onClick={() => setViewMode('student')}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          {/* Date View */}
          {viewMode === 'date' && (
            <motion.div
              key="date"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {sortedDates.length > 0 ? (
                sortedDates.map(date => (
                  <div key={date}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                    </h3>
                    <div className="space-y-3">
                      {sessionsByDate[date].map(session => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          onClick={() => setSelectedSession(session)}
                          onDelete={(e) => handleDeleteClick(e, session.id)}
                          onContinueScan={() => handleContinueScanning(session)}
                          onExport={(e) => handleExportSessionCSV(e, session)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No attendance records yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start by taking attendance from the calendar
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Class View */}
          {viewMode === 'class' && (
            <motion.div
              key="class"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {allClasses.length > 0 ? (
                allClasses.map(className => {
                  const classSessions = getSessionsByClass(className);
                  const totalStudents = classSessions.reduce(
                    (sum, s) => sum + s.attendance.length, 0
                  );
                  
                  return (
                    <motion.button
                      key={className}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedClass(className)}
                      className="w-full bg-card rounded-xl p-4 shadow-card flex items-center gap-4 text-left"
                    >
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{className}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>{classSessions.length} sessions</span>
                          <span>•</span>
                          <span>{totalStudents} total attendance</span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </motion.button>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No classes recorded yet</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Student View */}
          {viewMode === 'student' && (
            <motion.div
              key="student"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter enrollment number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 rounded-xl"
                />
              </div>

              {studentResults && searchQuery.trim() && (
                <div className="space-y-4">
                  <div className="p-4 bg-card rounded-xl shadow-card">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{searchQuery}</h3>
                        <p className="text-sm text-muted-foreground">
                          Present in {studentResults.present.length} class{studentResults.present.length !== 1 ? 'es' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {studentResults.present.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground">
                        Attendance History
                      </h4>
                      {studentResults.present.map(session => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          showDate
                          onClick={() => setSelectedSession(session)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No attendance records found for this enrollment number
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!searchQuery.trim() && (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Search by enrollment number to view student attendance
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />

      <BottomNav />
    </div>
  );
};

export default Records;
