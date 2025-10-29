import { Request, Response } from 'express';
import { getMicrosoftLoginUrl, handleMicrosoftCallback, logout, handleDemoLogin } from '../services/authService';
import { AuthRequest } from '../types';
import { config } from '../config/env';

/**
 * Microsoft Login URL zurückgeben
 */
export const getMicrosoftLogin = async (_req: Request, res: Response): Promise<void> => {
  try {
    const loginUrl = await getMicrosoftLoginUrl();
    res.json({ success: true, data: { loginUrl } });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate login URL',
    });
  }
};

/**
 * Microsoft OAuth Callback
 */
export const microsoftCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ success: false, error: 'Authorization code missing' });
      return;
    }

    const { user, token } = await handleMicrosoftCallback(code);

    // Redirect zum Frontend mit Token
    res.redirect(`${config.frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  } catch (error) {
    res.redirect(`${config.frontendUrl}/auth/error?message=${encodeURIComponent('Authentication failed')}`);
  }
};

/**
 * Aktuellen User abrufen
 */
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

/**
 * Demo Login (ohne Azure AD)
 */
export const demoLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    const { user, token } = await handleDemoLogin(email);

    res.json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    res.status(error instanceof Error && error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Demo login failed',
    });
  }
};

/**
 * Demo-Modus Status prüfen
 */
export const getDemoStatus = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: {
      enabled: config.demoMode,
      demoUsers: config.demoMode
        ? [
            { email: 'admin@demo.com', role: 'ADMIN', team: 'LeadGen + Mailakquise' },
            { email: 'teamleader@demo.com', role: 'TEAM_LEADER', team: 'Akquise' },
            { email: 'member@demo.com', role: 'MEMBER', team: 'Sales Development' },
          ]
        : [],
    },
  });
};

/**
 * Logout
 */
export const logoutUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await logout(req.user.id);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Logout failed',
    });
  }
};
