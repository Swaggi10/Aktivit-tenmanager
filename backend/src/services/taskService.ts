import prisma from '../config/database';
import { Task, TaskStatus, TaskPriority, ActivityType } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

interface CreateTaskData {
  title: string;
  description?: string;
  priority: TaskPriority;
  estimatedHours?: number;
  dueDate?: Date;
  teamId: string;
  assignedToId?: string;
  createdById: string;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  assignedToId?: string;
}

/**
 * Neue Aufgabe erstellen
 */
export const createTask = async (data: CreateTaskData): Promise<Task> => {
  const task = await prisma.task.create({
    data: {
      ...data,
      pointsReward: calculatePointsReward(data.priority, data.estimatedHours),
    },
    include: {
      team: true,
      assignedTo: true,
      createdBy: true,
    },
  });

  // Activity Log
  await prisma.activityLog.create({
    data: {
      type: ActivityType.TASK_CREATED,
      description: `Task "${task.title}" created`,
      userId: data.createdById,
      taskId: task.id,
    },
  });

  // Benachrichtigung für zugewiesenen User
  if (task.assignedToId && task.assignedToId !== data.createdById) {
    await prisma.notification.create({
      data: {
        type: 'TASK_ASSIGNED',
        title: 'Neue Aufgabe zugewiesen',
        message: `Du wurdest der Aufgabe "${task.title}" zugewiesen`,
        userId: task.assignedToId,
        relatedId: task.id,
      },
    });
  }

  return task;
};

/**
 * Aufgabe aktualisieren
 */
export const updateTask = async (
  taskId: string,
  data: UpdateTaskData,
  userId: string
): Promise<Task> => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const wasCompleted = task.status === TaskStatus.COMPLETED;
  const isNowCompleted = data.status === TaskStatus.COMPLETED;

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      completedAt: isNowCompleted && !wasCompleted ? new Date() : task.completedAt,
    },
    include: {
      team: true,
      assignedTo: true,
      createdBy: true,
      subtasks: true,
    },
  });

  // Activity Log
  await prisma.activityLog.create({
    data: {
      type: ActivityType.TASK_UPDATED,
      description: `Task "${task.title}" updated`,
      userId,
      taskId: task.id,
    },
  });

  // Wenn Status zu COMPLETED geändert wurde
  if (isNowCompleted && !wasCompleted && task.assignedToId) {
    await handleTaskCompletion(task.id, task.assignedToId);
  }

  return updatedTask;
};

/**
 * Aufgabe abschließen und Punkte vergeben
 */
const handleTaskCompletion = async (taskId: string, userId: string): Promise<void> => {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { subtasks: true },
  });

  if (!task) return;

  // Punkte berechnen
  let points = task.pointsReward;

  // Bonus: Vor Deadline abgeschlossen
  if (task.dueDate && new Date() < task.dueDate) {
    points += 5;
  }

  // Bonus: Alle Subtasks abgeschlossen
  const allSubtasksCompleted = task.subtasks.every((st) => st.isCompleted);
  if (allSubtasksCompleted && task.subtasks.length > 0) {
    points += task.subtasks.reduce((sum, st) => sum + st.pointsReward, 0);
  }

  // Punkte dem User gutschreiben
  await prisma.user.update({
    where: { id: userId },
    data: {
      totalPoints: { increment: points },
    },
  });

  // Activity Log
  await prisma.activityLog.create({
    data: {
      type: ActivityType.TASK_COMPLETED,
      description: `Task "${task.title}" completed (+${points} points)`,
      userId,
      taskId,
    },
  });

  // Achievement Check
  await checkAchievements(userId);
};

/**
 * Unteraufgabe erstellen
 */
export const createSubtask = async (
  taskId: string,
  title: string,
  description?: string
): Promise<void> => {
  await prisma.subtask.create({
    data: {
      title,
      description,
      taskId,
      pointsReward: 5,
    },
  });
};

/**
 * Unteraufgabe abschließen
 */
export const completeSubtask = async (subtaskId: string, userId: string): Promise<void> => {
  const subtask = await prisma.subtask.update({
    where: { id: subtaskId },
    data: {
      isCompleted: true,
      completedAt: new Date(),
    },
    include: { task: true },
  });

  // Activity Log
  await prisma.activityLog.create({
    data: {
      type: ActivityType.SUBTASK_COMPLETED,
      description: `Subtask "${subtask.title}" completed`,
      userId,
      taskId: subtask.taskId,
    },
  });
};

/**
 * Punkte-Belohnung basierend auf Priorität und Zeitaufwand berechnen
 */
const calculatePointsReward = (priority: TaskPriority, hours?: number): number => {
  let basePoints = 10;

  switch (priority) {
    case TaskPriority.LOW:
      basePoints = 5;
      break;
    case TaskPriority.MEDIUM:
      basePoints = 10;
      break;
    case TaskPriority.HIGH:
      basePoints = 20;
      break;
    case TaskPriority.URGENT:
      basePoints = 30;
      break;
  }

  // Bonus für zeitaufwändige Aufgaben
  if (hours && hours > 2) {
    basePoints += Math.floor(hours) * 2;
  }

  return basePoints;
};

/**
 * Achievements prüfen und freischalten
 */
const checkAchievements = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      assignedTasks: {
        where: { status: TaskStatus.COMPLETED },
      },
      achievements: true,
    },
  });

  if (!user) return;

  const completedCount = user.assignedTasks.length;
  const hasAchievement = (type: string) =>
    user.achievements.some((ua) => ua.achievement && ua.achievement.type === type);

  // FIRST_TASK
  if (completedCount >= 1 && !hasAchievement('FIRST_TASK')) {
    await unlockAchievement(userId, 'FIRST_TASK');
  }

  // CENTURY
  if (completedCount >= 100 && !hasAchievement('CENTURY')) {
    await unlockAchievement(userId, 'CENTURY');
  }

  // LEGEND (1000 Punkte)
  if (user.totalPoints >= 1000 && !hasAchievement('LEGEND')) {
    await unlockAchievement(userId, 'LEGEND');
  }
};

/**
 * Achievement freischalten
 */
const unlockAchievement = async (userId: string, achievementType: string): Promise<void> => {
  const achievement = await prisma.achievement.findUnique({
    where: { type: achievementType as never },
  });

  if (!achievement) return;

  await prisma.userAchievement.create({
    data: {
      userId,
      achievementId: achievement.id,
    },
  });

  // Punkte gutschreiben
  await prisma.user.update({
    where: { id: userId },
    data: {
      totalPoints: { increment: achievement.pointsReward },
    },
  });

  // Benachrichtigung
  await prisma.notification.create({
    data: {
      type: 'ACHIEVEMENT_EARNED',
      title: 'Achievement freigeschaltet!',
      message: `Du hast "${achievement.name}" freigeschaltet! +${achievement.pointsReward} Punkte`,
      userId,
      relatedId: achievement.id,
    },
  });
};

/**
 * Tasks für Dashboard abrufen
 */
export const getTasksForUser = async (userId: string) => {
  const tasks = await prisma.task.findMany({
    where: { assignedToId: userId },
    include: {
      team: true,
      subtasks: true,
      comments: {
        include: { author: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return tasks;
};
