'use client';

import React, { useState, useEffect, Suspense } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/utils/api';
import { io } from 'socket.io-client';

interface UserData {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface TaskHistory {
    action: string;
    timestamp: string;
    performedBy: string;
}

interface TaskData {
    _id: string;
    taskId: string;
    title: string;
    description: string;
    assignedTo: UserData;
    assignedBy: UserData;
    status: 'pending' | 'in-progress' | 'completed';
    activityHistory: TaskHistory[];
    createdAt: string;
}


const CloseButton = ({ onClick }: { onClick: () => void }) => (
    <button
        onClick={onClick}
        className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 transition-all flex-shrink-0"
        aria-label="Close"
    >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    </button>
);

const TasksContent = () => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [filter, setFilter] = useState('All');

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<TaskData | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '' });
    const [statusUpdate, setStatusUpdate] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    // ✅ Infinite loop fix — primitives use karo, objects nahi
    const userRole = (user as any)?.role;
    const createParam = searchParams.get('create');
    const isAdmin = userRole === 'admin';

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.push('/');
            return;
        }

        fetchTasks();

        if (isAdmin) {
            fetchUsers();
        }

        if (createParam === 'true' && isAdmin) {
            setShowCreateModal(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, userRole, createParam]);

    // Real-time updates
    useEffect(() => {
        if (!user) return;

        const socketURL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const socket = io(socketURL);

        socket.on('taskUpdated', () => {
            fetchTasks();
        });

        socket.on('userAdded', () => {
            if (isAdmin) {
                fetchUsers();
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [user, isAdmin]);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            setTasks(res.data.data);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskForm.assignedTo) {
            alert('Please select a user to assign the task to');
            return;
        }
        try {
            await api.post('/tasks', taskForm);
            setShowCreateModal(false);
            setTaskForm({ title: '', description: '', assignedTo: '' });
            fetchTasks();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to create task');
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedTask) return;
        try {
            await api.put(`/tasks/${selectedTask._id}`, { status: statusUpdate });
            setShowStatusModal(false);
            const res = await api.get(`/tasks/${selectedTask._id}`);
            setSelectedTask(res.data.data);
            fetchTasks();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleEditTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask) return;
        try {
            await api.put(`/tasks/${selectedTask._id}`, taskForm);
            setShowEditModal(false);
            fetchTasks();
            const res = await api.get(`/tasks/${selectedTask._id}`);
            setSelectedTask(res.data.data);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update task');
        }
    };

    const openEditModal = (task: TaskData) => {
        setTaskForm({
            title: task.title,
            description: task.description || '',
            assignedTo: task.assignedTo?._id || ''
        });
        setShowEditModal(true);
    };

    const handleDeleteTask = async () => {
        if (!taskToDelete) return;
        try {
            await api.delete(`/tasks/${taskToDelete._id}`);
            setShowDeleteModal(false);
            setTaskToDelete(null);
            setIsSidebarOpen(false);
            fetchTasks();
        } catch (err) {
            alert('Failed to delete task');
        }
    };

    const openViewModal = (task: TaskData) => {
        setSelectedTask(task);
        setShowViewModal(true);
    };

    const filteredTasks = tasks.filter(task => {
        const matchesFilter = filter === 'All' || task.status.toLowerCase() === filter.toLowerCase().replace(' ', '-');
        const matchesSearch =
            task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.taskId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.assignedTo?.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusPillStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'text-amber-500 border-amber-300 bg-white';
            case 'in-progress': return 'text-indigo-500 border-indigo-300 bg-white';
            case 'completed': return 'text-emerald-500 border-emerald-300 bg-white';
            default: return 'text-gray-400 border-gray-200 bg-white';
        }
    };

    const getStatusCardStyle = (status: string) => {
        switch (status) {
            case 'pending': return { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-500' };
            case 'in-progress': return { bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-500' };
            case 'completed': return { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-500' };
            default: return { bg: 'bg-gray-50 border-gray-100', text: 'text-gray-400' };
        }
    };

    const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-sm text-gray-700 placeholder:text-gray-300";

    return (
        <DashboardLayout onSearch={setSearchTerm}>
            {/* Page Header */}
            <div className="mb-5">
                <h1 className="text-2xl font-bold text-gray-900 mb-0.5">
                    {isAdmin ? 'All Tasks' : 'My Tasks'}
                </h1>
                <p className="text-sm text-gray-400">
                    {isAdmin ? 'Manage, assign, and track tasks across your team.' : 'Track and update your assigned tasks.'}
                </p>
            </div>

            {/* Filters + Create Button (Create only for admin) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto no-scrollbar">
                    {['All', 'Pending', 'In Progress', 'Completed'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all border whitespace-nowrap ${filter === f
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        Create Task
                    </button>
                )}
            </div>

            {/* ─── ADMIN VIEW ─── */}
            {isAdmin ? (
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    {/* Admin Table */}
                    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 w-full ${isSidebarOpen ? 'lg:flex-1' : ''}`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[700px]">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Task ID</th>
                                        <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Task Title</th>
                                        <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned To</th>
                                        <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                                        <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredTasks.map((task) => (
                                        <tr
                                            key={task._id}
                                            className={`hover:bg-gray-50/60 transition-colors ${selectedTask?._id === task._id && isSidebarOpen ? 'bg-indigo-50/30' : ''}`}
                                        >
                                            <td className="px-5 py-4 text-xs font-bold text-gray-700">#{task.taskId}</td>
                                            <td className="px-5 py-4 text-xs font-bold text-gray-700 max-w-[150px] truncate">{task.title}</td>
                                            <td className="px-5 py-4 text-xs font-bold text-gray-500">{task.assignedTo?.name}</td>
                                            <td className="px-5 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusPillStyle(task.status)} capitalize`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <button
                                                    onClick={() => { setSelectedTask(task); setIsSidebarOpen(true); }}
                                                    className="bg-gray-50 text-gray-600 px-4 py-1.5 rounded-lg text-[10px] font-bold hover:bg-gray-100 transition-all border border-gray-100"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredTasks.length === 0 && (
                            <div className="py-16 text-center text-gray-400">
                                <div className="text-4xl mb-3">📭</div>
                                <p className="font-bold text-sm">No tasks found</p>
                            </div>
                        )}
                    </div>

                    {/* Admin Inline Detail Panel */}
                    {isSidebarOpen && selectedTask && (() => {
                        const statusCard = getStatusCardStyle(selectedTask.status);
                        return (
                            <div className="fixed inset-0 lg:relative lg:inset-auto z-50 lg:z-0 w-full lg:w-[400px] h-full lg:h-auto bg-white lg:rounded-2xl border-l lg:border border-gray-100 shadow-2xl lg:shadow-sm overflow-y-auto animate-in slide-in-from-right duration-200"
                                style={{ maxHeight: '100vh', minHeight: '100vh' }}>
                                <div className="p-6 lg:p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-xl font-black text-gray-900">Task Details</h2>
                                        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                                        <div className="hidden lg:block">
                                            <CloseButton onClick={() => setIsSidebarOpen(false)} />
                                        </div>
                                    </div>

                                    <div className={`p-5 rounded-2xl border mb-8 flex justify-between items-center ${statusCard.bg}`}>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Status</p>
                                            <p className={`text-xl font-black capitalize ${statusCard.text}`}>{selectedTask.status}</p>
                                        </div>
                                        <button
                                            onClick={() => { setStatusUpdate(selectedTask.status); setShowStatusModal(true); }}
                                            className="bg-white text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all shadow-sm"
                                        >
                                            Update
                                        </button>
                                    </div>

                                    <div className="space-y-6 mb-8">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Task Title</p>
                                            <p className="text-lg font-black text-gray-900 leading-tight">{selectedTask.title}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Assigned To</p>
                                                <p className="text-sm font-bold text-gray-900">{selectedTask.assignedTo?.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Task ID</p>
                                                <p className="text-sm font-bold text-gray-900">#{selectedTask.taskId}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Description</p>
                                            <p className="text-sm text-gray-500 leading-relaxed">{selectedTask.description || 'No description provided.'}</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-50 mb-8" />

                                    <div className="mb-8">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Activity History</p>
                                        <div className="space-y-6 relative">
                                            <div className="absolute left-[7px] top-2 bottom-2 w-[1.5px] bg-gray-100" />
                                            {selectedTask.activityHistory?.map((h, i) => (
                                                <div key={i} className="flex gap-5 relative">
                                                    <div className={`w-[15px] h-[15px] rounded-full border-2 border-white shadow-sm mt-0.5 z-10 flex-shrink-0 ${i === 0 ? 'bg-gray-900' : 'bg-gray-200'}`} />
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{h.action}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                                                            {new Date(h.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 sticky bottom-0 bg-white pt-4 pb-2">
                                        <button
                                            onClick={() => { setTaskToDelete(selectedTask); setShowDeleteModal(true); }}
                                            className="flex-1 bg-gray-50 text-gray-700 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all border border-gray-100"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => openEditModal(selectedTask)}
                                            className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                        >
                                            Edit Task
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            ) : (
                /* ─── USER VIEW ─── */
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Task ID</th>
                                    <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Task Title</th>
                                    <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned By</th>
                                    <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                                    <th className="px-5 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredTasks.map((task) => (
                                    <tr key={task._id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-5 py-4 text-xs font-bold text-gray-700">#{task.taskId}</td>
                                        <td className="px-5 py-4 text-xs font-bold text-gray-700 max-w-[150px] truncate">{task.title}</td>
                                        <td className="px-5 py-4 text-xs font-bold text-gray-500">
                                            {task.assignedBy?.name || 'Admin'}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusPillStyle(task.status)} capitalize`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => { setSelectedTask(task); setIsSidebarOpen(true); }}
                                                    className="bg-gray-50 text-gray-600 px-4 py-1.5 rounded-lg text-[10px] font-bold hover:bg-gray-100 transition-all border border-gray-100"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedTask(task); setStatusUpdate(task.status); setShowStatusModal(true); }}
                                                    className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all shadow-sm"
                                                >
                                                    Update
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredTasks.length === 0 && (
                        <div className="py-16 text-center text-gray-400">
                            <div className="text-4xl mb-3">📭</div>
                            <p className="font-bold text-sm">No tasks found</p>
                        </div>
                    )}
                </div>
            )}

            {/* ─── ADMIN MODALS ─── */}

            {/* Create Task Modal - Admin only */}
            {isAdmin && showCreateModal && (
                <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-[480px] rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between px-8 pt-7 pb-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Create Task</h2>
                            <CloseButton onClick={() => setShowCreateModal(false)} />
                        </div>
                        <form onSubmit={handleCreateTask} className="px-8 py-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Task title</label>
                                <input
                                    type="text"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    placeholder="Enter the task title"
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    placeholder="Briefly describe what needs to be done"
                                    rows={4}
                                    className={`${inputClass} resize-none`}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned User Dropdown</label>
                                <div className="relative">
                                    <select
                                        value={taskForm.assignedTo}
                                        onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                                        className={`${inputClass} appearance-none pr-10`}
                                        required
                                    >
                                        <option value="">Assign to</option>
                                        {users.map(u => (
                                            <option key={u._id} value={u._id}>{u.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-1 pb-2">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-50 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-all border border-gray-100">Cancel</button>
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all">Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Task Modal - Admin only */}
            {isAdmin && showEditModal && (
                <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-50 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-[480px] rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between px-8 pt-7 pb-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Edit Task</h2>
                            <CloseButton onClick={() => setShowEditModal(false)} />
                        </div>
                        <form onSubmit={handleEditTask} className="px-8 py-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Task title</label>
                                <input
                                    type="text"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    placeholder="Enter the task title"
                                    className={inputClass}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    placeholder="Briefly describe what needs to be done"
                                    rows={4}
                                    className={`${inputClass} resize-none`}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned User Dropdown</label>
                                <div className="relative">
                                    <select
                                        value={taskForm.assignedTo}
                                        onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                                        className={`${inputClass} appearance-none pr-10`}
                                        required
                                    >
                                        <option value="">Assign to</option>
                                        {users.map(u => (
                                            <option key={u._id} value={u._id}>{u.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-1 pb-2">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-50 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-all border border-gray-100">Cancel</button>
                                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal - Admin only */}
            {isAdmin && showDeleteModal && (
                <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-[70] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-[420px] rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-end px-6 pt-5">
                            <CloseButton onClick={() => setShowDeleteModal(false)} />
                        </div>
                        <div className="px-8 pb-8 text-center">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete this task?</h2>
                            <p className="text-sm text-gray-400 mb-8">This action cannot be undone. The task will be permanently removed.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowDeleteModal(false)} className="flex-1 bg-gray-50 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-all border border-gray-100">Cancel</button>
                                <button onClick={handleDeleteTask} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-red-600 transition-all">Delete Task</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── USER View Modal (Task Details) ─── */}
            {!isAdmin && showViewModal && selectedTask && (() => {
                const statusCard = getStatusCardStyle(selectedTask.status);
                return (
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-50 flex items-center justify-center p-6">
                        <div className="bg-white w-full max-w-[480px] rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">Task Status</h2>
                                <CloseButton onClick={() => setShowViewModal(false)} />
                            </div>
                            <div className="px-8 py-6 space-y-5">
                                {/* Status Banner */}
                                <div className={`p-4 rounded-xl border flex justify-between items-center ${statusCard.bg}`}>
                                    <p className="text-sm text-gray-500 font-medium">Status</p>
                                    <p className={`text-lg font-bold capitalize ${statusCard.text}`}>{selectedTask.status}</p>
                                </div>

                                {/* Task Info */}
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Task Title</p>
                                    <p className="text-base font-bold text-gray-900">{selectedTask.title}</p>
                                </div>
                                <div className="flex gap-10">
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Assigned By</p>
                                        <p className="text-sm font-bold text-gray-900">{selectedTask.assignedBy?.name || selectedTask.assignedTo?.name || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Task ID</p>
                                        <p className="text-sm font-bold text-gray-900">#{selectedTask.taskId}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Description</p>
                                    <p className="text-sm text-gray-500 leading-relaxed">{selectedTask.description || 'No description provided for this task.'}</p>
                                </div>

                                <div className="border-t border-gray-100" />

                                {/* Activity History */}
                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Activity History</p>
                                    <div className="space-y-4 relative">
                                        <div className="absolute left-[7px] top-2 bottom-2" style={{ borderLeft: '1.5px dashed #e5e7eb' }} />
                                        {selectedTask.activityHistory?.map((h, i) => (
                                            <div key={i} className="flex gap-4 relative">
                                                <div className={`w-[15px] h-[15px] rounded-full mt-0.5 z-10 flex-shrink-0 ${i === 0 ? 'bg-gray-900' : 'bg-white'}`}
                                                    style={i !== 0 ? { border: '2px solid #d1d5db' } : {}} />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{h.action}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {new Date(h.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-3 pt-1">
                                    <button
                                        onClick={() => setShowViewModal(false)}
                                        className="flex-1 bg-gray-50 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-all border border-gray-100"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowViewModal(false);
                                            setStatusUpdate(selectedTask.status);
                                            setShowStatusModal(true);
                                        }}
                                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all"
                                    >
                                        Update Task
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ─── Status Update Modal (Both Admin & User) ─── */}
            {showStatusModal && selectedTask && (() => {
                const statusCard = getStatusCardStyle(selectedTask.status);
                return (
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-[60] flex items-center justify-center p-6">
                        <div className="bg-white w-full max-w-[460px] rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">Task Status</h2>
                                <CloseButton onClick={() => setShowStatusModal(false)} />
                            </div>
                            <div className="px-8 py-6 space-y-5">
                                <div className={`p-4 rounded-xl border flex justify-between items-center ${statusCard.bg}`}>
                                    <p className="text-sm text-gray-500 font-medium">Status</p>
                                    <p className={`text-lg font-bold capitalize ${statusCard.text}`}>{selectedTask.status}</p>
                                </div>

                                <div>
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Task Title</p>
                                    <p className="text-base font-bold text-gray-900">{selectedTask.title}</p>
                                </div>
                                <div className="flex gap-10">
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                                            {isAdmin ? 'Assigned To' : 'Assigned By'}
                                        </p>
                                        <p className="text-sm font-bold text-gray-900">
                                            {isAdmin
                                                ? selectedTask.assignedTo?.name
                                                : (selectedTask.assignedBy?.name || selectedTask.assignedTo?.name || '—')
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Task ID</p>
                                        <p className="text-sm font-bold text-gray-900">#{selectedTask.taskId}</p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100" />

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Update status</label>
                                    <div className="relative">
                                        <select
                                            value={statusUpdate}
                                            onChange={(e) => setStatusUpdate(e.target.value)}
                                            className={`${inputClass} appearance-none pr-10`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        {isAdmin
                                            ? 'Changing the status will update it for the assigned user.'
                                            : 'Changing the status will update it for the admin.'
                                        }
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-1">
                                    <button onClick={() => setShowStatusModal(false)} className="flex-1 bg-gray-50 text-gray-700 py-3 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-all border border-gray-100">Cancel</button>
                                    <button onClick={handleUpdateStatus} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all">Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </DashboardLayout>
    );
};

const Tasks = () => {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Loading tasks...</div>}>
            <TasksContent />
        </Suspense>
    );
};

export default Tasks;