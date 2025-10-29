import { ConfidentialClientApplication, AuthorizationUrlRequest, AuthorizationCodeRequest } from '@azure/msal-node';
import { config } from '../config/env';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';
import { User } from '@prisma/client';

// MSAL Configuration
const msalConfig = {
  auth: {
    clientId: config.azure.clientId,
    authority: `https://login.microsoftonline.com/${config.azure.tenantId}`,
    clientSecret: config.azure.clientSecret,
  },
};

const msalClient = new ConfidentialClientApplication(msalConfig);

/**
 * Microsoft Login URL generieren
 */
export const getMicrosoftLoginUrl = async (): Promise<string> => {
  const authCodeUrlParameters: AuthorizationUrlRequest = {
    scopes: ['user.read', 'openid', 'profile', 'email'],
    redirectUri: config.azure.redirectUri,
  };

  try {
    const response = await msalClient.getAuthCodeUrl(authCodeUrlParameters);
    return response;
  } catch (error) {
    throw new AppError('Failed to generate Microsoft login URL', 500);
  }
};

/**
 * Microsoft OAuth Callback verarbeiten
 */
export const handleMicrosoftCallback = async (code: string): Promise<{ user: User; token: string }> => {
  const tokenRequest: AuthorizationCodeRequest = {
    code,
    scopes: ['user.read', 'openid', 'profile', 'email'],
    redirectUri: config.azure.redirectUri,
  };

  try {
    // Token von Microsoft abrufen
    const response = await msalClient.acquireTokenByCode(tokenRequest);

    if (!response || !response.account) {
      throw new AppError('Failed to acquire token from Microsoft', 500);
    }

    const { account } = response;
    const email = account.username;
    const name = account.name || email;
    const microsoftId = account.homeAccountId;

    // User in Datenbank suchen oder erstellen
    let user = await prisma.user.findUnique({
      where: { email },
      include: { team: true },
    });

    if (!user) {
      // Neuer User - muss von Admin einem Team zugewiesen werden
      // Standardmäßig dem ersten Team zuweisen (kann später geändert werden)
      const defaultTeam = await prisma.team.findFirst();

      if (!defaultTeam) {
        throw new AppError('No teams available. Please contact administrator.', 500);
      }

      user = await prisma.user.create({
        data: {
          email,
          name,
          microsoftId,
          teamId: defaultTeam.id,
          microsoftData: response.account as unknown as Record<string, unknown>,
        },
        include: { team: true },
      });
    } else {
      // Bestehender User - Microsoft-Daten aktualisieren
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          microsoftId,
          microsoftData: response.account as unknown as Record<string, unknown>,
          lastActive: new Date(),
        },
        include: { team: true },
      });
    }

    // JWT Token generieren
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  } catch (error) {
    throw new AppError('Microsoft authentication failed', 500);
  }
};

/**
 * Demo Login (ohne Azure AD)
 * Für Entwicklung und Tests
 */
export const handleDemoLogin = async (email: string): Promise<{ user: User; token: string }> => {
  // Nur in Development-Modus erlaubt
  if (config.nodeEnv === 'production' && !config.demoMode) {
    throw new AppError('Demo login is disabled in production', 403);
  }

  // Demo-User aus Datenbank laden
  let user = await prisma.user.findUnique({
    where: { email },
    include: { team: true },
  });

  if (!user) {
    throw new AppError('Demo user not found. Please run database seed.', 404);
  }

  // Last active aktualisieren
  user = await prisma.user.update({
    where: { id: user.id },
    data: { lastActive: new Date() },
    include: { team: true },
  });

  // JWT Token generieren
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, token };
};

/**
 * User ausloggen (Token wird client-seitig entfernt)
 */
export const logout = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { lastActive: new Date() },
  });
};
