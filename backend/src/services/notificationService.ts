import prisma from '../config/database';
import { NotificationType, TaskStatus } from '@prisma/client';

/**
 * Benachrichtigung erstellen
 */
export const createNotification = async (data: {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  relatedId?: string;
}) => {
  return prisma.notification.create({ data });
};

/**
 * Benachrichtigungen für einen User abrufen
 */
export const getUserNotifications = async (userId: string, unreadOnly = false) => {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

/**
 * Benachrichtigung als gelesen markieren
 */
export const markAsRead = async (notificationId: string, userId: string) => {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: { isRead: true },
  });
};

/**
 * Alle Benachrichtigungen als gelesen markieren
 */
export const markAllAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

/**
 * Ungelesene Benachrichtigungen zählen
 */
export const getUnreadCount = async (userId: string) => {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
};

/**
 * Deadline-Alerts prüfen und erstellen (für Cron-Job)
 * Erstellt Benachrichtigungen für:
 * - Aufgaben die bald fällig sind (innerhalb 24h)
 * - Überfällige Aufgaben
 */
export const checkDeadlineAlerts = async () => {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Aufgaben die bald fällig sind
  const dueSoonTasks = await prisma.task.findMany({
    where: {
      dueDate: {
        gte: now,
        lte: in24Hours,
      },
      status: {
        notIn: [TaskStatus.COMPLETED],
      },
      assignedToId: { not: null },
    },
    include: { assignedTo: true },
  });

  // Überfällige Aufgaben
  const overdueTasks = await prisma.task.findMany({
    where: {
      dueDate: { lt: now },
      status: {
        notIn: [TaskStatus.COMPLETED],
      },
      assignedToId: { not: null },
    },
    include: { assignedTo: true, team: true },
  });

  // Benachrichtigungen für bald fällige Aufgaben
  for (const task of dueSoonTasks) {
    if (!task.assignedToId) continue;

    // Prüfe ob bereits eine Benachrichtigung existiert
    const existing = await prisma.notification.findFirst({
      where: {
        userId: task.assignedToId,
        relatedId: task.id,
        type: NotificationType.TASK_DUE_SOON,
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existing) {
      await createNotification({
        type: NotificationType.TASK_DUE_SOON,
        title: 'Deadline nähert sich',
        message: `Die Aufgabe "${task.title}" ist in weniger als 24 Stunden fällig`,
        userId: task.assignedToId,
        relatedId: task.id,
      });
    }
  }

  // Benachrichtigungen für überfällige Aufgaben (an Admin)
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
  });

  for (const task of overdueTasks) {
    // Benachrichtigung an zugewiesenen User
    if (task.assignedToId) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: task.assignedToId,
          relatedId: task.id,
          type: NotificationType.TASK_OVERDUE,
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        await createNotification({
          type: NotificationType.TASK_OVERDUE,
          title: 'Deadline überschritten',
          message: `Die Aufgabe "${task.title}" ist überfällig!`,
          userId: task.assignedToId,
          relatedId: task.id,
        });
      }
    }

    // Benachrichtigung an alle Admins
    for (const admin of admins) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: admin.id,
          relatedId: task.id,
          type: NotificationType.TASK_OVERDUE,
          createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        await createNotification({
          type: NotificationType.TASK_OVERDUE,
          title: 'Deadline überschritten (Admin-Alert)',
          message: `Die Aufgabe "${task.title}" (${task.assignedTo?.name || 'Nicht zugewiesen'}) ist überfällig!`,
          userId: admin.id,
          relatedId: task.id,
        });
      }
    }
  }

  return {
    dueSoonAlerts: dueSoonTasks.length,
    overdueAlerts: overdueTasks.length,
  };
};

/**
 * Admin-Alerts für Bottlenecks (Überladene User)
 */
export const checkBottleneckAlerts = async () => {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
  });

  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: {
      assignedTasks: {
        where: {
          status: { in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS] },
        },
      },
    },
  });

  const overloadedUsers = users.filter((user) => {
    const currentLoad = user.assignedTasks.reduce(
      (sum, task) => sum + (task.estimatedHours || 0),
      0
    );
    return currentLoad > user.weeklyCapacity;
  });

  // Benachrichtigungen an Admins
  for (const user of overloadedUsers) {
    const currentLoad = user.assignedTasks.reduce(
      (sum, task) => sum + (task.estimatedHours || 0),
      0
    );

    for (const admin of admins) {
      // Nur eine Benachrichtigung pro Tag
      const existing = await prisma.notification.findFirst({
        where: {
          userId: admin.id,
          message: { contains: user.name },
          type: NotificationType.TASK_ASSIGNED, // Nutzen wir als Bottleneck-Alert
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existing) {
        await createNotification({
          type: NotificationType.TASK_ASSIGNED,
          title: 'Bottleneck erkannt',
          message: `${user.name} ist überlastet: ${currentLoad}h / ${user.weeklyCapacity}h Kapazität`,
          userId: admin.id,
          relatedId: user.id,
        });
      }
    }
  }

  return { overloadedCount: overloadedUsers.length };
};
