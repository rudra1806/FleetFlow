import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area
} from 'recharts';
import { Calendar, Filter, Download } from 'lucide-react';
import api from '../services/api';
import './Analytics.css';
import Button from '../components/common/Button';

const Analytics = () => {
    const [fuelData, setFuelData] = useState([]);
    const [roiData, setRoiData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [fuelRes, roiRes] = await Promise.all([
                    api.get('/analytics/fuel-efficiency'),
                    api.get('/analytics/vehicle-roi')
                ]);
                setFuelData(fuelRes.data.data);
                setRoiData(roiRes.data.data);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="analytics-page animate-fade-in">
            <div className="analytics-header">
                <div className="date-filter glass-effect">
                    <Calendar size={18} />
                    <span>Last 30 Days</span>
                </div>
                <div className="analytics-actions">
                    <Button variant="secondary" icon={Filter}>Filters</Button>
                    <Button variant="outline" icon={Download}>Export PDF</Button>
                </div>
            </div>

            <div className="analytics-grid">
                <div className="glass-card chart-container full-width">
                    <h3>Vehicle ROI Analysis (%)</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={roiData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Legend />
                                <Bar dataKey="roi" fill="#3b82f6" name="ROI Score" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card chart-container">
                    <h3>Fuel Efficiency (km/L)</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={fuelData}>
                                <defs>
                                    <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                                />
                                <Area type="monotone" dataKey="fuelEfficiency" stroke="#10b981" fillOpacity={1} fill="url(#colorEff)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card chart-container">
                    <h3>Vehicle Status Distribution</h3>
                    <div className="empty-chart-msg">
                        <p className="text-muted">Fleet health overview visualization coming soon...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
