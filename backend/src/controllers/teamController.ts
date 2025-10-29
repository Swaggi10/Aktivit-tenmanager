import { Response } from 'express';
import { AuthRequest } from '../types';
import * as teamService from '../services/teamService';
import prisma from '../config/database';

/**
 * Alle Teams abrufen
 */
export const getTeams = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            email: true,
            totalPoints: true,
            role: true,
          },
        },
      },
    });

    res.json({ success: true, data: teams });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams',
    });
  }
};

/**
 * Team-Statistiken abrufen
 */
export const getTeamStatistics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const stats = await teamService.getTeamStats(id);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team statistics',
    });
  }
};

/**
 * Alle Team-Statistiken abrufen (Admin-Dashboard)
 */
export const getAllTeamStatistics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await teamService.getAllTeamsStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team statistics',
    });
  }
};

/**
 * Unterausgelastete Mitarbeiter finden
 */
export const getUnderutilizedMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.query;

    const members = await teamService.getUnderutilizedMembers(
      teamId ? String(teamId) : undefined
    );

    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch underutilized members',
    });
  }
};
