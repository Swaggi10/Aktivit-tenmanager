import { Response } from 'express';
import { AuthRequest } from '../types';
import * as gamificationService from '../services/gamificationService';

/**
 * Leaderboard abrufen
 */
export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { timeframe, limit } = req.query;

    const leaderboard = await gamificationService.getLeaderboard(
      timeframe as 'week' | 'month' | 'alltime' || 'alltime',
      limit ? parseInt(limit as string, 10) : 10
    );

    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
    });
  }
};

/**
 * Team-Leaderboard abrufen
 */
export const getTeamLeaderboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leaderboard = await gamificationService.getTeamLeaderboard();
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team leaderboard',
    });
  }
};

/**
 * User Achievements abrufen
 */
export const getUserAchievements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const achievements = await gamificationService.getUserAchievements(req.user.id);
    res.json({ success: true, data: achievements });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievements',
    });
  }
};

/**
 * Alle verfügbaren Achievements abrufen
 */
export const getAllAchievements = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const achievements = await gamificationService.getAllAchievements();
    res.json({ success: true, data: achievements });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievements',
    });
  }
};

/**
 * User-Rank abrufen
 */
export const getUserRank = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const rank = await gamificationService.getUserRank(req.user.id);
    res.json({ success: true, data: { rank } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user rank',
    });
  }
};
