import { motion } from 'framer-motion';
import { BookOpen, Users, Clock, Trash2, ScanLine, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ClassSession } from '@/context/AttendanceContext';

export interface SessionCardProps {
  session: ClassSession;
  onClick?: () => void;
  showDate?: boolean;
  onDelete?: (e: React.MouseEvent) => void;
  onContinueScan?: () => void;
  onExport?: (e: React.MouseEvent) => void;
}

export const SessionCard = ({ 
  session, 
  onClick, 
  showDate = false, 
  onDelete,
  onContinueScan,
  onExport 
}: SessionCardProps) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="w-full bg-card rounded-xl p-4 shadow-card"
    >
      <button
        onClick={onClick}
        className="w-full flex items-center gap-4 text-left"
      >
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-6 h-6 text-primary-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{session.className}</h3>
          <div className="flex items-center gap-3 mt-1">
            {showDate && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{format(new Date(session.date), 'MMM d')}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{session.attendance.length} present</span>
            </div>
          </div>
        </div>
      </button>
      
      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border">
        {onContinueScan && (
          <button
            onClick={(e) => { e.stopPropagation(); onContinueScan(); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary text-sm font-medium"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan</span>
          </button>
        )}
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-secondary-foreground text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 rounded-full bg-destructive/10 hover:bg-destructive/20 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
