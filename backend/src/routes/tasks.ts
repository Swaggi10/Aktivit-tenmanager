import { Router } from 'express';
import * as taskController from '../controllers/taskController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { Role } from '@prisma/client';

const router = Router();

// Alle Routes erfordern Authentifizierung
router.use(authenticate);

// Tasks CRUD
router.post(
  '/',
  authorize(Role.ADMIN, Role.TEAM_LEADER),
  validate(taskController.createTaskValidation),
  taskController.createTask
);

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTask);

router.patch(
  '/:id',
  validate(taskController.updateTaskValidation),
  taskController.updateTask
);

// Subtasks
router.post('/:id/subtasks', taskController.createSubtask);
router.patch('/subtasks/:id/complete', taskController.completeSubtask);

export default router;
