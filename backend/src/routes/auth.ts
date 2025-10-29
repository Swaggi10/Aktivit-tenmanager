import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Demo Login
router.get('/demo/status', authController.getDemoStatus);
router.post('/demo/login', authController.demoLogin);

// Microsoft Login
router.get('/microsoft', authController.getMicrosoftLogin);
router.get('/microsoft/callback', authController.microsoftCallback);

// User Info
router.get('/me', authenticate, authController.getCurrentUser);

// Logout
router.post('/logout', authenticate, authController.logoutUser);

export default router;
