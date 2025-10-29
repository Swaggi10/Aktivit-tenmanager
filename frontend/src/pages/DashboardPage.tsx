import { Trophy, Target, CheckCircle2, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatPoints } from '@/utils/formatters';

const DashboardPage = () => {
  const { user } = useAuthStore();

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
      value: '12',
      icon: CheckCircle2,
      color: 'text-success-600',
      bg: 'bg-success-50',
    },
    {
      label: 'In Arbeit',
      value: '5',
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Übersicht über deine Aktivitäten</p>
      </div>

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
        <div className="text-gray-500 text-center py-8">
          Keine Aufgaben vorhanden
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
