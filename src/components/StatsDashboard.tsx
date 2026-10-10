import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Users, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { useAttendance } from '@/context/AttendanceContext';
import { format, subDays } from 'date-fns';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}

const StatCard = ({ icon: Icon, label, value, subtext, color = 'primary' }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-card rounded-xl p-4 shadow-card"
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        color === 'primary' ? 'bg-primary/10' : 
        color === 'success' ? 'bg-green-500/10' : 
        color === 'warning' ? 'bg-amber-500/10' : 
        'bg-destructive/10'
      }`}>
        <Icon className={`w-5 h-5 ${
          color === 'primary' ? 'text-primary' : 
          color === 'success' ? 'text-green-600' : 
          color === 'warning' ? 'text-amber-600' : 
          'text-destructive'
        }`} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </div>
    </div>
  </motion.div>
);

const COLORS = ['hsl(187, 72%, 38%)', 'hsl(38, 92%, 50%)', 'hsl(152, 69%, 40%)', 'hsl(280, 60%, 50%)'];

export const StatsDashboard = () => {
  const { sessions, getAllClasses } = useAttendance();

  const stats = useMemo(() => {
    const allClasses = getAllClasses();
    const totalSessions = sessions.length;
    const totalAttendance = sessions.reduce((sum, s) => sum + s.attendance.length, 0);
    
    // Get unique students
    const uniqueStudents = new Set<string>();
    sessions.forEach(session => {
      session.attendance.forEach(record => {
        uniqueStudents.add(record.enrollmentNumber);
      });
    });

    // Calculate attendance by class for pie chart
    const classStats = allClasses.map(className => {
      const classSessions = sessions.filter(s => s.className === className);
      const totalStudents = classSessions.reduce((sum, s) => sum + s.attendance.length, 0);
      return {
        name: className,
        value: totalStudents,
        sessions: classSessions.length
      };
    });

    // Last 7 days attendance trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
      const dayLabel = format(subDays(new Date(), 6 - i), 'EEE');
      const daySessions = sessions.filter(s => s.date === date);
      const attendance = daySessions.reduce((sum, s) => sum + s.attendance.length, 0);
      return { date: dayLabel, attendance, sessions: daySessions.length };
    });

    // Find students with low attendance (appeared in less than 50% of sessions per class)
    const lowAttendanceStudents: { enrollment: string; className: string; percentage: number }[] = [];
    
    allClasses.forEach(className => {
      const classSessions = sessions.filter(s => s.className === className);
      if (classSessions.length < 2) return;
      
      const studentAppearances = new Map<string, number>();
      classSessions.forEach(session => {
        session.attendance.forEach(record => {
          studentAppearances.set(
            record.enrollmentNumber,
            (studentAppearances.get(record.enrollmentNumber) || 0) + 1
          );
        });
      });

      studentAppearances.forEach((count, enrollment) => {
        const percentage = (count / classSessions.length) * 100;
        if (percentage < 50) {
          lowAttendanceStudents.push({ enrollment, className, percentage: Math.round(percentage) });
        }
      });
    });

    // Sort by lowest attendance
    lowAttendanceStudents.sort((a, b) => a.percentage - b.percentage);

    return {
      totalSessions,
      totalClasses: allClasses.length,
      totalAttendance,
      uniqueStudents: uniqueStudents.size,
      classStats,
      last7Days,
      lowAttendanceStudents: lowAttendanceStudents.slice(0, 5),
      avgAttendancePerSession: totalSessions > 0 ? Math.round(totalAttendance / totalSessions) : 0
    };
  }, [sessions, getAllClasses]);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No attendance data yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start taking attendance to see statistics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Calendar}
          label="Total Sessions"
          value={stats.totalSessions}
          color="primary"
        />
        <StatCard
          icon={Users}
          label="Unique Students"
          value={stats.uniqueStudents}
          color="success"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg per Session"
          value={stats.avgAttendancePerSession}
          subtext="students"
          color="warning"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low Attendance"
          value={stats.lowAttendanceStudents.length}
          subtext="students"
          color="destructive"
        />
      </div>

      {/* Attendance by Class - Pie Chart */}
      {stats.classStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-4 shadow-card"
        >
          <h3 className="font-semibold text-foreground mb-4">Attendance by Class</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.classStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {stats.classStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number, name: string) => [`${value} students`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Last 7 Days Trend - Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-4 shadow-card"
      >
        <h3 className="font-semibold text-foreground mb-4">Last 7 Days Trend</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.last7Days}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value} students`, 'Attendance']}
              />
              <Bar 
                dataKey="attendance" 
                fill="hsl(187, 72%, 38%)" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Low Attendance Alerts */}
      {stats.lowAttendanceStudents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-4 shadow-card"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-foreground">Low Attendance Alerts</h3>
          </div>
          <div className="space-y-2">
            {stats.lowAttendanceStudents.map((student, index) => (
              <div
                key={`${student.enrollment}-${student.className}`}
                className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg"
              >
                <div>
                  <p className="font-medium text-foreground">{student.enrollment}</p>
                  <p className="text-sm text-muted-foreground">{student.className}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-destructive">{student.percentage}%</p>
                  <p className="text-xs text-muted-foreground">attendance</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
