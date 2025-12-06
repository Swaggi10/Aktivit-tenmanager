import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { Role } from '@prisma/client';

const router = Router();

// Alle Routes erfordern Authentifizierung
router.use(authenticate);

// Admin Dashboard
router.get(
  '/admin/dashboard',
  authorize(Role.ADMIN),
  userController.getAdminDashboard
);

// User Management (Admin only)
router.get(
  '/',
  authorize(Role.ADMIN),
  userController.getUsers
);

router.post(
  '/',
  authorize(Role.ADMIN),
  validate(userController.createUserValidation),
  userController.createUser
);

router.patch(
  '/:id',
  authorize(Role.ADMIN),
  validate(userController.updateUserValidation),
  userController.updateUser
);

router.patch(
  '/:id/team',
  authorize(Role.ADMIN),
  validate(userController.assignTeamValidation),
  userController.assignToTeam
);

router.patch(
  '/:id/role',
  authorize(Role.ADMIN),
  validate(userController.updateRoleValidation),
  userController.updateRole
);

router.delete(
  '/:id',
  authorize(Role.ADMIN),
  userController.deactivateUser
);

// Workload Analysis (Admin & Team Leader)
router.get(
  '/workload',
  authorize(Role.ADMIN, Role.TEAM_LEADER),
  userController.getUsersWorkload
);

router.get(
  '/workload/overloaded',
  authorize(Role.ADMIN),
  userController.getOverloadedUsers
);

router.get(
  '/workload/underutilized',
  authorize(Role.ADMIN),
  userController.getUnderutilizedUsers
);

router.get(
  '/workload/overdue',
  authorize(Role.ADMIN),
  userController.getUsersWithOverdueTasks
);

export default router;
