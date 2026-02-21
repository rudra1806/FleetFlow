import { useState, useEffect } from 'react';
import {
    Truck,
    MapPin,
    Users,
    AlertCircle,
    TrendingUp,
    Fuel,
    Wrench
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
    const [stats, setStats] = useState({
        fleet: { total: 0, in_shop: 0 },
        trips: { ongoing: 0 },
        drivers: { total: 0 }
    });

    const [loading, setLoading] = useState(true);
useEffect(() => {
    const fetchStats = async () => {
        try {
            const response = await api.get('/dashboard');

            console.log("Dashboard API:", response.data);

            const data = response.data?.dashboard || {};

            setStats({
                fleet: {
                    total: data?.vehicles?.total || 0,
                    in_shop: data?.vehicles?.inShop || 0
                },
                trips: {
                    ongoing: data?.trips?.active || 0
                },
                drivers: {
                    total: data?.drivers?.total || 0
                }
            });

        } catch (error) {
            console.error("Dashboard error:", error);

            setStats({
                fleet: { total: 0, in_shop: 0 },
                trips: { ongoing: 0 },
                drivers: { total: 0 }
            });
        } finally {
            setLoading(false);
        }
    };

    fetchStats();
}, []);
    if (loading) {
        return (
            <div className="dashboard">
                <p style={{ padding: "20px" }}>Loading dashboard...</p>
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
                        <h3>Monthly Fleet Utilization</h3>
                    </div>
                    <div className="chart-placeholder">
                        <p className="text-muted">
                            Real-time utilization analytics coming soon...
                        </p>
                    </div>
                </div>

                <div className="glass-card secondary-stats">
                    <div className="card-header">
                        <h3>Quick Actions</h3>
                    </div>
                    <div className="actions-list">
                        <button className="action-item">
                            <div className="action-icon fuel">
                                <Fuel size={20} />
                            </div>
                            <span>Log Fuel Expense</span>
                        </button>

                        <button className="action-item">
                            <div className="action-icon service">
                                <Wrench size={20} />
                            </div>
                            <span>Schedule Maintenance</span>
                        </button>

                        <button className="action-item">
                            <div className="action-icon trip">
                                <MapPin size={20} />
                            </div>
                            <span>New Trip Dispatch</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;