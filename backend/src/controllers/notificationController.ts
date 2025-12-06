import { Response } from 'express';
import { AuthRequest } from '../types';
import * as notificationService from '../services/notificationService';

/**
 * Benachrichtigungen des aktuellen Users abrufen
 */
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const unreadOnly = req.query.unreadOnly === 'true';
    const notifications = await notificationService.getUserNotifications(req.user.id, unreadOnly);

    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch notifications',
    });
  }
};

/**
 * Ungelesene Benachrichtigungen zählen
 */
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to count notifications',
    });
  }
};

/**
 * Benachrichtigung als gelesen markieren
 */
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    await notificationService.markAsRead(id, req.user.id);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark notification as read',
    });
  }
};

/**
 * Alle Benachrichtigungen als gelesen markieren
 */
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark notifications as read',
    });
  }
};

/**
 * Deadline-Alerts manuell auslösen (Admin)
 */
export const triggerDeadlineAlerts = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await notificationService.checkDeadlineAlerts();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check deadline alerts',
    });
  }
};

/**
 * Bottleneck-Alerts manuell auslösen (Admin)
 */
export const triggerBottleneckAlerts = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await notificationService.checkBottleneckAlerts();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check bottleneck alerts',
    });
  }
};
