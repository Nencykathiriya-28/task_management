import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a task title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    assignedTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    assignedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },

    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    },
    taskId: {
        type: String,
        unique: true
    },
    activityHistory: [
        {
            action: String,
            timestamp: {
                type: Date,
                default: Date.now
            },
            performedBy: String
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    performedBy: String
});

// Generate a random Task ID like #TSK123 before saving
taskSchema.pre('save', async function () {
    if (!this.taskId) {
        this.taskId = 'TSK' + Math.floor(100 + Math.random() * 900);
    }

    if (this.isNew) {
        this.activityHistory.push({
            action: 'Task created by Admin',
            performedBy: this.performedBy || 'Admin'
        });
    }
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
