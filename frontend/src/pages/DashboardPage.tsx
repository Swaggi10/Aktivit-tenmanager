import { useState, useEffect } from 'react';
import {
  Trophy, Target, CheckCircle2, Clock, AlertTriangle,
  Users, TrendingUp, TrendingDown, AlertCircle, Bell
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatPoints } from '@/utils/formatters';
import { apiRequest } from '@/services/api';
import { Role, AdminDashboardData, UserWorkload, Task, TeamStats, Notification } from '@/types';

const DashboardPage = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === Role.ADMIN;

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return <MemberDashboard />;
};

// Admin Dashboard Component
const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboard, notifs] = await Promise.all([
          apiRequest<AdminDashboardData>('get', '/users/admin/dashboard'),
          apiRequest<Notification[]>('get', '/notifications?unreadOnly=true'),
        ]);
        setDashboardData(dashboard);
        setNotifications(notifs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="card p-6 bg-danger-50 text-danger-700">
        <AlertCircle className="w-6 h-6 mb-2" />
        <p>{error || 'Keine Daten verfügbar'}</p>
      </div>
    );
  }

  const { summary, teamStats, overloadedUsers, underutilizedUsers, overdueTasks } = dashboardData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Workload-Analyse und Team-Übersicht</p>
      </div>

      {/* Alert Banner for Critical Issues */}
      {(summary.overloadedCount > 0 || summary.overdueTaskCount > 0) && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-danger-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Achtung:</span>
            {summary.overloadedCount > 0 && (
              <span>{summary.overloadedCount} Mitarbeiter überlastet</span>
            )}
            {summary.overloadedCount > 0 && summary.overdueTaskCount > 0 && <span>|</span>}
            {summary.overdueTaskCount > 0 && (
              <span>{summary.overdueTaskCount} überfällige Aufgaben</span>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Mitarbeiter gesamt"
          value={summary.totalUsers}
          icon={Users}
          color="primary"
        />
        <StatCard
          label="Überlastet (>100%)"
          value={summary.overloadedCount}
          icon={TrendingUp}
          color={summary.overloadedCount > 0 ? 'danger' : 'success'}
        />
        <StatCard
          label="Unterausgelastet (<50%)"
          value={summary.underutilizedCount}
          icon={TrendingDown}
          color={summary.underutilizedCount > 0 ? 'warning' : 'success'}
        />
        <StatCard
          label="Überfällige Aufgaben"
          value={summary.overdueTaskCount}
          icon={AlertCircle}
          color={summary.overdueTaskCount > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Team Statistics */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Team-Auslastung</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {teamStats.map((team) => (
            <TeamStatCard key={team.teamId} team={team} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overloaded Users */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-danger-600" />
            Bottlenecks (Überlastete Mitarbeiter)
          </h2>
          {overloadedUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Keine Überlastungen</p>
          ) : (
            <div className="space-y-3">
              {overloadedUsers.map((user) => (
                <WorkloadUserCard key={user.userId} user={user} type="overloaded" />
              ))}
            </div>
          )}
        </div>

        {/* Underutilized Users */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-warning-600" />
            Unterauslastete Mitarbeiter
          </h2>
          {underutilizedUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Alle Mitarbeiter ausgelastet</p>
          ) : (
            <div className="space-y-3">
              {underutilizedUsers.map((user) => (
                <WorkloadUserCard key={user.userId} user={user} type="underutilized" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-danger-600" />
            Überfällige Aufgaben
          </h2>
          <div className="space-y-3">
            {overdueTasks.map((task) => (
              <OverdueTaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-600" />
            Neue Benachrichtigungen
          </h2>
          <div className="space-y-2">
            {notifications.slice(0, 5).map((notif) => (
              <div key={notif.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{notif.title}</p>
                  <p className="text-sm text-gray-600">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Member Dashboard Component
const MemberDashboard = () => {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await apiRequest<Task[]>('get', '/tasks');
        setTasks(data);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const stats = [
    {
      label: 'Punkte',
      value: formatPoints(user?.totalPoints || 0),
      icon: Trophy,
      color: 'text-warning-600',
      bg: 'bg-warning-50',
    },
    {
      label: 'Level',
      value: user?.level || 1,
      icon: Target,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    },
    {
      label: 'Abgeschlossen',
      value: tasks.filter(t => t.status === 'COMPLETED').length,
      icon: CheckCircle2,
      color: 'text-success-600',
      bg: 'bg-success-50',
    },
    {
      label: 'In Arbeit',
      value: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  const activeTasks = tasks.filter(t => t.status !== 'COMPLETED');
  const overdueTasks = activeTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Übersicht über deine Aktivitäten</p>
      </div>

      {/* Overdue Warning */}
      {overdueTasks.length > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-danger-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">
              {overdueTasks.length} überfällige Aufgabe(n)!
            </span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Tasks */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Aktuelle Aufgaben</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : activeTasks.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            Keine aktiven Aufgaben
          </div>
        ) : (
          <div className="space-y-3">
            {activeTasks.slice(0, 5).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable Components
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: 'primary' | 'success' | 'warning' | 'danger';
}

const StatCard = ({ label, value, icon: Icon, color }: StatCardProps) => {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50',
    success: 'text-success-600 bg-success-50',
    warning: 'text-warning-600 bg-warning-50',
    danger: 'text-danger-600 bg-danger-50',
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className={`w-6 h-6 ${colorClasses[color].split(' ')[0]}`} />
        </div>
      </div>
    </div>
  );
};

const TeamStatCard = ({ team }: { team: TeamStats }) => {
  const getUtilizationColor = (percentage: number) => {
    if (percentage > 100) return 'bg-danger-500';
    if (percentage > 80) return 'bg-warning-500';
    return 'bg-success-500';
  };

  const teamTypeLabels: Record<string, string> = {
    LEADGEN_MAIL: 'Lead Gen & Mail',
    AKQUISE: 'Akquise',
    SALES_DEV: 'Sales Development',
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900">{teamTypeLabels[team.teamType] || team.teamName}</h3>
      <p className="text-sm text-gray-500 mb-3">{team.memberCount} Mitarbeiter</p>

      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Auslastung</span>
          <span className={`font-medium ${team.utilizationPercentage > 100 ? 'text-danger-600' : 'text-gray-900'}`}>
            {team.utilizationPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getUtilizationColor(team.utilizationPercentage)}`}
            style={{ width: `${Math.min(team.utilizationPercentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mt-4">
        <div>
          <p className="text-lg font-bold text-gray-900">{team.openTasks}</p>
          <p className="text-xs text-gray-500">Offen</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{team.inProgressTasks}</p>
          <p className="text-xs text-gray-500">In Arbeit</p>
        </div>
        <div>
          <p className="text-lg font-bold text-success-600">{team.completedTasks}</p>
          <p className="text-xs text-gray-500">Erledigt</p>
        </div>
      </div>
    </div>
  );
};

const WorkloadUserCard = ({ user, type }: { user: UserWorkload; type: 'overloaded' | 'underutilized' }) => {
  const isOverloaded = type === 'overloaded';

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      isOverloaded ? 'bg-danger-50' : 'bg-warning-50'
    }`}>
      <div>
        <p className="font-medium text-gray-900">{user.name}</p>
        <p className="text-sm text-gray-600">{user.teamName}</p>
      </div>
      <div className="text-right">
        <p className={`font-bold ${isOverloaded ? 'text-danger-600' : 'text-warning-600'}`}>
          {user.utilizationPercentage}%
        </p>
        <p className="text-xs text-gray-500">
          {user.currentLoad}h / {user.weeklyCapacity}h
        </p>
      </div>
    </div>
  );
};

const OverdueTaskCard = ({ task }: { task: Task }) => {
  const daysOverdue = task.dueDate
    ? Math.floor((new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="flex items-center justify-between p-3 bg-danger-50 rounded-lg">
      <div>
        <p className="font-medium text-gray-900">{task.title}</p>
        <p className="text-sm text-gray-600">
          {task.assignedTo?.name || 'Nicht zugewiesen'} • {task.team?.name}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-danger-600">
          {daysOverdue} Tag(e) überfällig
        </p>
      </div>
    </div>
  );
};

const TaskCard = ({ task }: { task: Task }) => {
  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-warning-100 text-warning-700',
    URGENT: 'bg-danger-100 text-danger-700',
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-gray-100 text-gray-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    REVIEW: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-success-100 text-success-700',
    BLOCKED: 'bg-danger-100 text-danger-700',
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  return (
    <div className={`p-4 border rounded-lg ${isOverdue ? 'border-danger-200 bg-danger-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-1 text-xs font-medium rounded ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[task.status]}`}>
              {task.status.replace('_', ' ')}
            </span>
            {task.dueDate && (
              <span className={`text-xs ${isOverdue ? 'text-danger-600 font-medium' : 'text-gray-500'}`}>
                Fällig: {new Date(task.dueDate).toLocaleDateString('de-DE')}
              </span>
            )}
          </div>
        </div>
        {task.estimatedHours && (
          <div className="text-right ml-4">
            <p className="text-sm font-medium text-gray-900">{task.estimatedHours}h</p>
            <p className="text-xs text-gray-500">geschätzt</p>
          </div>
        )}
      </div>
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Subtasks: {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length} erledigt
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
