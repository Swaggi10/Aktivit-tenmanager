import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/database';
import { Role } from '@prisma/client';

/**
 * Middleware zur Authentifizierung via JWT Token
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Token aus Authorization Header extrahieren
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7); // "Bearer " entfernen
    const payload = verifyToken(token);

    // User aus Datenbank laden
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { team: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'User not found or inactive' });
      return;
    }

    // User an Request anhängen
    req.user = user;

    // Last active timestamp aktualisieren
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

/**
 * Middleware zur Autorisierung basierend auf Rollen
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

/**
 * Middleware: Nur Team-Mitglieder können auf Team-Ressourcen zugreifen
 */
export const authorizeTeamAccess = (getTeamId: (req: AuthRequest) => string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const teamId = getTeamId(req);

    // Admin hat Zugriff auf alles
    if (req.user.role === Role.ADMIN) {
      next();
      return;
    }

    // Team-Mitglieder nur auf eigenes Team
    if (req.user.teamId !== teamId) {
      res.status(403).json({
        success: false,
        error: 'Access denied to this team resource'
      });
      return;
    }

    next();
  };
};
