import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Phone, Mail, Award, Truck, X, Star } from 'lucide-react';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import './Drivers.css';

const DRIVER_STATUSES = [
    "on_duty",
    "on_trip",
    "off_duty",
    "suspended"
];

const initialFormState = {
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    status: 'on_duty'
};

const Drivers = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState(search);

    const [showModal, setShowModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [formData, setFormData] = useState(initialFormState);

    const fetchDrivers = async () => {
        try {
            setLoading(true);
            let query = '?';

            if (statusFilter) query += `status=${statusFilter}&`;
            if (debouncedSearch) query += `search=${debouncedSearch}&`;

            query += `page=1&limit=10`;
            const response = await api.get(`/drivers${query}`);

            if (response.data.status) {
                setDrivers(response.data.drivers);
            }
        } catch (error) {
            console.error('Error fetching drivers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrivers();
    }, [statusFilter, debouncedSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    const openAddModal = () => {
        setEditingDriver(null);
        setFormData(initialFormState);
        setShowModal(true);
    };

    const openEditModal = (driver) => {
        setEditingDriver(driver);
        setFormData({
            name: driver.name,
            email: driver.email,
            phone: driver.phone,
            licenseNumber: driver.licenseNumber,
            licenseExpiry: driver.licenseExpiry?.split('T')[0],
            status: driver.status
        });
        setShowModal(true);
    };

    const handleSubmit = async () => {
        try {
            if (!formData.name || !formData.licenseNumber || !formData.licenseExpiry) {
                alert("Name, License Number and Expiry are required");
                return;
            }

            if (editingDriver) {
                await api.put(`/drivers/${editingDriver._id}`, formData);
            } else {
                await api.post('/drivers', formData);
            }

            setShowModal(false);
            fetchDrivers();
        } catch (err) {
            alert(err.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this driver?")) return;

        try {
            await api.delete(`/drivers/${id}`);
            fetchDrivers();
        } catch (err) {
            alert(err.response?.data?.message || "Delete failed");
        }
    };

    const headers = [
        'Driver',
        'Contact',
        'License',
        'Status',
        'Vehicle',
        'Performance',
        'Actions'
    ];

    const renderRow = (driver) => (
        <tr key={driver._id}>
            <td>
                <div className="vehicle-info">
                    <p className="vehicle-name">{driver.name}</p>
                    <p className="vehicle-model">
                        Trips: {driver.completedTrips}/{driver.totalTrips}
                    </p>
                </div>
            </td>

            <td>
                <div className="contact-info">
                    <p><Phone size={12} /> {driver.phone}</p>
                    <p><Mail size={12} /> {driver.email}</p>
                </div>
            </td>

            <td>
                <code className="license-plate">{driver.licenseNumber}</code>
                <br />
                <small style={{ color: driver.isLicenseValid ? 'green' : 'red' }}>
                    {driver.isLicenseValid ? "Valid" : "Expired"}
                </small>
            </td>

            <td>
                <span className={`badge ${driver.status}`}>
                    {driver.status.replace('_', ' ')}
                </span>
            </td>

            <td>
                {driver.assignedVehicle ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Truck size={14} />
                        {driver.assignedVehicle.name}
                    </div>
                ) : (
                    <span style={{ color: "#888" }}>—</span>
                )}
            </td>

            <td>
                <div className="performance-score">
                    <Award size={16} color="#f59e0b" />
                    <span>{driver.safetyScore}</span>
                    <br />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <Star size={14} fill="#fbbf24" color="#fbbf24" />
                        <span>{driver.rating ? driver.rating.toFixed(1) : '0.0'}</span>
                        <small style={{ color: '#888' }}>({driver.ratingCount || 0})</small>
                    </div>
                    <small>{driver.completionRate}% completion</small>
                </div>
            </td>

            <td>
                <div className="table-actions">
                    <button className="icon-btn edit" onClick={() => openEditModal(driver)}>
                        <Edit2 size={16} />
                    </button>
                    <button
                        className="icon-btn delete"
                        onClick={() => handleDelete(driver._id)}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );

    const avgRating = useMemo(() => {
        const ratedDrivers = drivers.filter(d => d.ratingCount > 0);
        if (ratedDrivers.length === 0) return 0;
        const total = ratedDrivers.reduce((acc, d) => acc + (d.rating || 0), 0);
        return (total / ratedDrivers.length).toFixed(1);
    }, [drivers]);

    const onTripCount = drivers.filter(d => d.status === 'on_trip').length;

    return (
        <div className="vehicles-page animate-fade-in">
            <div className="vehicle-stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="glass-card stat-card-v">
                    <div className="stat-content-v">
                        <p className="stat-title-v">Total Drivers</p>
                        <h3 className="stat-value-v">{drivers.length}</h3>
                    </div>
                </div>
                <div className="glass-card stat-card-v">
                    <div className="stat-content-v">
                        <p className="stat-title-v">On Trip</p>
                        <h3 className="stat-value-v">{onTripCount}</h3>
                    </div>
                </div>
                <div className="glass-card stat-card-v">
                    <div className="stat-content-v">
                        <p className="stat-title-v">Avg Rating</p>
                        <h3 className="stat-value-v">
                            <Star size={18} fill="#fbbf24" color="#fbbf24" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                            {avgRating}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="page-header">
                <div className="header-search">
                    <input
                        type="text"
                        placeholder="Search drivers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field"
                    />

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="input-field"
                    >
                        <option value="">All Status</option>
                        {DRIVER_STATUSES.map(status => (
                            <option key={status} value={status}>
                                {status.replace('_', ' ')}
                            </option>
                        ))}
                    </select>
                </div>

                <Button icon={Plus} onClick={openAddModal}>
                    Add Driver
                </Button>
            </div>

            <Table
                headers={headers}
                data={drivers}
                renderRow={renderRow}
                loading={loading}
                emptyMessage="No drivers found."
            />

            {/* 🔥 Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h3>{editingDriver ? "Edit Driver" : "Add Driver"}</h3>
                            <X size={18} onClick={() => setShowModal(false)} style={{ cursor: "pointer" }} />
                        </div>

                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>License Number</label>
                            <input
                                type="text"
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>License Expiry</label>
                            <input
                                type="date"
                                value={formData.licenseExpiry}
                                onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                {DRIVER_STATUSES.map(status => (
                                    <option key={status} value={status}>
                                        {status.replace('_', ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button onClick={handleSubmit}>
                                {editingDriver ? "Update" : "Create"}
                            </button>
                            <button onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Drivers;