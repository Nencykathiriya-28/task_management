'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

interface StatsData {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
}

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

export default function Home() {
    const { user, loading } = useAuth() as any;
    const router = useRouter();

    const [stats, setStats] = useState<StatsData>({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0
    });

    const [tasks, setTasks] = useState<TaskData[]>([]);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [statusUpdate, setStatusUpdate] = useState<string>('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
        if (user) {
            fetchStats();
            if (user.role === 'user') {
                fetchTasks();
            }
        }
    }, [user, loading, router]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/tasks/stats');
            setStats(res.data.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            setTasks(res.data.data);
        } catch (err) {
            console.error('Error fetching tasks:', err);
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
            fetchStats();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    if (loading) return null;

    const cards = [
        {
            title: user?.role === 'admin' ? 'Total Tasks' : 'My Tasks',
            value: stats.total,
            borderColor: '#6366f1',
            barColor: 'rgba(99,102,241,0.25)',
            text: user?.role === 'admin' ? 'All tasks created so far' : 'All tasks assigned to you'
        },
        {
            title: 'Pending Tasks',
            value: stats.pending,
            borderColor: '#f59e0b',
            barColor: 'rgba(245,158,11,0.25)',
            text: 'Tasks waiting to be started'
        },
        {
            title: 'In Progress Tasks',
            value: stats.inProgress,
            borderColor: '#a78bfa',
            barColor: 'rgba(167,139,250,0.25)',
            text: user?.role === 'admin' ? 'Tasks currently being worked on' : "Tasks you're currently working on"
        },
        {
            title: 'Completed Tasks',
            value: stats.completed,
            borderColor: '#34d399',
            barColor: 'rgba(52,211,153,0.25)',
            text: user?.role === 'admin' ? 'Tasks finished successfully' : "Tasks you've finished"
        },
    ];

    const filteredTasks = tasks.filter(task => {
        const matchesFilter = filter === 'All' || task.status.toLowerCase() === filter.toLowerCase().replace(' ', '-');
        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.taskId.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'text-amber-500 border-amber-300 bg-white';
            case 'in-progress': return 'text-indigo-500 border-indigo-300 bg-white';
            case 'completed': return 'text-emerald-500 border-emerald-300 bg-white';
            default: return 'text-gray-400 border-gray-200 bg-white';
        }
    };

    return (
        <DashboardLayout onSearch={setSearchTerm}>
            {user?.role === 'admin' && (
                <h1 className="text-xl lg:text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 mb-8 lg:mb-10 border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                {cards.map((card, i) => (
                    <div
                        key={i}
                        className={`bg-white p-5 lg:p-6 relative overflow-hidden ${
                            i > 0 ? 'border-t lg:border-t-0 lg:border-l border-gray-50' : ''
                        }`}
                    >
                        {/* Colored left vertical accent */}
                        <div
                            className="absolute left-0 top-0 w-[3px] h-full rounded-r"
                            style={{ background: card.borderColor }}
                        />

                        <div className="flex justify-between items-start mb-1 pl-2">
                            <div className="max-w-[70%]">
                                <h3 className="text-xs lg:text-sm font-semibold text-gray-500 truncate">{card.title}</h3>
                                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight line-clamp-1">{card.text}</p>
                            </div>
                            <span className="text-2xl lg:text-4xl font-black text-gray-900 leading-none">{card.value}</span>
                        </div>

                        {/* Bar chart */}
                        <div className="flex items-end gap-[2px] h-12 lg:h-16 mt-4 overflow-hidden pl-2">
                            {[...Array(30)].map((_, j) => {
                                const seed = (card.value * 10) + j;
                                const height = 30 + (Math.sin(seed * 0.4) * 25) + (Math.cos(seed * 0.2) * 25);
                                return (
                                    <div
                                        key={j}
                                        className="w-[2px] lg:w-[3px] rounded-sm"
                                        style={{
                                            height: `${Math.max(15, Math.min(100, height))}%`,
                                            background: card.barColor,
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {user?.role === 'admin' ? (
                <>
                    {/* Quick Actions */}
                    <p className="text-sm font-semibold text-gray-500 mb-4">Quick actions</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                            onClick={() => router.push('/tasks')}
                            className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 lg:gap-5 cursor-pointer hover:shadow-md transition-all group"
                        >
                            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="lg:w-6 lg:h-6">
                                    <rect x="3" y="5" width="3" height="3" rx="1" fill="#6366f1" opacity="0.7" />
                                    <line x1="8" y1="6.5" x2="21" y2="6.5" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                                    <rect x="3" y="11" width="3" height="3" rx="1" fill="#6366f1" opacity="0.7" />
                                    <line x1="8" y1="12.5" x2="21" y2="12.5" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                                    <rect x="3" y="17" width="3" height="3" rx="1" fill="#6366f1" opacity="0.7" />
                                    <line x1="8" y1="18.5" x2="21" y2="18.5" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base lg:text-lg font-bold text-gray-900">All tasks</h3>
                                <p className="text-xs lg:text-sm text-gray-400">View and manage all tasks</p>
                            </div>
                        </div>

                        <div
                            onClick={() => router.push('/tasks?create=true')}
                            className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 lg:gap-5 cursor-pointer hover:shadow-md transition-all group"
                        >
                            <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="lg:w-6 lg:h-6">
                                    <rect x="3" y="5" width="3" height="3" rx="1" fill="#6366f1" opacity="0.7" />
                                    <line x1="8" y1="6.5" x2="15" y2="6.5" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                                    <rect x="3" y="11" width="3" height="3" rx="1" fill="#6366f1" opacity="0.7" />
                                    <line x1="8" y1="12.5" x2="15" y2="12.5" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                                    <circle cx="19" cy="17" r="4" fill="#6366f1" opacity="0.15" />
                                    <line x1="19" y1="14.5" x2="19" y2="19.5" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" />
                                    <line x1="16.5" y1="17" x2="21.5" y2="17" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base lg:text-lg font-bold text-gray-900">Create Task</h3>
                                <p className="text-xs lg:text-sm text-gray-400">Assign a new task</p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Tasks Section */}
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h2 className="text-xl lg:text-2xl font-black text-gray-900 mb-0.5">My Tasks</h2>
                            <p className="text-xs lg:text-sm text-gray-400">Track and update your assigned tasks.</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                        {['All', 'Pending', 'In Progress', 'Completed'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 lg:px-5 py-1.5 rounded-full text-xs lg:text-sm font-semibold transition-all border whitespace-nowrap ${filter === f
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Tasks Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[600px]">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Task ID</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Task Title</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Assigned By</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredTasks.map((task) => (
                                        <tr key={task._id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-6 py-4 text-xs font-semibold text-gray-700">#{task.taskId}</td>
                                            <td className="px-6 py-4 text-xs font-semibold text-gray-700 max-w-[150px] truncate">{task.title}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-gray-500 text-center">{task.assignedBy?.name || 'Admin'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-semibold border ${getStatusStyle(task.status)} capitalize`}>
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-1.5">
                                                    <button
                                                        onClick={() => { setSelectedTask(task); setIsSidebarOpen(true); }}
                                                        className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all border border-gray-100"
                                                        title="View"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                            <circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedTask(task); setStatusUpdate(task.status); setShowStatusModal(true); }}
                                                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
                                                        title="Update"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
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
                                <p className="font-semibold text-sm">No tasks found.</p>
                            </div>
                        )}
                    </div>

                    {/* Task Details Sidebar */}
                    {isSidebarOpen && selectedTask && (
                        <div className="fixed inset-0 z-[100] overflow-hidden">
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={() => setIsSidebarOpen(false)} />
                            <div className="absolute top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl p-6 lg:p-10 overflow-y-auto animate-in slide-in-from-right duration-300">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-xl lg:text-2xl font-black text-gray-900">Task Details</h2>
                                    <button onClick={() => setIsSidebarOpen(false)} className="text-gray-300 hover:text-gray-700 text-xl">✕</button>
                                </div>
                                
                                <div className={`p-5 rounded-2xl border mb-8 flex justify-between items-center ${getStatusStyle(selectedTask.status)}`}
                                    style={{ background: selectedTask.status === 'pending' ? '#fffbeb' : selectedTask.status === 'in-progress' ? '#eef2ff' : '#f0fdf4' }}>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Status</p>
                                        <p className="text-xl font-black capitalize">{selectedTask.status}</p>
                                    </div>
                                    <button
                                        onClick={() => { setStatusUpdate(selectedTask.status); setShowStatusModal(true); }}
                                        className="bg-white px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-100 hover:bg-gray-50 transition-all shadow-sm text-gray-700"
                                    >
                                        Update
                                    </button>
                                </div>

                                <div className="space-y-6 mb-10">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Task Title</label>
                                        <p className="text-lg font-black text-gray-900">{selectedTask.title}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Assigned By</label>
                                            <p className="text-sm font-bold text-gray-900">{selectedTask.assignedBy?.name || 'Admin'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Task ID</label>
                                            <p className="text-sm font-bold text-gray-900">#{selectedTask.taskId}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                                        <p className="text-gray-500 leading-relaxed text-sm">{selectedTask.description || 'No description provided.'}</p>
                                    </div>
                                </div>

                                <div className="mb-10">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-5">Activity History</label>
                                    <div className="space-y-6 relative">
                                        <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gray-100" />
                                        {selectedTask.activityHistory?.map((h, i) => (
                                            <div key={i} className="flex gap-4 relative">
                                                <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm mt-1 z-10 flex-shrink-0 ${i === 0 ? 'bg-gray-800' : 'bg-gray-200'}`} />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{h.action}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                                                        {new Date(h.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={() => setIsSidebarOpen(false)} className="w-full bg-gray-50 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-100 transition-all border border-gray-100">Close</button>
                            </div>
                        </div>
                    )}

                    {/* Status Update Modal */}
                    {showStatusModal && selectedTask && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                            <div className="bg-white w-full max-w-[400px] rounded-3xl p-6 lg:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
                                <button onClick={() => setShowStatusModal(false)} className="absolute top-6 right-6 text-gray-300 hover:text-gray-700">✕</button>
                                <h2 className="text-xl font-black text-gray-900 mb-6">Update Status</h2>
                                
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current</span>
                                        <span className="text-sm font-black text-indigo-600 capitalize">{selectedTask.status}</span>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">New Status</label>
                                        <select
                                            value={statusUpdate}
                                            onChange={(e) => setStatusUpdate(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm text-gray-700"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setShowStatusModal(false)} className="flex-1 bg-gray-50 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all text-sm border border-gray-100">Cancel</button>
                                    <button onClick={handleUpdateStatus} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm shadow-lg shadow-indigo-100">Update</button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </DashboardLayout>
    );
}