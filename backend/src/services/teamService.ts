import prisma from '../config/database';
import { TaskStatus } from '@prisma/client';
import { TeamStats } from '../types';

/**
 * Team-Statistiken abrufen
 */
export const getTeamStats = async (teamId: string): Promise<TeamStats> => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        where: { isActive: true },
      },
      tasks: {
        include: {
          subtasks: true,
        },
      },
    },
  });

  if (!team) {
    throw new Error('Team not found');
  }

  const totalTasks = team.tasks.length;
  const completedTasks = team.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
  const inProgressTasks = team.tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
  const openTasks = team.tasks.filter((t) => t.status === TaskStatus.OPEN).length;

  // Gesamtpunkte des Teams
  const totalPoints = team.members.reduce((sum, member) => sum + member.totalPoints, 0);

  // Kapazitätsberechnung (Summe der geschätzten Stunden für offene/in-progress Tasks)
  const currentCapacity = team.tasks
    .filter((t) => t.status !== TaskStatus.COMPLETED)
    .reduce((sum, task) => sum + (task.estimatedHours || 0), 0);

  const utilizationPercentage = team.maxCapacity > 0
    ? Math.min((currentCapacity / team.maxCapacity) * 100, 100)
    : 0;

  return {
    teamId: team.id,
    teamName: team.name,
    teamType: team.type,
    memberCount: team.members.length,
    totalTasks,
    completedTasks,
    inProgressTasks,
    openTasks,
    totalPoints,
    currentCapacity,
    maxCapacity: team.maxCapacity,
    utilizationPercentage: Math.round(utilizationPercentage),
  };
};

/**
 * Alle Teams mit Statistiken abrufen
 */
export const getAllTeamsStats = async (): Promise<TeamStats[]> => {
  const teams = await prisma.team.findMany();
  const stats = await Promise.all(teams.map((team) => getTeamStats(team.id)));
  return stats;
};

/**
 * Team-Mitglieder mit niedrigster Auslastung finden
 */
export const getUnderutilizedMembers = async (teamId?: string) => {
  const whereClause = teamId ? { teamId } : {};

  const members = await prisma.user.findMany({
    where: {
      ...whereClause,
      isActive: true,
    },
    include: {
      assignedTasks: {
        where: {
          status: {
            in: [TaskStatus.OPEN, TaskStatus.IN_PROGRESS],
          },
        },
      },
      team: true,
    },
  });

  // Berechne Auslastung pro Member
  const membersWithLoad = members.map((member) => {
    const currentLoad = member.assignedTasks.reduce(
      (sum, task) => sum + (task.estimatedHours || 0),
      0
    );

    return {
      userId: member.id,
      name: member.name,
      email: member.email,
      teamName: member.team.name,
      currentLoad,
      activeTasks: member.assignedTasks.length,
      lastActive: member.lastActive,
    };
  });

  // Sortiere nach geringster Auslastung
  return membersWithLoad.sort((a, b) => a.currentLoad - b.currentLoad);
};
