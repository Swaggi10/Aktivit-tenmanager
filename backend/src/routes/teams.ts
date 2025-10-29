import { Router } from 'express';
import * as teamController from '../controllers/teamController';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Alle Routes erfordern Authentifizierung
router.use(authenticate);

// Teams
router.get('/', teamController.getTeams);
router.get('/statistics', authorize(Role.ADMIN), teamController.getAllTeamStatistics);
router.get('/:id/statistics', teamController.getTeamStatistics);

// Unterauslastung
router.get(
  '/members/underutilized',
  authorize(Role.ADMIN, Role.TEAM_LEADER),
  teamController.getUnderutilizedMembers
);

export default router;
