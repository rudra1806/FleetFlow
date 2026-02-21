import { useState, useEffect, useMemo, useRef } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Calendar, Filter, Download, ChevronDown, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import api from '../services/api';
import './Analytics.css';
import Button from '../components/common/Button';

const TIME_OPTIONS = [
    { label: 'Last 7 Days', value: '7' },
    { label: 'Last 30 Days', value: '30' },
    { label: 'Last 90 Days', value: '90' },
    { label: 'All Time', value: 'all' },
    { label: 'Custom Range', value: 'custom' },
];

const VEHICLE_TYPES = ['all', 'truck', 'van', 'car', 'bus'];
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Analytics = () => {
    const [fuelData, setFuelData] = useState([]);
    const [roiData, setRoiData] = useState([]);
    const [costData, setCostData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [timePeriod, setTimePeriod] = useState('30');
    const [showTimeDropdown, setShowTimeDropdown] = useState(false);
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [exporting, setExporting] = useState(false);

    const roiChartRef = useRef(null);
    const fuelChartRef = useRef(null);

    const getDateRange = () => {
        if (timePeriod === 'all') return {};
        if (timePeriod === 'custom') {
            const params = {};
            if (customFrom) params.from = customFrom;
            if (customTo) params.to = customTo;
            return params;
        }
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - parseInt(timePeriod));
        return {
            from: from.toISOString().split('T')[0],
            to: to.toISOString().split('T')[0],
        };
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const dateParams = getDateRange();
            const [fuelRes, roiRes, costRes, vehicleRes] = await Promise.all([
                api.get('/analytics/fuel-efficiency', { params: dateParams }),
                api.get('/analytics/vehicle-roi', { params: dateParams }),
                api.get('/analytics/cost-per-km', { params: dateParams }),
                api.get('/vehicles'),
            ]);
            setFuelData(fuelRes.data.data || []);
            setRoiData(roiRes.data.data || []);
            setCostData(costRes.data.data || []);

            // Build status distribution from vehicles
            const vehicles = vehicleRes.data.data || vehicleRes.data.vehicles || [];
            const statusCounts = {};
            vehicles.forEach((v) => {
                const s = v.status || 'unknown';
                statusCounts[s] = (statusCounts[s] || 0) + 1;
            });
            const statusArr = Object.entries(statusCounts)
                .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
                .filter((d) => d.value > 0);
            setStatusData(statusArr);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [timePeriod, customFrom, customTo]);

    const filteredFuelData = useMemo(() => {
        if (vehicleTypeFilter === 'all') return fuelData;
        return fuelData.filter((d) => d.type === vehicleTypeFilter);
    }, [fuelData, vehicleTypeFilter]);

    const filteredRoiData = useMemo(() => {
        if (vehicleTypeFilter === 'all') return roiData;
        return roiData.filter((d) => d.type === vehicleTypeFilter);
    }, [roiData, vehicleTypeFilter]);

    const filteredCostData = useMemo(() => {
        if (vehicleTypeFilter === 'all') return costData;
        return costData.filter((d) => d.type === vehicleTypeFilter);
    }, [costData, vehicleTypeFilter]);

    // Aggregate cost by vehicle type for the type breakdown radar
    const typeCostSummary = useMemo(() => {
        const map = {};
        costData.forEach((d) => {
            const t = d.type || 'other';
            if (!map[t]) map[t] = { type: t, maintenance: 0, fuel: 0, totalKm: 0, count: 0 };
            map[t].maintenance += d.maintenanceCost || 0;
            map[t].fuel += d.fuelCost || 0;
            map[t].totalKm += d.totalKm || 0;
            map[t].count += 1;
        });
        return Object.values(map).map((v) => ({
            type: v.type.charAt(0).toUpperCase() + v.type.slice(1),
            avgCostPerKm: v.totalKm > 0 ? parseFloat(((v.maintenance + v.fuel) / v.totalKm).toFixed(2)) : 0,
            avgMaintenance: v.count > 0 ? Math.round(v.maintenance / v.count) : 0,
            avgFuel: v.count > 0 ? Math.round(v.fuel / v.count) : 0,
        }));
    }, [costData]);

    const selectedTimeLabel = TIME_OPTIONS.find((o) => o.value === timePeriod)?.label || 'Select';

    const tooltipStyle = {
        contentStyle: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' },
        itemStyle: { color: '#f8fafc' },
    };

    const handleExportPDF = async () => {
        setExporting(true);
        try {
            const doc = new jsPDF();
            const dateRange = getDateRange();
            const rangeText = dateRange.from
                ? `${dateRange.from} to ${dateRange.to}`
                : 'All Time';
            const pageWidth = doc.internal.pageSize.getWidth();

            doc.setFontSize(20);
            doc.setTextColor(30, 41, 59);
            doc.text('FleetFlow Analytics Report', 14, 20);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Period: ${rangeText}`, 14, 28);
            doc.text(`Vehicle Type: ${vehicleTypeFilter === 'all' ? 'All' : vehicleTypeFilter}`, 14, 34);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 40);

            let currentY = 48;

            if (roiChartRef.current) {
                try {
                    const roiCanvas = await html2canvas(roiChartRef.current, { backgroundColor: '#1e293b', scale: 2 });
                    const roiImg = roiCanvas.toDataURL('image/png');
                    const imgWidth = pageWidth - 28;
                    const imgHeight = (roiCanvas.height * imgWidth) / roiCanvas.width;
                    doc.setFontSize(13);
                    doc.setTextColor(30, 41, 59);
                    doc.text('Vehicle ROI Analysis', 14, currentY);
                    currentY += 4;
                    doc.addImage(roiImg, 'PNG', 14, currentY, imgWidth, imgHeight);
                    currentY += imgHeight + 6;
                } catch (e) {
                    console.error('Error capturing ROI chart:', e);
                }
            }

            autoTable(doc, {
                startY: currentY,
                head: [['Vehicle', 'License Plate', 'Acquisition Cost', 'Maintenance', 'Fuel Cost', 'ROI (%)']],
                body: filteredRoiData.map((d) => [
                    d.name, d.licensePlate, d.acquisitionCost, d.maintenanceCost, d.fuelCost, d.roi,
                ]),
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] },
                styles: { fontSize: 8 },
            });

            doc.addPage();
            currentY = 16;

            if (fuelChartRef.current) {
                try {
                    const fuelCanvas = await html2canvas(fuelChartRef.current, { backgroundColor: '#1e293b', scale: 2 });
                    const fuelImg = fuelCanvas.toDataURL('image/png');
                    const imgWidth = pageWidth - 28;
                    const imgHeight = (fuelCanvas.height * imgWidth) / fuelCanvas.width;
                    doc.setFontSize(13);
                    doc.setTextColor(30, 41, 59);
                    doc.text('Fuel Efficiency (km/L)', 14, currentY);
                    currentY += 4;
                    doc.addImage(fuelImg, 'PNG', 14, currentY, imgWidth, imgHeight);
                    currentY += imgHeight + 6;
                } catch (e) {
                    console.error('Error capturing Fuel chart:', e);
                }
            }

            autoTable(doc, {
                startY: currentY,
                head: [['Vehicle', 'License Plate', 'Type', 'Total Km', 'Total Liters', 'Efficiency (km/L)']],
                body: filteredFuelData.map((d) => [
                    d.name, d.licensePlate, d.type, d.totalKm, d.totalLiters, d.fuelEfficiency,
                ]),
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129] },
                styles: { fontSize: 8 },
            });

            // Cost per KM table
            doc.addPage();
            autoTable(doc, {
                startY: 16,
                head: [['Vehicle', 'License Plate', 'Total Km', 'Maintenance ₹', 'Fuel ₹', 'Total ₹', '₹/km']],
                body: filteredCostData.map((d) => [
                    d.name, d.licensePlate, d.totalKm, d.maintenanceCost, d.fuelCost, d.totalCost, d.costPerKm,
                ]),
                theme: 'grid',
                headStyles: { fillColor: [139, 92, 246] },
                styles: { fontSize: 8 },
            });

            doc.save(`FleetFlow_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF export error:', error);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="analytics-page animate-fade-in">
            <div className="analytics-header">
                {/* Time Period Selector */}
                <div className="dropdown-wrapper">
                    <div
                        className="date-filter glass-effect"
                        onClick={() => {
                            setShowTimeDropdown(!showTimeDropdown);
                            setShowFilterDropdown(false);
                        }}
                    >
                        <Calendar size={18} />
                        <span>{selectedTimeLabel}</span>
                        <ChevronDown size={14} />
                    </div>
                    {showTimeDropdown && (
                        <div className="dropdown-menu glass-effect">
                            {TIME_OPTIONS.map((opt) => (
                                <div
                                    key={opt.value}
                                    className={`dropdown-item ${timePeriod === opt.value ? 'active' : ''}`}
                                    onClick={() => {
                                        setTimePeriod(opt.value);
                                        if (opt.value !== 'custom') setShowTimeDropdown(false);
                                    }}
                                >
                                    {opt.label}
                                </div>
                            ))}
                            {timePeriod === 'custom' && (
                                <div className="custom-range-inputs">
                                    <input
                                        type="date"
                                        value={customFrom}
                                        onChange={(e) => setCustomFrom(e.target.value)}
                                        placeholder="From"
                                    />
                                    <input
                                        type="date"
                                        value={customTo}
                                        onChange={(e) => setCustomTo(e.target.value)}
                                        placeholder="To"
                                    />
                                    <button
                                        className="apply-btn"
                                        onClick={() => setShowTimeDropdown(false)}
                                    >
                                        Apply
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="analytics-actions">
                    {/* Vehicle Type Filter */}
                    <div className="dropdown-wrapper">
                        <Button
                            variant="secondary"
                            icon={Filter}
                            onClick={() => {
                                setShowFilterDropdown(!showFilterDropdown);
                                setShowTimeDropdown(false);
                            }}
                        >
                            {vehicleTypeFilter === 'all' ? 'Filters' : vehicleTypeFilter}
                        </Button>
                        {showFilterDropdown && (
                            <div className="dropdown-menu glass-effect">
                                {VEHICLE_TYPES.map((t) => (
                                    <div
                                        key={t}
                                        className={`dropdown-item ${vehicleTypeFilter === t ? 'active' : ''}`}
                                        onClick={() => {
                                            setVehicleTypeFilter(t);
                                            setShowFilterDropdown(false);
                                        }}
                                    >
                                        {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button variant="outline" icon={Download} onClick={handleExportPDF} isLoading={exporting}>
                        Export PDF
                    </Button>
                </div>
            </div>

            {vehicleTypeFilter !== 'all' && (
                <div className="active-filter-chip glass-effect" onClick={() => setVehicleTypeFilter('all')}>
                    <span>Type: {vehicleTypeFilter}</span>
                    <X size={14} />
                </div>
            )}

            <div className="analytics-grid">
                {/* 1 — Vehicle ROI (full width) */}
                <div className="glass-card chart-container full-width" ref={roiChartRef}>
                    <h3>Vehicle ROI Analysis (%)</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={filteredRoiData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip {...tooltipStyle} />
                                <Legend />
                                <Bar dataKey="roi" fill="#3b82f6" name="ROI Score" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2 — Fuel Efficiency (half) */}
                <div className="glass-card chart-container" ref={fuelChartRef}>
                    <h3>Fuel Efficiency (km/L)</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={filteredFuelData}>
                                <defs>
                                    <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip {...tooltipStyle} />
                                <Area type="monotone" dataKey="fuelEfficiency" stroke="#10b981" fillOpacity={1} fill="url(#colorEff)" name="km/L" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3 — Vehicle Status Distribution (pie — half) */}
                <div className="glass-card chart-container">
                    <h3>Vehicle Status Distribution</h3>
                    <div className="chart-wrapper">
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        innerRadius={65}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {statusData.map((_, i) => (
                                            <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip {...tooltipStyle} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-chart-msg">
                                <p className="text-muted">No vehicle data available</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4 — Cost per KM (full width) */}
                <div className="glass-card chart-container full-width">
                    <h3>Operational Cost per Kilometer (₹/km)</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={filteredCostData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip {...tooltipStyle} />
                                <Legend />
                                <Bar dataKey="costPerKm" fill="#8b5cf6" name="₹/km" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5 — Cost Breakdown: Maintenance vs Fuel (stacked bar — half) */}
                <div className="glass-card chart-container">
                    <h3>Cost Breakdown: Maintenance vs Fuel</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={filteredCostData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip {...tooltipStyle} />
                                <Legend />
                                <Bar dataKey="maintenanceCost" stackId="cost" fill="#f59e0b" name="Maintenance ₹" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="fuelCost" stackId="cost" fill="#ef4444" name="Fuel ₹" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 6 — Distance Traveled per Vehicle (line — half) */}
                <div className="glass-card chart-container">
                    <h3>Distance Traveled (km)</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={filteredCostData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip {...tooltipStyle} />
                                <Legend />
                                <Line type="monotone" dataKey="totalKm" stroke="#ec4899" strokeWidth={2} dot={{ r: 4, fill: '#ec4899' }} name="Total km" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 7 — Avg Cost by Vehicle Type (radar — full width) */}
                {typeCostSummary.length > 0 && (
                    <div className="glass-card chart-container full-width">
                        <h3>Average Cost by Vehicle Type</h3>
                        <div className="chart-wrapper">
                            <ResponsiveContainer width="100%" height={320}>
                                <RadarChart data={typeCostSummary} cx="50%" cy="50%" outerRadius="70%">
                                    <PolarGrid stroke="#334155" />
                                    <PolarAngleAxis dataKey="type" stroke="#94a3b8" fontSize={12} />
                                    <PolarRadiusAxis stroke="#64748b" fontSize={10} />
                                    <Tooltip {...tooltipStyle} />
                                    <Legend />
                                    <Radar name="Avg Maintenance ₹" dataKey="avgMaintenance" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                                    <Radar name="Avg Fuel ₹" dataKey="avgFuel" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;
