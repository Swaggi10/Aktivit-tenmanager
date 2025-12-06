import { useState, useEffect } from 'react';
import {
  Users, UserPlus, Edit2, Trash2, X,
  Mail, Shield, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { apiRequest } from '@/services/api';
import { Team, User, Role, UserWorkload } from '@/types';
import toast from 'react-hot-toast';

interface TeamWithMembers extends Team {
  members: User[];
}

const TeamsPage = () => {
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === Role.ADMIN;
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [workload, setWorkload] = useState<UserWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsData, workloadData] = await Promise.all([
        apiRequest<TeamWithMembers[]>('get', '/teams'),
        isAdmin ? apiRequest<UserWorkload[]>('get', '/users/workload') : Promise.resolve([]),
      ]);
      setTeams(teamsData);
      setWorkload(workloadData);
    } catch (err) {
      toast.error('Fehler beim Laden der Teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const teamTypeLabels: Record<string, string> = {
    LEADGEN_MAIL: 'Lead Gen & Mail',
    AKQUISE: 'Akquise',
    SALES_DEV: 'Sales Development',
  };

  const getUserWorkload = (userId: string) => {
    return workload.find(w => w.userId === userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600 mt-1">Übersicht aller Teams und Mitarbeiter</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddUser(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Neuer Mitarbeiter
          </button>
        )}
      </div>

      {/* Team Cards */}
      <div className="space-y-6">
        {teams.map((team) => (
          <div key={team.id} className="card">
            <div
              className="p-4 border-b border-gray-200"
              style={{ borderLeftWidth: '4px', borderLeftColor: team.color }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {teamTypeLabels[team.type] || team.name}
                  </h2>
                  <p className="text-sm text-gray-500">{team.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{team.members?.length || 0}</p>
                    <p className="text-xs text-gray-500">Mitarbeiter</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4">
              {team.members && team.members.length > 0 ? (
                <div className="space-y-3">
                  {team.members.map((member) => {
                    const memberWorkload = getUserWorkload(member.id);
                    return (
                      <MemberCard
                        key={member.id}
                        member={member}
                        workload={memberWorkload}
                        isAdmin={isAdmin}
                        onEdit={() => setEditingUser(member)}
                        onRefresh={fetchData}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Keine Mitarbeiter in diesem Team</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <AddUserModal
          teams={teams}
          onClose={() => setShowAddUser(false)}
          onSuccess={() => {
            setShowAddUser(false);
            fetchData();
          }}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          teams={teams}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

// Member Card Component
interface MemberCardProps {
  member: User;
  workload?: UserWorkload;
  isAdmin: boolean;
  onEdit: () => void;
  onRefresh: () => void;
}

const MemberCard = ({ member, workload, isAdmin, onEdit, onRefresh }: MemberCardProps) => {
  const [isDeactivating, setIsDeactivating] = useState(false);

  const handleDeactivate = async () => {
    if (!confirm(`Möchten Sie ${member.name} wirklich deaktivieren?`)) return;

    setIsDeactivating(true);
    try {
      await apiRequest('delete', `/users/${member.id}`);
      toast.success('Mitarbeiter deaktiviert');
      onRefresh();
    } catch (err) {
      toast.error('Fehler beim Deaktivieren');
    } finally {
      setIsDeactivating(false);
    }
  };

  const roleLabels: Record<string, string> = {
    ADMIN: 'Admin',
    TEAM_LEADER: 'Team Leader',
    MEMBER: 'Mitarbeiter',
  };

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-700',
    TEAM_LEADER: 'bg-blue-100 text-blue-700',
    MEMBER: 'bg-gray-100 text-gray-700',
  };

  const utilizationColor = workload
    ? workload.utilizationPercentage > 100
      ? 'text-danger-600'
      : workload.utilizationPercentage < 50
      ? 'text-warning-600'
      : 'text-success-600'
    : 'text-gray-500';

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-primary-700 font-semibold">
            {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900">{member.name}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail className="w-4 h-4" />
            {member.email}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className={`px-2 py-1 text-xs font-medium rounded ${roleColors[member.role]}`}>
          <Shield className="w-3 h-3 inline mr-1" />
          {roleLabels[member.role]}
        </span>

        {workload && (
          <div className="text-right">
            <p className={`font-medium ${utilizationColor}`}>
              {workload.utilizationPercentage}%
            </p>
            <p className="text-xs text-gray-500">
              {workload.currentLoad}h / {workload.weeklyCapacity}h
            </p>
          </div>
        )}

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
              title="Bearbeiten"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeactivate}
              disabled={isDeactivating}
              className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 rounded"
              title="Deaktivieren"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Add User Modal
interface AddUserModalProps {
  teams: TeamWithMembers[];
  onClose: () => void;
  onSuccess: () => void;
}

const AddUserModal = ({ teams, onClose, onSuccess }: AddUserModalProps) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    teamId: teams[0]?.id || '',
    role: 'MEMBER' as Role,
    weeklyCapacity: 5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiRequest('post', '/users', formData);
      toast.success('Mitarbeiter erstellt');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  const teamTypeLabels: Record<string, string> = {
    LEADGEN_MAIL: 'Lead Gen & Mail',
    AKQUISE: 'Akquise',
    SALES_DEV: 'Sales Development',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Neuer Mitarbeiter</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-danger-50 text-danger-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
            <input
              type="email"
              className="input w-full"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              className="input w-full"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
            <select
              className="input w-full"
              value={formData.teamId}
              onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              required
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {teamTypeLabels[team.type] || team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rolle</label>
            <select
              className="input w-full"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
            >
              <option value="MEMBER">Mitarbeiter</option>
              <option value="TEAM_LEADER">Team Leader</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wöchentliche Kapazität (Stunden)
            </label>
            <input
              type="number"
              className="input w-full"
              value={formData.weeklyCapacity}
              onChange={(e) => setFormData({ ...formData, weeklyCapacity: parseFloat(e.target.value) })}
              min={0}
              step={0.5}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Abbrechen
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Erstelle...' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Modal
interface EditUserModalProps {
  user: User;
  teams: TeamWithMembers[];
  onClose: () => void;
  onSuccess: () => void;
}

const EditUserModal = ({ user, teams, onClose, onSuccess }: EditUserModalProps) => {
  const [formData, setFormData] = useState({
    name: user.name,
    teamId: user.teamId,
    role: user.role,
    weeklyCapacity: user.weeklyCapacity || 5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiRequest('patch', `/users/${user.id}`, formData);
      toast.success('Mitarbeiter aktualisiert');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren');
    } finally {
      setLoading(false);
    }
  };

  const teamTypeLabels: Record<string, string> = {
    LEADGEN_MAIL: 'Lead Gen & Mail',
    AKQUISE: 'Akquise',
    SALES_DEV: 'Sales Development',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Mitarbeiter bearbeiten</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-danger-50 text-danger-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
            <input
              type="email"
              className="input w-full bg-gray-100"
              value={user.email}
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              className="input w-full"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
            <select
              className="input w-full"
              value={formData.teamId}
              onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              required
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {teamTypeLabels[team.type] || team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rolle</label>
            <select
              className="input w-full"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
            >
              <option value="MEMBER">Mitarbeiter</option>
              <option value="TEAM_LEADER">Team Leader</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wöchentliche Kapazität (Stunden)
            </label>
            <input
              type="number"
              className="input w-full"
              value={formData.weeklyCapacity}
              onChange={(e) => setFormData({ ...formData, weeklyCapacity: parseFloat(e.target.value) })}
              min={0}
              step={0.5}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Abbrechen
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Speichere...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamsPage;
