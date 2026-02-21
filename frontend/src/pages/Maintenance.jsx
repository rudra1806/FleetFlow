import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, CheckCircle, Search, Filter, X, ChevronLeft, ChevronRight, AlertTriangle, Wrench, Clock, CheckCircle2, PenTool, Play } from 'lucide-react';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import './Maintenance.css';

// ── Constants ──
const SERVICE_TYPES = ['oil_change', 'tire_rotation', 'brake_service', 'engine_repair', 'transmission', 'electrical', 'body_work', 'inspection', 'general'];
const MAINTENANCE_STATUSES = ['scheduled', 'in_progress', 'completed'];

const EMPTY_FORM = {
    vehicle: '', serviceType: '', description: '', cost: '', serviceDate: '', mechanic: '', notes: '',
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

const formatServiceType = (s) => s?.replace(/_/g, ' ') || '';

// ── Main Component ──
const Maintenance = () => {
    const { user } = useAuth();
    const isManager = user?.role === 'manager';

    // Data
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vehicles, setVehicles] = useState([]);

    // Search, filter, pagination
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ serviceType: '', status: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Stats
    const [stats, setStats] = useState({ total: 0, scheduled: 0, in_progress: 0, completed: 0 });

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Start Work confirm (scheduled → in_progress)
    const [startTarget, setStartTarget] = useState(null);
    const [starting, setStarting] = useState(false);

    // Complete confirm (in_progress → completed)
    const [completeTarget, setCompleteTarget] = useState(null);
    const [completing, setCompleting] = useState(false);

    // Delete
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => setToast({ message, type });

    // ── Fetch maintenance records ──
    const fetchRecords = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', page);
            params.set('limit', 10);
            if (filters.serviceType) params.set('serviceType', filters.serviceType);
            if (filters.status) params.set('status', filters.status);

            const response = await api.get(`/maintenance?${params.toString()}`);
            let data = response.data.maintenance || [];

            if (search) {
                const q = search.toLowerCase();
                data = data.filter(r =>
                    r.vehicle?.name?.toLowerCase().includes(q) ||
                    r.vehicle?.licensePlate?.toLowerCase().includes(q) ||
                    r.description?.toLowerCase().includes(q) ||
                    r.mechanic?.toLowerCase().includes(q) ||
                    formatServiceType(r.serviceType).includes(q)
                );
            }

            setRecords(data);
            setTotalPages(response.data.totalPages || 1);
            setTotal(response.data.total || 0);
        } catch (error) {
            console.error('Error fetching maintenance:', error);
            showToast('Failed to load maintenance records', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, filters, search]);

    // ── Fetch vehicles for dropdown ──
    const fetchVehicles = async () => {
        try {
            const res = await api.get('/vehicles?limit=100');
            setVehicles(res.data.vehicles || []);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    // ── Compute stats ──
    const fetchStats = useCallback(async () => {
        try {
            const counts = { total: 0, scheduled: 0, in_progress: 0, completed: 0 };
            for (const s of MAINTENANCE_STATUSES) {
                const res = await api.get(`/maintenance?status=${s}&limit=1`);
                counts[s] = res.data.total || 0;
            }
            const allRes = await api.get('/maintenance?limit=1');
            counts.total = allRes.data.total || 0;
            setStats(counts);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, []);

    useEffect(() => {
        fetchVehicles();
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        const timeoutId = setTimeout(fetchRecords, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchRecords]);

    useEffect(() => { setPage(1); }, [search, filters]);

    // ── Form Handlers ──
    const openAddModal = () => {
        setModalMode('add');
        setFormData(EMPTY_FORM);
        setFormErrors({});
        setEditingId(null);
        setShowModal(true);
    };

    const openEditModal = (record) => {
        setModalMode('edit');
        setFormData({
            vehicle: record.vehicle?._id || '',
            serviceType: record.serviceType || '',
            description: record.description || '',
            cost: record.cost || '',
            serviceDate: record.serviceDate ? record.serviceDate.split('T')[0] : '',
            mechanic: record.mechanic || '',
            notes: record.notes || '',
        });
        setFormErrors({});
        setEditingId(record._id);
        setShowModal(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.vehicle && modalMode === 'add') errors.vehicle = 'Vehicle is required';
        if (!formData.serviceType) errors.serviceType = 'Service type is required';
        if (!formData.description.trim()) errors.description = 'Description is required';
        if (!formData.cost || Number(formData.cost) < 0) errors.cost = 'Cost must be 0 or more';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSaving(true);
        try {
            const payload = { ...formData };
            if (payload.cost !== '') payload.cost = Number(payload.cost);
            Object.keys(payload).forEach(k => {
                if (payload[k] === '' || payload[k] === undefined) delete payload[k];
            });

            if (modalMode === 'add') {
                await api.post('/maintenance', payload);
                showToast('Maintenance log created. Vehicle set to in_shop.');
            } else {
                delete payload.vehicle;
                await api.put(`/maintenance/${editingId}`, payload);
                showToast('Maintenance record updated');
            }

            setShowModal(false);
            fetchRecords();
            fetchStats();
        } catch (error) {
            showToast(error.response?.data?.message || 'Something went wrong', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Start Work (scheduled → in_progress) ──
    const handleStartWork = async () => {
        if (!startTarget) return;
        setStarting(true);
        try {
            await api.put(`/maintenance/${startTarget._id}`, { status: 'in_progress' });
            showToast('Maintenance started. Status set to In Progress.');
            setStartTarget(null);
            fetchRecords();
            fetchStats();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to start work', 'error');
        } finally {
            setStarting(false);
        }
    };

    // ── Complete (in_progress → completed) ──
    const handleComplete = async () => {
        if (!completeTarget) return;
        setCompleting(true);
        try {
            await api.put(`/maintenance/${completeTarget._id}`, { status: 'completed' });
            showToast('Maintenance completed. Vehicle released back to available.');
            setCompleteTarget(null);
            fetchRecords();
            fetchStats();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to complete', 'error');
        } finally {
            setCompleting(false);
        }
    };

    // ── Delete ──
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/maintenance/${deleteTarget._id}`);
            showToast('Maintenance record deleted');
            setDeleteTarget(null);
            fetchRecords();
            fetchStats();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to delete', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const clearFilters = () => {
        setFilters({ serviceType: '', status: '' });
        setShowFilters(false);
    };

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    // ── Table ──
    const headers = ['Vehicle', 'Service Type', 'Description', 'Cost', 'Status', 'Service Date', ...(isManager ? ['Actions'] : [])];

    const renderRow = (record) => (
        <tr key={record._id}>
            <td>
                <div className="vehicle-info">
                    <p className="vehicle-name">{record.vehicle?.name || 'N/A'}</p>
                    <p className="vehicle-model">{record.vehicle?.licensePlate || ''}</p>
                </div>
            </td>
            <td>
                <div className="service-type">
                    <PenTool size={14} />
                    <span>{formatServiceType(record.serviceType)}</span>
                </div>
            </td>
            <td><p className="table-desc">{record.description}</p></td>
            <td><span className="cost-tag">₹{(record.cost || 0).toLocaleString()}</span></td>
            <td>
                <span className={`badge ${record.status}`}>
                    {record.status?.replace(/_/g, ' ')}
                </span>
            </td>
            <td>{new Date(record.serviceDate).toLocaleDateString()}</td>
            {isManager && (
                <td>
                    <div className="table-actions">
                        {record.status === 'scheduled' && (
                            <button className="icon-btn start" title="Start Work" onClick={() => setStartTarget(record)}>
                                <Play size={16} />
                            </button>
                        )}
                        {record.status === 'in_progress' && (
                            <button className="icon-btn complete" title="Mark Completed" onClick={() => setCompleteTarget(record)}>
                                <CheckCircle2 size={16} />
                            </button>
                        )}
                        {record.status !== 'completed' && (
                            <button className="icon-btn edit" title="Edit" onClick={() => openEditModal(record)}>
                                <Edit2 size={16} />
                            </button>
                        )}
                        {record.status === 'scheduled' && (
                            <button className="icon-btn delete" title="Delete" onClick={() => setDeleteTarget(record)}>
                                <Trash2 size={16} />
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
                <StatCard title="Total" value={stats.total} icon={Wrench} color="#3b82f6" />
                <StatCard title="Scheduled" value={stats.scheduled} icon={Clock} color="#64748b" />
                <StatCard title="In Progress" value={stats.in_progress} icon={AlertTriangle} color="#f59e0b" />
                <StatCard title="Completed" value={stats.completed} icon={CheckCircle} color="#10b981" />
            </div>

            {/* Header */}
            <div className="page-header">
                <div className="header-search">
                    <div className="search-input-wrapper">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search maintenance..."
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
                {isManager && <Button icon={Plus} onClick={openAddModal}>Log Maintenance</Button>}
            </div>

            {/* Filter Bar */}
            {showFilters && (
                <div className="filter-bar glass-effect">
                    <div className="filter-group">
                        <label>Service Type</label>
                        <select value={filters.serviceType} onChange={(e) => setFilters((f) => ({ ...f, serviceType: e.target.value }))}>
                            <option value="">All Types</option>
                            {SERVICE_TYPES.map((t) => <option key={t} value={t}>{formatServiceType(t)}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Status</label>
                        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
                            <option value="">All Statuses</option>
                            {MAINTENANCE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                    </div>
                    <Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
                </div>
            )}

            <p className="results-count">{total} record{total !== 1 ? 's' : ''} found</p>

            {/* Table */}
            <Table
                headers={headers}
                data={records}
                renderRow={renderRow}
                loading={loading}
                emptyMessage="No maintenance records found."
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} icon={ChevronLeft}>Prev</Button>
                    <span className="page-info">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} icon={ChevronRight}>Next</Button>
                </div>
            )}

            {/* ── Add / Edit Modal ── */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={modalMode === 'add' ? 'Log Maintenance' : 'Edit Maintenance'}>
                <form onSubmit={handleSubmit} className="vehicle-form">
                    <div className="form-grid">
                        {modalMode === 'add' && (
                            <div className="form-field">
                                <label>Vehicle <span className="req">*</span></label>
                                <select name="vehicle" value={formData.vehicle} onChange={handleFormChange}>
                                    <option value="">Select vehicle</option>
                                    {vehicles.filter(v => v.status !== 'on_trip').map((v) => (
                                        <option key={v._id} value={v._id}>{v.name} — {v.licensePlate}</option>
                                    ))}
                                </select>
                                {formErrors.vehicle && <span className="field-error">{formErrors.vehicle}</span>}
                            </div>
                        )}
                        <div className="form-field">
                            <label>Service Type <span className="req">*</span></label>
                            <select name="serviceType" value={formData.serviceType} onChange={handleFormChange}>
                                <option value="">Select service type</option>
                                {SERVICE_TYPES.map((t) => <option key={t} value={t}>{formatServiceType(t)}</option>)}
                            </select>
                            {formErrors.serviceType && <span className="field-error">{formErrors.serviceType}</span>}
                        </div>
                        <div className="form-field">
                            <label>Cost (₹) <span className="req">*</span></label>
                            <input type="number" name="cost" value={formData.cost} onChange={handleFormChange} placeholder="e.g. 5000" min="0" step="0.01" />
                            {formErrors.cost && <span className="field-error">{formErrors.cost}</span>}
                        </div>
                        <div className="form-field">
                            <label>Service Date</label>
                            <input type="date" name="serviceDate" value={formData.serviceDate} onChange={handleFormChange} />
                        </div>
                        <div className="form-field">
                            <label>Mechanic</label>
                            <input name="mechanic" value={formData.mechanic} onChange={handleFormChange} placeholder="e.g. Rajesh Kumar" />
                        </div>
                    </div>
                    <div className="form-field full-width">
                        <label>Description <span className="req">*</span></label>
                        <textarea name="description" value={formData.description} onChange={handleFormChange} rows={3} placeholder="Describe the service performed..." />
                        {formErrors.description && <span className="field-error">{formErrors.description}</span>}
                    </div>
                    <div className="form-field full-width">
                        <label>Notes</label>
                        <textarea name="notes" value={formData.notes} onChange={handleFormChange} rows={2} placeholder="Optional notes..." />
                    </div>
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" isLoading={saving}>
                            {modalMode === 'add' ? 'Create Log' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── Start Work Confirmation ── */}
            <Modal isOpen={!!startTarget} onClose={() => setStartTarget(null)} title="Start Maintenance Work">
                <div className="delete-confirm">
                    <p>Start work on <strong>{formatServiceType(startTarget?.serviceType)}</strong> for <strong>{startTarget?.vehicle?.name}</strong>?</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        This will change the status from "Scheduled" to "In Progress".
                    </p>
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => setStartTarget(null)}>Cancel</Button>
                        <Button onClick={handleStartWork} isLoading={starting}>Start Work</Button>
                    </div>
                </div>
            </Modal>

            {/* ── Complete Confirmation ── */}
            <Modal isOpen={!!completeTarget} onClose={() => setCompleteTarget(null)} title="Complete Maintenance">
                <div className="delete-confirm">
                    <p>Mark <strong>{formatServiceType(completeTarget?.serviceType)}</strong> for <strong>{completeTarget?.vehicle?.name}</strong> as completed?</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        This will set the vehicle status back to "available" and lock this record from further edits.
                    </p>
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => setCompleteTarget(null)}>Cancel</Button>
                        <Button onClick={handleComplete} isLoading={completing}>Complete</Button>
                    </div>
                </div>
            </Modal>

            {/* ── Delete Confirmation ── */}
            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Maintenance">
                <div className="delete-confirm">
                    <p>Delete the <strong>{formatServiceType(deleteTarget?.serviceType)}</strong> record for <strong>{deleteTarget?.vehicle?.name}</strong>?</p>
                    <p className="delete-warning">This will release the vehicle back to available status.</p>
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

export default Maintenance;
