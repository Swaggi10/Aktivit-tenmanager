import { Response } from 'express';
import { AuthRequest } from '../types';
import { body } from 'express-validator';
import * as taskService from '../services/taskService';
import { TaskPriority, TaskStatus, Role } from '@prisma/client';
import prisma from '../config/database';

/**
 * Validierungen
 */
export const createTaskValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('teamId').notEmpty().withMessage('Team ID is required'),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
];

export const updateTaskValidation = [
  body('status').optional().isIn(['OPEN', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'BLOCKED']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
];

/**
 * Neue Aufgabe erstellen (Admin/Team-Leader)
 */
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const task = await taskService.createTask({
      ...req.body,
      createdById: req.user.id,
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task',
    });
  }
};

/**
 * Aufgabe aktualisieren
 */
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const task = await taskService.updateTask(id, req.body, req.user.id);

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(error instanceof Error && error.message === 'Task not found' ? 404 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task',
    });
  }
};

/**
 * Alle Tasks abrufen (mit Filteroptionen)
 */
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { status, priority, teamId, assignedToId } = req.query;

    // Filter basierend auf Rolle
    let whereClause: Record<string, unknown> = {};

    if (req.user.role === Role.ADMIN) {
      // Admin sieht alle Tasks
      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;
      if (teamId) whereClause.teamId = teamId;
      if (assignedToId) whereClause.assignedToId = assignedToId;
    } else if (req.user.role === Role.TEAM_LEADER) {
      // Team-Leader sieht nur Tasks des eigenen Teams
      whereClause.teamId = req.user.teamId;
      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;
    } else {
      // Member sieht nur eigene Tasks
      whereClause.assignedToId = req.user.id;
      if (status) whereClause.status = status;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        team: true,
        assignedTo: true,
        createdBy: true,
        subtasks: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
    });
  }
};

/**
 * Einzelne Aufgabe abrufen
 */
export const getTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        team: true,
        assignedTo: true,
        createdBy: true,
        subtasks: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
    });
  }
};

/**
 * Unteraufgabe erstellen
 */
export const createSubtask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    await taskService.createSubtask(id, title, description);

    res.status(201).json({ success: true, message: 'Subtask created' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create subtask',
    });
  }
};

/**
 * Unteraufgabe abschließen
 */
export const completeSubtask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    await taskService.completeSubtask(id, req.user.id);

    res.json({ success: true, message: 'Subtask completed' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to complete subtask',
    });
  }
};
