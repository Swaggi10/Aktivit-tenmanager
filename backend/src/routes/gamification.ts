import { Router } from 'express';
import * as gamificationController from '../controllers/gamificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Alle Routes erfordern Authentifizierung
router.use(authenticate);

// Leaderboards
router.get('/leaderboard', gamificationController.getLeaderboard);
router.get('/leaderboard/teams', gamificationController.getTeamLeaderboard);

// Achievements
router.get('/achievements', gamificationController.getAllAchievements);
router.get('/achievements/me', gamificationController.getUserAchievements);

// User Rank
router.get('/rank/me', gamificationController.getUserRank);

export default router;
