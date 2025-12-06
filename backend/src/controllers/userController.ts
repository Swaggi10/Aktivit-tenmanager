import { Response } from 'express';
import { AuthRequest } from '../types';
import { body } from 'express-validator';
import * as userService from '../services/userService';
import { Role } from '@prisma/client';

/**
 * Validierungen
 */
export const createUserValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('teamId').notEmpty().withMessage('Team ID is required'),
  body('role').optional().isIn(['ADMIN', 'TEAM_LEADER', 'MEMBER']).withMessage('Invalid role'),
  body('weeklyCapacity').optional().isFloat({ min: 0 }).withMessage('Weekly capacity must be a positive number'),
];

export const updateUserValidation = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('teamId').optional().notEmpty().withMessage('Team ID cannot be empty'),
  body('role').optional().isIn(['ADMIN', 'TEAM_LEADER', 'MEMBER']).withMessage('Invalid role'),
  body('weeklyCapacity').optional().isFloat({ min: 0 }).withMessage('Weekly capacity must be a positive number'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

export const assignTeamValidation = [
  body('teamId').notEmpty().withMessage('Team ID is required'),
];

export const updateRoleValidation = [
  body('role').isIn(['ADMIN', 'TEAM_LEADER', 'MEMBER']).withMessage('Invalid role'),
];

/**
 * Alle Benutzer abrufen (Admin)
 */
export const getUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    });
  }
};

/**
 * Neuen Benutzer erstellen (Admin)
 */
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, name, teamId, role, weeklyCapacity } = req.body;

    const user = await userService.createUser({
      email,
      name,
      teamId,
      role: role as Role,
      weeklyCapacity,
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(error instanceof Error && error.message.includes('already exists') ? 409 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    });
  }
};

/**
 * Benutzer aktualisieren (Admin)
 */
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, teamId, role, weeklyCapacity, isActive } = req.body;

    const user = await userService.updateUser(id, {
      name,
      teamId,
      role: role as Role,
      weeklyCapacity,
      isActive,
    });

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(error instanceof Error && error.message === 'Team not found' ? 404 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
    });
  }
};

/**
 * Benutzer einem Team zuweisen (Admin)
 */
export const assignToTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { teamId } = req.body;

    const user = await userService.assignUserToTeam(id, teamId);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(error instanceof Error && error.message === 'Team not found' ? 404 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign user to team',
    });
  }
};

/**
 * Benutzerrolle ändern (Admin)
 */
export const updateRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await userService.updateUserRole(id, role as Role);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user role',
    });
  }
};

/**
 * Benutzer deaktivieren (Admin)
 */
export const deactivateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await userService.deactivateUser(id);
    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deactivate user',
    });
  }
};

/**
 * Workload aller Benutzer abrufen (Admin/Team-Leader)
 */
export const getUsersWorkload = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    // Team-Leader sieht nur eigenes Team
    const teamId = req.user.role === Role.ADMIN ? req.query.teamId as string : req.user.teamId;

    const workload = await userService.getAllUsersWorkload(teamId);
    res.json({ success: true, data: workload });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch workload data',
    });
  }
};

/**
 * Überladene Benutzer abrufen (Admin)
 */
export const getOverloadedUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teamId = req.query.teamId as string | undefined;
    const users = await userService.getOverloadedUsers(teamId);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch overloaded users',
    });
  }
};

/**
 * Unterauslastete Benutzer abrufen (Admin)
 */
export const getUnderutilizedUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teamId = req.query.teamId as string | undefined;
    const users = await userService.getUnderutilizedUsers(teamId);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch underutilized users',
    });
  }
};

/**
 * Benutzer mit überfälligen Aufgaben (Admin)
 */
export const getUsersWithOverdueTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teamId = req.query.teamId as string | undefined;
    const users = await userService.getUsersWithOverdueTasks(teamId);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users with overdue tasks',
    });
  }
};

/**
 * Admin Dashboard Daten abrufen
 */
export const getAdminDashboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await userService.getAdminDashboardData();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch admin dashboard data',
    });
  }
};
