import express from 'express';
import { 
    createTask, 
    getTasks, 
    getTask, 
    updateTask, 
    deleteTask,
    getStats
} from '../controllers/taskController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getStats);

router
    .route('/')
    .get(getTasks)
    .post(authorize('admin'), createTask);

router
    .route('/:id')
    .get(getTask)
    .put(updateTask)
    .delete(authorize('admin'), deleteTask);

export default router;
