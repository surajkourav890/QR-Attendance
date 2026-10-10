import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ClassNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (className: string) => void;
  selectedDate: Date;
}

export const ClassNameModal = ({ isOpen, onClose, onConfirm, selectedDate }: ClassNameModalProps) => {
  const [className, setClassName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (className.trim()) {
      onConfirm(className.trim());
      setClassName('');
    }
  };

  const handleClose = () => {
    setClassName('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed left-4 right-4 bottom-24 z-50 max-w-md mx-auto"
          >
            <div className="bg-card rounded-2xl shadow-lg overflow-hidden">
              {/* Header */}
              <div className="gradient-primary p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-primary-foreground">
                      New Class Session
                    </h3>
                    <p className="text-sm text-primary-foreground/80">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-primary-foreground/20 transition-colors"
                >
                  <X className="w-5 h-5 text-primary-foreground" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div>
                  <label htmlFor="className" className="block text-sm font-medium text-foreground mb-2">
                    Class / Subject Name
                  </label>
                  <Input
                    id="className"
                    type="text"
                    placeholder="e.g., Mathematics 101"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full h-12 text-base rounded-xl"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!className.trim()}
                  className="w-full h-12 text-base font-semibold rounded-xl gradient-primary hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Start Taking Attendance
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
