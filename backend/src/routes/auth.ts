import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Microsoft Login
router.get('/microsoft', authController.getMicrosoftLogin);
router.get('/microsoft/callback', authController.microsoftCallback);

// User Info
router.get('/me', authenticate, authController.getCurrentUser);

// Logout
router.post('/logout', authenticate, authController.logoutUser);

export default router;
