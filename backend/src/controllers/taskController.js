import mongoose from 'mongoose';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { getIO } from '../utils/socket.js';

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private/Admin
export const createTask = async (req, res, next) => {
    console.log('Creating task with body:', req.body);
    try {
        const { title, description, assignedTo } = req.body;

        // Check if assignedTo is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
            return res.status(400).json({ success: false, error: 'Invalid User ID for assignment' });
        }

        // Check if user exists
        const user = await User.findById(assignedTo);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Assigned user not found' });
        }

        const task = await Task.create({
            title,
            description,
            assignedTo,
            assignedBy: req.user.id,
            performedBy: req.user?.name || 'Admin'
        });

        getIO().emit('taskUpdated');

        res.status(201).json({
            success: true,
            data: task
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private/Admin
export const getTasks = async (req, res, next) => {
    try {
        let query;

        // If admin, get all tasks. If user, get only assigned tasks.
        if (req.user.role === 'admin') {
            query = Task.find().populate('assignedTo', 'name email').populate('assignedBy', 'name email');
        } else {
            query = Task.find({ assignedTo: req.user.id }).populate('assignedTo', 'name email').populate('assignedBy', 'name email');
        }

        const tasks = await query;

        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email');

        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        // Make sure user is task owner or admin
        if (task.assignedTo._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized to view this task' });
        }

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res, next) => {
    try {
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        // Authorization check
        if (task.assignedTo.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized to update this task' });
        }

        // Initialize activity history if not present
        let newHistory = [...task.activityHistory];

        // Track status changes
        if (req.body.status && req.body.status !== task.status) {
            newHistory.push({
                action: `Status updated to ${req.body.status}`,
                performedBy: req.user.name
            });
        }

        // Track title/description changes (Admin only typically)
        if (req.user.role === 'admin') {
            if (req.body.title && req.body.title !== task.title) {
                newHistory.push({
                    action: `Title updated from "${task.title}" to "${req.body.title}"`,
                    performedBy: req.user.name
                });
            }
            if (req.body.description !== undefined && req.body.description !== task.description) {
                newHistory.push({
                    action: `Description updated`,
                    performedBy: req.user.name
                });
            }
        }

        req.body.activityHistory = newHistory;

        task = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        getIO().emit('taskUpdated');

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
export const deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        // Only admin can delete
        if (req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized to delete tasks' });
        }

        await task.deleteOne();

        getIO().emit('taskUpdated');

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get dashboard stats
// @route   GET /api/tasks/stats
// @access  Private
export const getStats = async (req, res, next) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { assignedTo: req.user.id };

        const total = await Task.countDocuments(filter);
        const pending = await Task.countDocuments({ ...filter, status: 'pending' });
        const inProgress = await Task.countDocuments({ ...filter, status: 'in-progress' });
        const completed = await Task.countDocuments({ ...filter, status: 'completed' });

        res.status(200).json({
            success: true,
            data: { total, pending, inProgress, completed }
        });
    } catch (err) {
        next(err);
    }
};
