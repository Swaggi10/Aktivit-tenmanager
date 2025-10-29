import prisma from '../config/database';
import { TaskStatus } from '@prisma/client';
import { LeaderboardEntry } from '../types';

/**
 * Leaderboard abrufen (Top Performer)
 */
export const getLeaderboard = async (
  timeframe: 'week' | 'month' | 'alltime' = 'alltime',
  limit = 10
): Promise<LeaderboardEntry[]> => {
  let dateFilter: Date | undefined;

  if (timeframe === 'week') {
    dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - 7);
  } else if (timeframe === 'month') {
    dateFilter = new Date();
    dateFilter.setMonth(dateFilter.getMonth() - 1);
  }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    include: {
      team: true,
      assignedTasks: {
        where: {
          status: TaskStatus.COMPLETED,
          ...(dateFilter ? { completedAt: { gte: dateFilter } } : {}),
        },
      },
    },
    orderBy: {
      totalPoints: 'desc',
    },
    take: limit,
  });

  return users.map((user, index) => ({
    userId: user.id,
    name: user.name,
    email: user.email,
    teamName: user.team.name,
    totalPoints: user.totalPoints,
    level: user.level,
    completedTasks: user.assignedTasks.length,
    rank: index + 1,
  }));
};

/**
 * Team-Leaderboard (Welches Team hat die meisten Punkte)
 */
export const getTeamLeaderboard = async () => {
  const teams = await prisma.team.findMany({
    include: {
      members: {
        where: { isActive: true },
      },
      tasks: {
        where: { status: TaskStatus.COMPLETED },
      },
    },
  });

  const teamScores = teams.map((team) => {
    const totalPoints = team.members.reduce((sum, member) => sum + member.totalPoints, 0);
    const completedTasks = team.tasks.length;

    return {
      teamId: team.id,
      teamName: team.name,
      teamType: team.type,
      color: team.color,
      totalPoints,
      completedTasks,
      memberCount: team.members.length,
      averagePointsPerMember: team.members.length > 0 ? totalPoints / team.members.length : 0,
    };
  });

  return teamScores.sort((a, b) => b.totalPoints - a.totalPoints);
};

/**
 * User-Rank berechnen
 */
export const getUserRank = async (userId: string): Promise<number> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return 0;

  const higherRankedUsers = await prisma.user.count({
    where: {
      totalPoints: { gt: user.totalPoints },
      isActive: true,
    },
  });

  return higherRankedUsers + 1;
};

/**
 * Achievements für User abrufen
 */
export const getUserAchievements = async (userId: string) => {
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: true,
    },
    orderBy: {
      unlockedAt: 'desc',
    },
  });

  return userAchievements.map((ua) => ({
    id: ua.achievement.id,
    type: ua.achievement.type,
    name: ua.achievement.name,
    description: ua.achievement.description,
    icon: ua.achievement.icon,
    pointsReward: ua.achievement.pointsReward,
    unlockedAt: ua.unlockedAt,
  }));
};

/**
 * Alle verfügbaren Achievements abrufen
 */
export const getAllAchievements = async () => {
  return prisma.achievement.findMany({
    orderBy: { pointsReward: 'desc' },
  });
};
