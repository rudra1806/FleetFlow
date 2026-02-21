import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Play, CheckCircle2, XCircle, Search, Filter, X, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, MapPin, Truck, Users, Star } from 'lucide-react';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import './Vehicles.css';
import './Trips.css';

// ── Constants ──
const TRIP_STATUSES = ['draft', 'dispatched', 'completed', 'cancelled'];

const EMPTY_FORM = {
    vehicle: '', driver: '', cargoWeight: '', origin: '', destination: '', distance: '', notes: '',
};

// ── Toast ──
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

// ── Modal ──
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
const Trips = () => {
    const { user } = useAuth();
    const canWrite = user?.role === 'manager' || user?.role === 'dispatcher';

    // Data
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);

    // Search, filter, pagination
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Stats
    const [stats, setStats] = useState({ draft: 0, dispatched: 0, completed: 0, cancelled: 0, total: 0 });

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Complete modal (needs endOdometer)
    const [completeTarget, setCompleteTarget] = useState(null);
    const [endOdometer, setEndOdometer] = useState('');
    const [completing, setCompleting] = useState(false);

    // Cancel dialog
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [rating, setRating] = useState(0);

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => setToast({ message, type });

    // ── Fetch trips ──
    const fetchTrips = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', page);
            params.set('limit', 10);
            if (statusFilter) params.set('status', statusFilter);

            const response = await api.get(`/trips?${params.toString()}`);
            let tripsData = response.data.trips || [];

            // Client-side search (backend doesn't support trip search query)
            if (search) {
                const q = search.toLowerCase();
                tripsData = tripsData.filter(t =>
                    t.origin?.toLowerCase().includes(q) ||
                    t.destination?.toLowerCase().includes(q) ||
                    t.vehicle?.name?.toLowerCase().includes(q) ||
                    t.vehicle?.licensePlate?.toLowerCase().includes(q) ||
                    t.driver?.name?.toLowerCase().includes(q)
                );
            }

            setTrips(tripsData);
            setTotalPages(response.data.totalPages || 1);
            setTotal(response.data.total || 0);
        } catch (error) {
            console.error('Error fetching trips:', error);
            showToast('Failed to load trips', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, search]);

    // ── Fetch available vehicles & drivers for form dropdowns ──
    const fetchDropdownData = async () => {
        try {
            const [vRes, dRes] = await Promise.all([
                api.get('/vehicles?status=available&limit=100'),
                api.get('/drivers?status=on_duty&limit=100'),
            ]);
            setVehicles(vRes.data.vehicles || []);
            setDrivers(dRes.data.drivers || []);
        } catch (error) {
            console.error('Error fetching dropdown data:', error);
        }
    };

    // ── Compute stats from all trips ──
    const fetchStats = useCallback(async () => {
        try {
            const counts = { draft: 0, dispatched: 0, completed: 0, cancelled: 0, total: 0 };
            for (const s of TRIP_STATUSES) {
                const res = await api.get(`/trips?status=${s}&limit=1`);
                counts[s] = res.data.total || 0;
            }
            counts.total = counts.draft + counts.dispatched + counts.completed + counts.cancelled;
            setStats(counts);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    useEffect(() => {
        const timeoutId = setTimeout(fetchTrips, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchTrips]);

    useEffect(() => { setPage(1); }, [search, statusFilter]);

    // ── Form Handlers ──
    const openAddModal = () => {
        setModalMode('add');
        setFormData(EMPTY_FORM);
        setFormErrors({});
        setEditingId(null);
        fetchDropdownData();
        setShowModal(true);
    };

    const openEditModal = (trip) => {
        setModalMode('edit');
        setFormData({
            vehicle: trip.vehicle?._id || '',
            driver: trip.driver?._id || '',
            cargoWeight: trip.cargoWeight || '',
            origin: trip.origin || '',
            destination: trip.destination || '',
            distance: trip.distance || '',
            notes: trip.notes || '',
        });
        setFormErrors({});
        setEditingId(trip._id);
        fetchDropdownData();
        setShowModal(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.vehicle) errors.vehicle = 'Vehicle is required';
        if (!formData.driver) errors.driver = 'Driver is required';
        if (!formData.cargoWeight || Number(formData.cargoWeight) <= 0) errors.cargoWeight = 'Cargo weight must be positive';
        if (!formData.origin.trim()) errors.origin = 'Origin is required';
        if (!formData.destination.trim()) errors.destination = 'Destination is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSaving(true);
        try {
            const payload = { ...formData };
            if (payload.cargoWeight) payload.cargoWeight = Number(payload.cargoWeight);
            if (payload.distance) payload.distance = Number(payload.distance);
            Object.keys(payload).forEach(k => { if (payload[k] === '' || payload[k] === undefined) delete payload[k]; });

            if (modalMode === 'add') {
                await api.post('/trips', payload);
                showToast('Trip created as draft');
            } else {
                await api.put(`/trips/${editingId}`, payload);
                showToast('Trip updated successfully');
            }

            setShowModal(false);
            fetchTrips();
            fetchStats();
        } catch (error) {
            showToast(error.response?.data?.message || 'Something went wrong', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Status Actions ──
    const handleDispatch = async (trip) => {
        try {
            await api.patch(`/trips/${trip._id}/status`, { status: 'dispatched' });
            showToast('Trip dispatched successfully');
            fetchTrips();
            fetchStats();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to dispatch trip', 'error');
        }
    };

    const handleComplete = async () => {
        if (!completeTarget) return;
        if (!endOdometer || Number(endOdometer) <= 0) {
            showToast('Please enter a valid end odometer reading', 'error');
            return;
        }
        setCompleting(true);
        try {
            await api.patch(`/trips/${completeTarget._id}/status`, {
                status: 'completed',
                endOdometer: Number(endOdometer),
                rating: Number(rating),
            });
            showToast('Trip completed successfully');
            setCompleteTarget(null);
            setEndOdometer('');
            fetchTrips();
            fetchStats();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to complete trip', 'error');
        } finally {
            setCompleting(false);
        }
    };

    const handleCancel = async () => {
        if (!cancelTarget) return;
        setCancelling(true);
        try {
            await api.patch(`/trips/${cancelTarget._id}/status`, { status: 'cancelled' });
            showToast('Trip cancelled');
            setCancelTarget(null);
            fetchTrips();
            fetchStats();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to cancel trip', 'error');
        } finally {
            setCancelling(false);
        }
    };

    const clearFilters = () => {
        setStatusFilter('');
        setShowFilters(false);
    };

    // ── Table ──
    const headers = ['Vehicle', 'Driver', 'Route', 'Cargo', 'Distance', 'Status', 'Date', ...(canWrite ? ['Actions'] : [])];

    const renderRow = (trip) => (
        <tr key={trip._id}>
            <td>
                <div className="vehicle-info">
                    <p className="vehicle-name">{trip.vehicle?.name || 'N/A'}</p>
                    <p className="vehicle-model">{trip.vehicle?.licensePlate || ''}</p>
                </div>
            </td>
            <td>{trip.driver?.name || 'N/A'}</td>
            <td>
                <div className="route-info">
                    <span className="route-point">{trip.origin}</span>
                    <span className="route-arrow">→</span>
                    <span className="route-point">{trip.destination}</span>
                </div>
            </td>
            <td>{trip.cargoWeight} kg</td>
            <td>{trip.distance ? `${trip.distance} km` : '—'}</td>
            <td>
                <span className={`badge ${trip.status}`}>
                    {trip.status}
                </span>
            </td>
            <td>
                {trip.startDate
                    ? new Date(trip.startDate).toLocaleDateString()
                    : <span className="text-muted-sm">Not started</span>
                }
            </td>
            {canWrite && (
                <td>
                    <div className="table-actions">
                        {trip.status === 'draft' && (
                            <button className="icon-btn dispatch" title="Dispatch" onClick={() => handleDispatch(trip)}>
                                <Play size={16} />
                            </button>
                        )}
                        {trip.status === 'dispatched' && (
                            <button className="icon-btn complete" title="Complete" onClick={() => { setCompleteTarget(trip); setEndOdometer(''); setRating(0); }}>
                                <CheckCircle2 size={16} />
                            </button>
                        )}
                        {trip.status === 'draft' && (
                            <button className="icon-btn edit" title="Edit" onClick={() => openEditModal(trip)}>
                                <Edit2 size={16} />
                            </button>
                        )}
                        {(trip.status === 'draft' || trip.status === 'dispatched') && (
                            <button className="icon-btn delete" title="Cancel" onClick={() => setCancelTarget(trip)}>
                                <XCircle size={16} />
                            </button>
                        )}
                    </div>
                </td>
            )}
        </tr>
    );

    return (
        <div className="vehicles-page animate-fade-in">
            {/* Stats */}
            <div className="vehicle-stats-grid">
                <StatCard title="Total" value={stats.total} icon={MapPin} color="#3b82f6" />
                <StatCard title="Draft" value={stats.draft} icon={Edit2} color="#64748b" />
                <StatCard title="Dispatched" value={stats.dispatched} icon={Play} color="#f59e0b" />
                <StatCard title="Completed" value={stats.completed} icon={CheckCircle} color="#10b981" />
                <StatCard title="Cancelled" value={stats.cancelled} icon={XCircle} color="#ef4444" />
            </div>

            {/* Header */}
            <div className="page-header">
                <div className="header-search">
                    <div className="search-input-wrapper">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search trips..."
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
                        Filters {statusFilter ? '(1)' : ''}
                    </Button>
                </div>
                {canWrite && <Button icon={Plus} onClick={openAddModal}>Create Trip</Button>}
            </div>

            {/* Filter Bar */}
            {showFilters && (
                <div className="filter-bar glass-effect">
                    <div className="filter-group">
                        <label>Status</label>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">All Statuses</option>
                            {TRIP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
                </div>
            )}

            <p className="results-count">{total} trip{total !== 1 ? 's' : ''} found</p>

            {/* Table */}
            <Table
                headers={headers}
                data={trips}
                renderRow={renderRow}
                loading={loading}
                emptyMessage="No trips found."
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} icon={ChevronLeft}>Prev</Button>
                    <span className="page-info">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} icon={ChevronRight}>Next</Button>
                </div>
            )}

            {/* ── Create / Edit Trip Modal ── */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={modalMode === 'add' ? 'Create New Trip' : 'Edit Trip'}>
                <form onSubmit={handleSubmit} className="vehicle-form">
                    <div className="form-grid">
                        <div className="form-field">
                            <label>Vehicle <span className="req">*</span></label>
                            <select name="vehicle" value={formData.vehicle} onChange={handleFormChange}>
                                <option value="">Select vehicle</option>
                                {vehicles.map((v) => (
                                    <option key={v._id} value={v._id}>{v.name} — {v.licensePlate} ({v.maxCapacity} kg)</option>
                                ))}
                            </select>
                            {formErrors.vehicle && <span className="field-error">{formErrors.vehicle}</span>}
                        </div>
                        <div className="form-field">
                            <label>Driver <span className="req">*</span></label>
                            <select name="driver" value={formData.driver} onChange={handleFormChange}>
                                <option value="">Select driver</option>
                                {drivers.map((d) => (
                                    <option key={d._id} value={d._id}>{d.name} — {d.licenseNumber}</option>
                                ))}
                            </select>
                            {formErrors.driver && <span className="field-error">{formErrors.driver}</span>}
                        </div>
                        <div className="form-field">
                            <label>Origin <span className="req">*</span></label>
                            <input name="origin" value={formData.origin} onChange={handleFormChange} placeholder="e.g. Mumbai Warehouse" />
                            {formErrors.origin && <span className="field-error">{formErrors.origin}</span>}
                        </div>
                        <div className="form-field">
                            <label>Destination <span className="req">*</span></label>
                            <input name="destination" value={formData.destination} onChange={handleFormChange} placeholder="e.g. Pune Hub" />
                            {formErrors.destination && <span className="field-error">{formErrors.destination}</span>}
                        </div>
                        <div className="form-field">
                            <label>Cargo Weight (kg) <span className="req">*</span></label>
                            <input type="number" name="cargoWeight" value={formData.cargoWeight} onChange={handleFormChange} placeholder="e.g. 500" min="0.01" step="0.01" />
                            {formErrors.cargoWeight && <span className="field-error">{formErrors.cargoWeight}</span>}
                        </div>
                        <div className="form-field">
                            <label>Distance (km)</label>
                            <input type="number" name="distance" value={formData.distance} onChange={handleFormChange} placeholder="e.g. 150" min="0" />
                        </div>
                    </div>
                    <div className="form-field full-width">
                        <label>Notes</label>
                        <textarea name="notes" value={formData.notes} onChange={handleFormChange} rows={3} placeholder="Optional notes..." />
                    </div>
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" isLoading={saving}>
                            {modalMode === 'add' ? 'Create Trip' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── Complete Trip Modal (needs end odometer) ── */}
            <Modal isOpen={!!completeTarget} onClose={() => setCompleteTarget(null)} title="Complete Trip">
                <div className="complete-form">
                    <p>Complete trip from <strong>{completeTarget?.origin}</strong> to <strong>{completeTarget?.destination}</strong>.</p>
                    <p className="text-muted-sm" style={{ marginTop: '0.5rem' }}>
                        Start Odometer: <strong>{completeTarget?.startOdometer?.toLocaleString() ?? 'N/A'} km</strong>
                    </p>
                    <div className="form-field" style={{ marginTop: '1rem' }}>
                        <label>End Odometer Reading (km) <span className="req">*</span></label>
                        <input
                            type="number"
                            value={endOdometer}
                            onChange={(e) => setEndOdometer(e.target.value)}
                            placeholder="e.g. 15200"
                            min={completeTarget?.startOdometer || 0}
                        />
                    </div>
                    <div className="form-field" style={{ marginTop: '1rem' }}>
                        <label>Driver Rating <span className="req">*</span></label>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={24}
                                    onClick={() => setRating(star)}
                                    fill={rating >= star ? "#fbbf24" : "none"}
                                    color={rating >= star ? "#fbbf24" : "#64748b"}
                                    style={{ cursor: 'pointer' }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => setCompleteTarget(null)}>Cancel</Button>
                        <Button onClick={handleComplete} isLoading={completing}>Complete Trip</Button>
                    </div>
                </div>
            </Modal>

            {/* ── Cancel Confirmation ── */}
            <Modal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} title="Cancel Trip">
                <div className="delete-confirm">
                    <p>Are you sure you want to cancel the trip from <strong>{cancelTarget?.origin}</strong> to <strong>{cancelTarget?.destination}</strong>?</p>
                    {cancelTarget?.status === 'dispatched' && (
                        <p className="delete-warning">This will release the vehicle and driver back to available status.</p>
                    )}
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => setCancelTarget(null)}>Go Back</Button>
                        <Button variant="danger" onClick={handleCancel} isLoading={cancelling}>Cancel Trip</Button>
                    </div>
                </div>
            </Modal>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default Trips;
