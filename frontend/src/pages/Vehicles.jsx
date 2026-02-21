import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, Search, Filter, X, ChevronLeft, ChevronRight, Truck, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import './Vehicles.css';

// ── Constants ──
const VEHICLE_TYPES = ['truck', 'van', 'bike'];
const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid', 'cng'];
const VEHICLE_STATUSES = ['available', 'on_trip', 'in_shop', 'retired'];

const EMPTY_FORM = {
    name: '', model: '', licensePlate: '', type: '', maxCapacity: '',
    currentOdometer: '', fuelType: '', acquisitionCost: '', acquisitionDate: '',
    year: '', color: '', region: '', notes: '',
};

// ── Toast Component ──
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3500);
        return () => clearTimeout(timer);
    }, [onClose]);

    return createPortal(
        <div className={`toast toast-${type}`}>
            {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{message}</span>
            <button className="toast-close" onClick={onClose}><X size={14} /></button>
        </div>,
        document.body
    );
};

// ── Modal Component (rendered via portal to escape stacking context) ──
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass-effect" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>,
        document.body
    );
};

// ── Stat Card ──
const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="glass-card stat-card-v">
        <div className="stat-content-v">
            <p className="stat-title-v">{title}</p>
            <h3 className="stat-value-v">{value}</h3>
        </div>
        <div className="stat-icon-v" style={{ backgroundColor: `${color}20`, color }}>
            <Icon size={22} />
        </div>
    </div>
);

// ── Main Component ──
const Vehicles = () => {
    const { user } = useAuth();
    const isManager = user?.role === 'manager';

    // Data state
    const [vehicles, setVehicles] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Search, filter, pagination
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ type: '', status: '', fuelType: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Delete dialog
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Toast
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type });

    // ── Fetch vehicles (with search, filters, pagination) ──
    const fetchVehicles = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', page);
            params.set('limit', 10);
            if (search) params.set('search', search);
            if (filters.type) params.set('type', filters.type);
            if (filters.status) params.set('status', filters.status);
            if (filters.fuelType) params.set('fuelType', filters.fuelType);

            const response = await api.get(`/vehicles?${params.toString()}`);
            setVehicles(response.data.vehicles || []);
            setTotalPages(response.data.totalPages || 1);
            setTotal(response.data.total || 0);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            showToast('Failed to load vehicles', 'error');
        } finally {
            setLoading(false);
        }
    }, [search, filters, page]);

    // ── Fetch stats ──
    const fetchStats = async () => {
        try {
            const response = await api.get('/vehicles/stats');
            setStats(response.data.stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(fetchVehicles, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchVehicles]);

    // Reset to page 1 when search/filters change
    useEffect(() => {
        setPage(1);
    }, [search, filters]);

    // ── Form Handlers ──
    const openAddModal = () => {
        setModalMode('add');
        setFormData(EMPTY_FORM);
        setFormErrors({});
        setEditingId(null);
        setShowModal(true);
    };

    const openEditModal = (vehicle) => {
        setModalMode('edit');
        setFormData({
            name: vehicle.name || '',
            model: vehicle.model || '',
            licensePlate: vehicle.licensePlate || '',
            type: vehicle.type || '',
            maxCapacity: vehicle.maxCapacity || '',
            currentOdometer: vehicle.currentOdometer || '',
            fuelType: vehicle.fuelType || '',
            acquisitionCost: vehicle.acquisitionCost || '',
            acquisitionDate: vehicle.acquisitionDate ? vehicle.acquisitionDate.split('T')[0] : '',
            year: vehicle.year || '',
            color: vehicle.color || '',
            region: vehicle.region || '',
            notes: vehicle.notes || '',
        });
        setFormErrors({});
        setEditingId(vehicle._id);
        setShowModal(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.model.trim()) errors.model = 'Model is required';
        if (!formData.licensePlate.trim()) errors.licensePlate = 'License plate is required';
        if (!formData.type) errors.type = 'Type is required';
        if (!formData.maxCapacity || Number(formData.maxCapacity) < 1) errors.maxCapacity = 'Capacity must be at least 1';
        if (!formData.fuelType) errors.fuelType = 'Fuel type is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSaving(true);
        try {
            const payload = { ...formData };
            // Convert numeric fields
            if (payload.maxCapacity) payload.maxCapacity = Number(payload.maxCapacity);
            if (payload.currentOdometer) payload.currentOdometer = Number(payload.currentOdometer);
            if (payload.acquisitionCost) payload.acquisitionCost = Number(payload.acquisitionCost);
            if (payload.year) payload.year = Number(payload.year);
            // Remove empty optional fields
            Object.keys(payload).forEach((key) => {
                if (payload[key] === '' || payload[key] === undefined) delete payload[key];
            });

            if (modalMode === 'add') {
                await api.post('/vehicles', payload);
                showToast('Vehicle created successfully');
            } else {
                await api.put(`/vehicles/${editingId}`, payload);
                showToast('Vehicle updated successfully');
            }

            setShowModal(false);
            fetchVehicles();
            fetchStats();
        } catch (error) {
            const msg = error.response?.data?.message || 'Something went wrong';
            showToast(msg, 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ──
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/vehicles/${deleteTarget._id}`);
            showToast('Vehicle deleted successfully');
            setDeleteTarget(null);
            fetchVehicles();
            fetchStats();
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to delete vehicle';
            showToast(msg, 'error');
        } finally {
            setDeleting(false);
        }
    };

    // ── Clear filters ──
    const clearFilters = () => {
        setFilters({ type: '', status: '', fuelType: '' });
        setShowFilters(false);
    };

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    // ── Table ──
    const headers = ['Vehicle', 'License Plate', 'Type', 'Fuel', 'Status', 'Odometer', 'Capacity', ...(isManager ? ['Actions'] : [])];

    const renderRow = (vehicle) => (
        <tr key={vehicle._id}>
            <td>
                <div className="vehicle-info">
                    <p className="vehicle-name">{vehicle.name}</p>
                    <p className="vehicle-model">{vehicle.model}</p>
                </div>
            </td>
            <td><code className="license-plate">{vehicle.licensePlate}</code></td>
            <td><span className="type-tag">{vehicle.type}</span></td>
            <td><span className="fuel-tag">{vehicle.fuelType}</span></td>
            <td>
                <span className={`badge ${vehicle.status}`}>
                    {vehicle.status.replace('_', ' ')}
                </span>
            </td>
            <td>{(vehicle.currentOdometer || 0).toLocaleString()} km</td>
            <td>{vehicle.maxCapacity} kg</td>
            {isManager && (
                <td>
                    <div className="table-actions">
                        <button className="icon-btn edit" title="Edit" onClick={() => openEditModal(vehicle)}>
                            <Edit2 size={16} />
                        </button>
                        <button className="icon-btn delete" title="Delete" onClick={() => setDeleteTarget(vehicle)}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                </td>
            )}
        </tr>
    );

    return (
        <div className="vehicles-page animate-fade-in">
            {/* Stats Row */}
            {stats && (
                <div className="vehicle-stats-grid">
                    <StatCard title="Total" value={stats.total} icon={Truck} color="#3b82f6" />
                    <StatCard title="Available" value={stats.available} icon={CheckCircle} color="#10b981" />
                    <StatCard title="On Trip" value={stats.on_trip} icon={Truck} color="#f59e0b" />
                    <StatCard title="In Shop" value={stats.in_shop} icon={AlertTriangle} color="#ef4444" />
                    <StatCard title="Retired" value={stats.retired} icon={XCircle} color="#64748b" />
                </div>
            )}

            {/* Header */}
            <div className="page-header">
                <div className="header-search">
                    <div className="search-input-wrapper">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search vehicles..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button className="search-clear" onClick={() => setSearch('')}>
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <Button variant="secondary" icon={Filter} onClick={() => setShowFilters(!showFilters)}>
                        Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </Button>
                </div>
                {isManager && <Button icon={Plus} onClick={openAddModal}>Add Vehicle</Button>}
            </div>

            {/* Filter Bar */}
            {showFilters && (
                <div className="filter-bar glass-effect">
                    <div className="filter-group">
                        <label>Type</label>
                        <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
                            <option value="">All Types</option>
                            {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Status</label>
                        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                            <option value="">All Statuses</option>
                            {VEHICLE_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Fuel Type</label>
                        <select value={filters.fuelType} onChange={(e) => setFilters((f) => ({ ...f, fuelType: e.target.value }))}>
                            <option value="">All Fuels</option>
                            {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
                </div>
            )}

            {/* Results count */}
            <p className="results-count">{total} vehicle{total !== 1 ? 's' : ''} found</p>

            {/* Table */}
            <Table
                headers={headers}
                data={vehicles}
                renderRow={renderRow}
                loading={loading}
                emptyMessage="No vehicles found."
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} icon={ChevronLeft}>
                        Prev
                    </Button>
                    <span className="page-info">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} icon={ChevronRight}>
                        Next
                    </Button>
                </div>
            )}

            {/* ── Add / Edit Modal ── */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={modalMode === 'add' ? 'Add New Vehicle' : 'Edit Vehicle'}>
                <form onSubmit={handleSubmit} className="vehicle-form">
                    <div className="form-grid">
                        {/* Name */}
                        <div className="form-field">
                            <label>Name <span className="req">*</span></label>
                            <input name="name" value={formData.name} onChange={handleFormChange} placeholder="e.g. Fleet Truck 01" />
                            {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                        </div>
                        {/* Model */}
                        <div className="form-field">
                            <label>Model <span className="req">*</span></label>
                            <input name="model" value={formData.model} onChange={handleFormChange} placeholder="e.g. Tata Ace" />
                            {formErrors.model && <span className="field-error">{formErrors.model}</span>}
                        </div>
                        {/* License Plate */}
                        <div className="form-field">
                            <label>License Plate <span className="req">*</span></label>
                            <input name="licensePlate" value={formData.licensePlate} onChange={handleFormChange} placeholder="e.g. GJ01AB1234" />
                            {formErrors.licensePlate && <span className="field-error">{formErrors.licensePlate}</span>}
                        </div>
                        {/* Type */}
                        <div className="form-field">
                            <label>Type <span className="req">*</span></label>
                            <select name="type" value={formData.type} onChange={handleFormChange}>
                                <option value="">Select type</option>
                                {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            {formErrors.type && <span className="field-error">{formErrors.type}</span>}
                        </div>
                        {/* Max Capacity */}
                        <div className="form-field">
                            <label>Max Capacity (kg) <span className="req">*</span></label>
                            <input type="number" name="maxCapacity" value={formData.maxCapacity} onChange={handleFormChange} placeholder="e.g. 1000" min="1" />
                            {formErrors.maxCapacity && <span className="field-error">{formErrors.maxCapacity}</span>}
                        </div>
                        {/* Fuel Type */}
                        <div className="form-field">
                            <label>Fuel Type <span className="req">*</span></label>
                            <select name="fuelType" value={formData.fuelType} onChange={handleFormChange}>
                                <option value="">Select fuel type</option>
                                {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                            {formErrors.fuelType && <span className="field-error">{formErrors.fuelType}</span>}
                        </div>
                        {/* Odometer */}
                        <div className="form-field">
                            <label>Odometer (km)</label>
                            <input type="number" name="currentOdometer" value={formData.currentOdometer} onChange={handleFormChange} placeholder="0" min="0" />
                        </div>
                        {/* Acquisition Cost */}
                        <div className="form-field">
                            <label>Acquisition Cost (₹)</label>
                            <input type="number" name="acquisitionCost" value={formData.acquisitionCost} onChange={handleFormChange} placeholder="0" min="0" />
                        </div>
                        {/* Acquisition Date */}
                        <div className="form-field">
                            <label>Acquisition Date</label>
                            <input type="date" name="acquisitionDate" value={formData.acquisitionDate} onChange={handleFormChange} />
                        </div>
                        {/* Year */}
                        <div className="form-field">
                            <label>Year</label>
                            <input type="number" name="year" value={formData.year} onChange={handleFormChange} placeholder="e.g. 2024" min="1900" max={new Date().getFullYear() + 1} />
                        </div>
                        {/* Color */}
                        <div className="form-field">
                            <label>Color</label>
                            <input name="color" value={formData.color} onChange={handleFormChange} placeholder="e.g. White" />
                        </div>
                        {/* Region */}
                        <div className="form-field">
                            <label>Region</label>
                            <input name="region" value={formData.region} onChange={handleFormChange} placeholder="e.g. West Gujarat" />
                        </div>
                    </div>
                    {/* Notes (full width) */}
                    <div className="form-field full-width">
                        <label>Notes</label>
                        <textarea name="notes" value={formData.notes} onChange={handleFormChange} rows={3} placeholder="Optional notes..." />
                    </div>
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" isLoading={saving}>
                            {modalMode === 'add' ? 'Create Vehicle' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── Delete Confirmation Modal ── */}
            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Vehicle">
                <div className="delete-confirm">
                    <p>Are you sure you want to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.licensePlate})?</p>
                    <p className="delete-warning">This action cannot be undone.</p>
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="danger" onClick={handleDelete} isLoading={deleting}>Delete</Button>
                    </div>
                </div>
            </Modal>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default Vehicles;
