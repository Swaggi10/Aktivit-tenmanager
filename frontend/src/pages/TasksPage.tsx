import { useState, useEffect } from 'react';
import {
  Plus, Search, Calendar, Clock, User as UserIcon,
  ChevronDown, ChevronUp, Check, X, AlertCircle,
  CheckSquare, Square, Edit2
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { apiRequest } from '@/services/api';
import { Task, Team, User, Role, TaskStatus, TaskPriority } from '@/types';
import toast from 'react-hot-toast';

interface TeamWithMembers extends Team {
  members: User[];
}

const TasksPage = () => {
  const { user: currentUser } = useAuthStore();
  const isAdminOrLeader = currentUser?.role === Role.ADMIN || currentUser?.role === Role.TEAM_LEADER;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksData, teamsData] = await Promise.all([
        apiRequest<Task[]>('get', '/tasks'),
        apiRequest<TeamWithMembers[]>('get', '/teams'),
      ]);
      setTasks(tasksData);
      setTeams(teamsData);
    } catch (err) {
      toast.error('Fehler beim Laden der Aufgaben');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'ALL' && task.status !== statusFilter) {
      return false;
    }
    if (teamFilter !== 'ALL' && task.teamId !== teamFilter) {
      return false;
    }
    if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const teamTypeLabels: Record<string, string> = {
    LEADGEN_MAIL: 'Lead Gen & Mail',
    AKQUISE: 'Akquise',
    SALES_DEV: 'Sales Development',
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
          <h1 className="text-3xl font-bold text-gray-900">Aufgaben</h1>
          <p className="text-gray-600 mt-1">
            {filteredTasks.length} von {tasks.length} Aufgaben
          </p>
        </div>
        {isAdminOrLeader && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Neue Aufgabe
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Aufgaben suchen..."
                className="input w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <select
            className="input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'ALL')}
          >
            <option value="ALL">Alle Status</option>
            <option value="OPEN">Offen</option>
            <option value="IN_PROGRESS">In Bearbeitung</option>
            <option value="REVIEW">Review</option>
            <option value="COMPLETED">Abgeschlossen</option>
            <option value="BLOCKED">Blockiert</option>
          </select>

          <select
            className="input"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'ALL')}
          >
            <option value="ALL">Alle Prioritäten</option>
            <option value="LOW">Niedrig</option>
            <option value="MEDIUM">Mittel</option>
            <option value="HIGH">Hoch</option>
            <option value="URGENT">Dringend</option>
          </select>

          {currentUser?.role === Role.ADMIN && (
            <select
              className="input"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
            >
              <option value="ALL">Alle Teams</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {teamTypeLabels[team.type] || team.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-500">Keine Aufgaben gefunden</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              expanded={expandedTasks.has(task.id)}
              onToggleExpand={() => toggleExpanded(task.id)}
              onRefresh={fetchData}
              isAdminOrLeader={isAdminOrLeader}
              onEdit={() => setSelectedTask(task)}
            />
          ))
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          teams={teams}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchData();
          }}
        />
      )}

      {/* Edit Task Modal */}
      {selectedTask && (
        <EditTaskModal
          task={selectedTask}
          teams={teams}
          onClose={() => setSelectedTask(null)}
          onSuccess={() => {
            setSelectedTask(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

// Task Card Component
interface TaskCardProps {
  task: Task;
  expanded: boolean;
  onToggleExpand: () => void;
  onRefresh: () => void;
  isAdminOrLeader: boolean;
  onEdit: () => void;
}

const TaskCard = ({ task, expanded, onToggleExpand, onRefresh, isAdminOrLeader, onEdit }: TaskCardProps) => {
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const priorityColors: Record<string, string> = {
    LOW: 'bg-gray-100 text-gray-600 border-gray-200',
    MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
    HIGH: 'bg-warning-100 text-warning-700 border-warning-200',
    URGENT: 'bg-danger-100 text-danger-700 border-danger-200',
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-gray-100 text-gray-600',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    REVIEW: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-success-100 text-success-700',
    BLOCKED: 'bg-danger-100 text-danger-700',
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setIsUpdatingStatus(true);
    try {
      await apiRequest('patch', `/tasks/${task.id}`, { status: newStatus });
      toast.success('Status aktualisiert');
      onRefresh();
    } catch (err) {
      toast.error('Fehler beim Aktualisieren');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      await apiRequest('post', `/tasks/${task.id}/subtasks`, {
        title: newSubtaskTitle,
      });
      toast.success('Unteraufgabe hinzugefügt');
      setNewSubtaskTitle('');
      setShowSubtaskInput(false);
      onRefresh();
    } catch (err) {
      toast.error('Fehler beim Hinzufügen');
    }
  };

  const handleCompleteSubtask = async (subtaskId: string) => {
    try {
      await apiRequest('patch', `/tasks/subtasks/${subtaskId}/complete`);
      toast.success('Unteraufgabe abgeschlossen');
      onRefresh();
    } catch (err) {
      toast.error('Fehler beim Abschließen');
    }
  };

  const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div className={`card ${isOverdue ? 'border-danger-300 bg-danger-50' : ''}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <button
                onClick={onToggleExpand}
                className="text-gray-400 hover:text-gray-600"
              >
                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              <h3 className="font-semibold text-gray-900">{task.title}</h3>
              {isOverdue && (
                <span className="text-xs font-medium text-danger-600 bg-danger-100 px-2 py-1 rounded">
                  Überfällig
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-sm text-gray-600 mt-1 ml-8">{task.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3 ml-8">
              <span className={`px-2 py-1 text-xs font-medium rounded border ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>

              <select
                className={`px-2 py-1 text-xs font-medium rounded border-0 ${statusColors[task.status]}`}
                value={task.status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                disabled={isUpdatingStatus}
              >
                <option value="OPEN">Offen</option>
                <option value="IN_PROGRESS">In Bearbeitung</option>
                <option value="REVIEW">Review</option>
                <option value="COMPLETED">Abgeschlossen</option>
                <option value="BLOCKED">Blockiert</option>
              </select>

              {task.team && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.team.color }} />
                  {task.team.name}
                </span>
              )}

              {task.assignedTo && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <UserIcon className="w-3 h-3" />
                  {task.assignedTo.name}
                </span>
              )}

              {task.dueDate && (
                <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-danger-600 font-medium' : 'text-gray-500'}`}>
                  <Calendar className="w-3 h-3" />
                  {new Date(task.dueDate).toLocaleDateString('de-DE')}
                </span>
              )}

              {task.estimatedHours && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {task.estimatedHours}h
                </span>
              )}

              {totalSubtasks > 0 && (
                <span className="text-xs text-gray-500">
                  {completedSubtasks}/{totalSubtasks} Subtasks
                </span>
              )}
            </div>
          </div>

          {isAdminOrLeader && (
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content - Subtasks */}
      {expanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="ml-8 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 text-sm">Unteraufgaben</h4>
              <button
                onClick={() => setShowSubtaskInput(true)}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Hinzufügen
              </button>
            </div>

            {/* Subtasks List */}
            {task.subtasks && task.subtasks.length > 0 ? (
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className={`flex items-center gap-3 p-2 rounded ${
                      subtask.isCompleted ? 'bg-success-50' : 'bg-white'
                    }`}
                  >
                    <button
                      onClick={() => !subtask.isCompleted && handleCompleteSubtask(subtask.id)}
                      disabled={subtask.isCompleted}
                      className={`flex-shrink-0 ${
                        subtask.isCompleted
                          ? 'text-success-600'
                          : 'text-gray-400 hover:text-primary-600'
                      }`}
                    >
                      {subtask.isCompleted ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <span className={`text-sm ${subtask.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {subtask.title}
                    </span>
                    {subtask.isCompleted && (
                      <span className="text-xs text-success-600 ml-auto">+{subtask.pointsReward} Punkte</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Keine Unteraufgaben vorhanden</p>
            )}

            {/* Add Subtask Input */}
            {showSubtaskInput && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="input flex-1 text-sm"
                  placeholder="Titel der Unteraufgabe..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                  autoFocus
                />
                <button
                  onClick={handleAddSubtask}
                  className="p-2 text-success-600 hover:bg-success-50 rounded"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setShowSubtaskInput(false);
                    setNewSubtaskTitle('');
                  }}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Create Task Modal
interface CreateTaskModalProps {
  teams: TeamWithMembers[];
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTaskModal = ({ teams, onClose, onSuccess }: CreateTaskModalProps) => {
  const { user: currentUser } = useAuthStore();
  const defaultTeamId = currentUser?.role === Role.ADMIN ? teams[0]?.id : currentUser?.teamId;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    teamId: defaultTeamId || '',
    assignedToId: '',
    priority: 'MEDIUM' as TaskPriority,
    estimatedHours: '',
    dueDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTeam = teams.find(t => t.id === formData.teamId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiRequest('post', '/tasks', {
        ...formData,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        assignedToId: formData.assignedToId || undefined,
      });
      toast.success('Aufgabe erstellt');
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">Neue Aufgabe</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
            <input
              type="text"
              className="input w-full"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
            <textarea
              className="textarea w-full"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team *</label>
              <select
                className="input w-full"
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value, assignedToId: '' })}
                disabled={currentUser?.role !== Role.ADMIN}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Zuweisen an</label>
              <select
                className="input w-full"
                value={formData.assignedToId}
                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
              >
                <option value="">Nicht zugewiesen</option>
                {selectedTeam?.members?.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priorität *</label>
              <select
                className="input w-full"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              >
                <option value="LOW">Niedrig</option>
                <option value="MEDIUM">Mittel</option>
                <option value="HIGH">Hoch</option>
                <option value="URGENT">Dringend</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Geschätzter Aufwand (Stunden)</label>
              <input
                type="number"
                className="input w-full"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                min={0}
                step={0.5}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input
              type="date"
              className="input w-full"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
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

// Edit Task Modal
interface EditTaskModalProps {
  task: Task;
  teams: TeamWithMembers[];
  onClose: () => void;
  onSuccess: () => void;
}

const EditTaskModal = ({ task, teams, onClose, onSuccess }: EditTaskModalProps) => {
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    assignedToId: task.assignedToId || '',
    priority: task.priority,
    status: task.status,
    estimatedHours: task.estimatedHours?.toString() || '',
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTeam = teams.find(t => t.id === task.teamId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiRequest('patch', `/tasks/${task.id}`, {
        ...formData,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        assignedToId: formData.assignedToId || null,
      });
      toast.success('Aufgabe aktualisiert');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">Aufgabe bearbeiten</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Titel *</label>
            <input
              type="text"
              className="input w-full"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
            <textarea
              className="textarea w-full"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="input w-full"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              >
                <option value="OPEN">Offen</option>
                <option value="IN_PROGRESS">In Bearbeitung</option>
                <option value="REVIEW">Review</option>
                <option value="COMPLETED">Abgeschlossen</option>
                <option value="BLOCKED">Blockiert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priorität</label>
              <select
                className="input w-full"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
              >
                <option value="LOW">Niedrig</option>
                <option value="MEDIUM">Mittel</option>
                <option value="HIGH">Hoch</option>
                <option value="URGENT">Dringend</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zuweisen an</label>
            <select
              className="input w-full"
              value={formData.assignedToId}
              onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
            >
              <option value="">Nicht zugewiesen</option>
              {selectedTeam?.members?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Geschätzter Aufwand (Stunden)</label>
              <input
                type="number"
                className="input w-full"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                min={0}
                step={0.5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
              <input
                type="date"
                className="input w-full"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
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

export default TasksPage;
