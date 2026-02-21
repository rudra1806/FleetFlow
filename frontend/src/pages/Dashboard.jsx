import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    Truck,
    MapPin,
    Users,
    AlertCircle,
    TrendingUp,
    Fuel,
    Wrench,
    ChevronRight
} from 'lucide-react';
import api from '../services/api';
import './Dashboard.css';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="glass-card stat-card">
        <div className="stat-content">
            <p className="stat-title">{title}</p>
            <h3 className="stat-value">{value}</h3>
            {trend !== undefined && (
                <div className={`stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
                    <TrendingUp size={14} />
                    <span>{Math.abs(trend)}% from last month</span>
                </div>
            )}
        </div>
        <div
            className="stat-icon"
            style={{ backgroundColor: `${color}20`, color: color }}
        >
            <Icon size={24} />
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        fleet: { total: 0, in_shop: 0, available: 0, active: 0, retired: 0 },
        trips: { ongoing: 0 },
        drivers: { total: 0 },
        monthlyData: [],
        statusData: []
    });

    const [loading, setLoading] = useState(true);

    const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#64748b'];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/dashboard');
                const data = response.data?.dashboard || {};

                const statusData = [
                    { name: 'Available', value: data?.vehicles?.available || 0 },
                    { name: 'On Trip', value: data?.vehicles?.active || 0 },
                    { name: 'In Shop', value: data?.vehicles?.inShop || 0 },
                    { name: 'Retired', value: data?.vehicles?.retired || 0 }
                ].filter(item => item.value > 0);

                setStats({
                    fleet: {
                        total: data?.vehicles?.total || 0,
                        available: data?.vehicles?.available || 0,
                        active: data?.vehicles?.active || 0,
                        in_shop: data?.vehicles?.inShop || 0,
                        retired: data?.vehicles?.retired || 0
                    },
                    trips: {
                        ongoing: data?.trips?.active || 0
                    },
                    drivers: {
                        total: data?.drivers?.total || 0
                    },
                    monthlyData: data?.monthlyStats || [],
                    statusData
                });

            } catch (error) {
                console.error("Dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loader"></div>
                <p>Loading fleet intelligence...</p>
            </div>
        );
    }

    return (
        <div className="dashboard animate-fade-in">
            <div className="stats-grid">
                <StatCard
                    title="Total Vehicles"
                    value={stats.fleet.total}
                    icon={Truck}
                    color="#3b82f6"
                />
                <StatCard
                    title="Active Trips"
                    value={stats.trips.ongoing}
                    icon={MapPin}
                    color="#10b981"
                />
                <StatCard
                    title="Total Drivers"
                    value={stats.drivers.total}
                    icon={Users}
                    color="#f59e0b"
                />
                <StatCard
                    title="Service Alerts"
                    value={stats.fleet.in_shop}
                    icon={AlertCircle}
                    color="#ef4444"
                />
            </div>

            <div className="dashboard-grid">
                <div className="glass-card main-chart">
                    <div className="card-header">
                        <h3>Monthly Fleet Activity</h3>
                        <p className="text-muted small">Trips vs Expenses (Count)</p>
                    </div>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stats.monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="trips" fill="#3b82f6" name="Trips" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="expenses" fill="#10b981" name="Expenses" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card secondary-stats">
                    <div className="card-header">
                        <h3>Fleet Status</h3>
                    </div>
                    <div className="chart-container pie-center">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={stats.statusData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pie-labels">
                            {stats.statusData.map((item, idx) => (
                                <div key={item.name} className="pie-label-item">
                                    <span className="dot" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                    <span className="label-text">{item.name}</span>
                                    <span className="label-value">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="glass-card full-width">
                    <div className="card-header">
                        <h3>Quick Actions</h3>
                    </div>
                    <div className="actions-flex">
                        <button className="action-btn" onClick={() => navigate('/expenses')}>
                            <div className="btn-icon-wrapper fuel">
                                <Fuel size={20} />
                            </div>
                            <div className="btn-text">
                                <span>Log Fuel Expense</span>
                                <small>Add new fuel receipt</small>
                            </div>
                            <ChevronRight size={18} />
                        </button>

                        <button className="action-btn" onClick={() => navigate('/maintenance')}>
                            <div className="btn-icon-wrapper service">
                                <Wrench size={20} />
                            </div>
                            <div className="btn-text">
                                <span>Schedule Service</span>
                                <small>Preventive maintenance</small>
                            </div>
                            <ChevronRight size={18} />
                        </button>

                        <button className="action-btn" onClick={() => navigate('/trips')}>
                            <div className="btn-icon-wrapper trip">
                                <MapPin size={20} />
                            </div>
                            <div className="btn-text">
                                <span>New Trip</span>
                                <small>Dispatch vehicle</small>
                            </div>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;