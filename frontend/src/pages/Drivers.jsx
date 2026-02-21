import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Phone, Mail, Award, Truck, X } from 'lucide-react';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import './Vehicles.css';

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

    const [showModal, setShowModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [formData, setFormData] = useState(initialFormState);

    const fetchDrivers = async () => {
        try {
            setLoading(true);
            const query = statusFilter ? `?status=${statusFilter}` : '';
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
    }, [statusFilter]);

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

    return (
        <div className="vehicles-page animate-fade-in">
            <div className="page-header">
                <div className="header-search">
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

                        <input
                            placeholder="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />

                        <input
                            placeholder="Email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />

                        <input
                            placeholder="Phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />

                        <input
                            placeholder="License Number"
                            value={formData.licenseNumber}
                            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                        />

                        <input
                            type="date"
                            value={formData.licenseExpiry}
                            onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                        />

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