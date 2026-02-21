import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, Search, Filter, X, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Fuel as FuelIcon, Receipt, DollarSign, Shield, MoreHorizontal } from 'lucide-react';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import './Vehicles.css';
import './Expenses.css';

// ── Constants ──
const EXPENSE_TYPES = ['fuel', 'maintenance', 'insurance', 'other'];

const EMPTY_FORM = {
    vehicle: '', type: '', amount: '', liters: '', date: '', notes: '',
};

const typeIcons = {
    fuel: FuelIcon,
    maintenance: Receipt,
    insurance: Shield,
    other: MoreHorizontal,
};

const typeColors = {
    fuel: '#3b82f6',
    maintenance: '#f59e0b',
    insurance: '#8b5cf6',
    other: '#64748b',
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
const Expenses = () => {
    const { user } = useAuth();
    const isManager = user?.role === 'manager';

    // Data
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [vehicles, setVehicles] = useState([]);

    // Search, filter, pagination
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ type: '', vehicle: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Stats
    const [stats, setStats] = useState({ total: 0, fuel: 0, maintenance: 0, insurance: 0, other: 0 });

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Delete
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => setToast({ message, type });

    // ── Fetch expenses ──
    const fetchExpenses = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('page', page);
            params.set('limit', 10);
            if (filters.type) params.set('type', filters.type);
            if (filters.vehicle) params.set('vehicle', filters.vehicle);

            const response = await api.get(`/expenses?${params.toString()}`);
            let expensesData = response.data.expenses || [];

            // Client-side search filter
            if (search) {
                const q = search.toLowerCase();
                expensesData = expensesData.filter(e =>
                    e.vehicle?.name?.toLowerCase().includes(q) ||
                    e.vehicle?.licensePlate?.toLowerCase().includes(q) ||
                    e.type?.toLowerCase().includes(q) ||
                    e.notes?.toLowerCase().includes(q)
                );
            }

            setExpenses(expensesData);
            setTotalPages(response.data.totalPages || 1);
            setTotal(response.data.total || 0);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            showToast('Failed to load expenses', 'error');
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
            const totals = { total: 0, fuel: 0, maintenance: 0, insurance: 0, other: 0 };
            for (const t of EXPENSE_TYPES) {
                const res = await api.get(`/expenses?type=${t}&limit=1`);
                totals[t] = res.data.total || 0;
            }
            const allRes = await api.get('/expenses?limit=1');
            totals.total = allRes.data.total || 0;
            setStats(totals);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, []);

    useEffect(() => {
        fetchVehicles();
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        const timeoutId = setTimeout(fetchExpenses, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchExpenses]);

    useEffect(() => { setPage(1); }, [search, filters]);

    // ── Form Handlers ──
    const openAddModal = () => {
        setModalMode('add');
        setFormData(EMPTY_FORM);
        setFormErrors({});
        setEditingId(null);
        setShowModal(true);
    };

    const openEditModal = (expense) => {
        setModalMode('edit');
        setFormData({
            vehicle: expense.vehicle?._id || '',
            type: expense.type || '',
            amount: expense.amount || '',
            liters: expense.liters || '',
            date: expense.date ? expense.date.split('T')[0] : '',
            notes: expense.notes || '',
        });
        setFormErrors({});
        setEditingId(expense._id);
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
        if (!formData.type) errors.type = 'Expense type is required';
        if (!formData.amount || Number(formData.amount) <= 0) errors.amount = 'Amount must be positive';
        if (formData.type === 'fuel' && (!formData.liters || Number(formData.liters) <= 0)) {
            errors.liters = 'Liters is required for fuel expenses';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSaving(true);
        try {
            const payload = { ...formData };
            if (payload.amount) payload.amount = Number(payload.amount);
            if (payload.liters) payload.liters = Number(payload.liters);
            Object.keys(payload).forEach(k => {
                if (payload[k] === '' || payload[k] === undefined) delete payload[k];
            });

            if (modalMode === 'add') {
                await api.post('/expenses', payload);
                showToast('Expense created successfully');
            } else {
                // Don't send vehicle on update (not allowed by backend)
                delete payload.vehicle;
                await api.put(`/expenses/${editingId}`, payload);
                showToast('Expense updated successfully');
            }

            setShowModal(false);
            fetchExpenses();
            fetchStats();
        } catch (error) {
            showToast(error.response?.data?.message || 'Something went wrong', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ──
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/expenses/${deleteTarget._id}`);
            showToast('Expense deleted successfully');
            setDeleteTarget(null);
            fetchExpenses();
            fetchStats();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to delete', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const clearFilters = () => {
        setFilters({ type: '', vehicle: '' });
        setShowFilters(false);
    };

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    // ── Table ──
    const headers = ['Vehicle', 'Type', 'Amount', 'Liters', 'Date', 'Notes', ...(isManager ? ['Actions'] : [])];

    const renderRow = (expense) => {
        const TypeIcon = typeIcons[expense.type] || Receipt;
        return (
            <tr key={expense._id}>
                <td>
                    <div className="vehicle-info">
                        <p className="vehicle-name">{expense.vehicle?.name || 'N/A'}</p>
                        <p className="vehicle-model">{expense.vehicle?.licensePlate || ''}</p>
                    </div>
                </td>
                <td>
                    <div className="expense-type-badge" style={{ color: typeColors[expense.type] }}>
                        <TypeIcon size={14} />
                        <span>{expense.type}</span>
                    </div>
                </td>
                <td><span className="expense-amount">₹{(expense.amount || 0).toLocaleString()}</span></td>
                <td>{expense.type === 'fuel' && expense.liters ? `${expense.liters} L` : '—'}</td>
                <td>{new Date(expense.date).toLocaleDateString()}</td>
                <td><p className="table-desc">{expense.notes || '—'}</p></td>
                {isManager && (
                    <td>
                        <div className="table-actions">
                            <button className="icon-btn edit" title="Edit" onClick={() => openEditModal(expense)}>
                                <Edit2 size={16} />
                            </button>
                            <button className="icon-btn delete" title="Delete" onClick={() => setDeleteTarget(expense)}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </td>
                )}
            </tr>
        );
    };

    return (
        <div className="vehicles-page animate-fade-in">
            {/* Stats */}
            <div className="vehicle-stats-grid">
                <StatCard title="Total Expenses" value={stats.total} icon={DollarSign} color="#3b82f6" />
                <StatCard title="Fuel" value={stats.fuel} icon={FuelIcon} color="#3b82f6" />
                <StatCard title="Maintenance" value={stats.maintenance} icon={Receipt} color="#f59e0b" />
                <StatCard title="Insurance" value={stats.insurance} icon={Shield} color="#8b5cf6" />
                <StatCard title="Other" value={stats.other} icon={MoreHorizontal} color="#64748b" />
            </div>

            {/* Header */}
            <div className="page-header">
                <div className="header-search">
                    <div className="search-input-wrapper">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search expenses..."
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
                <Button icon={Plus} onClick={openAddModal}>Add Expense</Button>
            </div>

            {/* Filter Bar */}
            {showFilters && (
                <div className="filter-bar glass-effect">
                    <div className="filter-group">
                        <label>Type</label>
                        <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
                            <option value="">All Types</option>
                            {EXPENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Vehicle</label>
                        <select value={filters.vehicle} onChange={(e) => setFilters((f) => ({ ...f, vehicle: e.target.value }))}>
                            <option value="">All Vehicles</option>
                            {vehicles.map((v) => (
                                <option key={v._id} value={v._id}>{v.name} — {v.licensePlate}</option>
                            ))}
                        </select>
                    </div>
                    <Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
                </div>
            )}

            <p className="results-count">{total} expense{total !== 1 ? 's' : ''} found</p>

            {/* Table */}
            <Table
                headers={headers}
                data={expenses}
                renderRow={renderRow}
                loading={loading}
                emptyMessage="No expenses found."
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} icon={ChevronLeft}>Prev</Button>
                    <span className="page-info">Page {page} of {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} icon={ChevronRight}>Next</Button>
                </div>
            )}

            {/* ── Add / Edit Expense Modal ── */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={modalMode === 'add' ? 'Add Expense' : 'Edit Expense'}>
                <form onSubmit={handleSubmit} className="vehicle-form">
                    <div className="form-grid">
                        {modalMode === 'add' && (
                            <div className="form-field">
                                <label>Vehicle <span className="req">*</span></label>
                                <select name="vehicle" value={formData.vehicle} onChange={handleFormChange}>
                                    <option value="">Select vehicle</option>
                                    {vehicles.map((v) => (
                                        <option key={v._id} value={v._id}>{v.name} — {v.licensePlate}</option>
                                    ))}
                                </select>
                                {formErrors.vehicle && <span className="field-error">{formErrors.vehicle}</span>}
                            </div>
                        )}
                        <div className="form-field">
                            <label>Type <span className="req">*</span></label>
                            <select name="type" value={formData.type} onChange={handleFormChange}>
                                <option value="">Select type</option>
                                {EXPENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            {formErrors.type && <span className="field-error">{formErrors.type}</span>}
                        </div>
                        <div className="form-field">
                            <label>Amount (₹) <span className="req">*</span></label>
                            <input type="number" name="amount" value={formData.amount} onChange={handleFormChange} placeholder="e.g. 5000" min="0.01" step="0.01" />
                            {formErrors.amount && <span className="field-error">{formErrors.amount}</span>}
                        </div>
                        {formData.type === 'fuel' && (
                            <div className="form-field">
                                <label>Liters <span className="req">*</span></label>
                                <input type="number" name="liters" value={formData.liters} onChange={handleFormChange} placeholder="e.g. 50" min="0.01" step="0.01" />
                                {formErrors.liters && <span className="field-error">{formErrors.liters}</span>}
                            </div>
                        )}
                        <div className="form-field">
                            <label>Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleFormChange} />
                        </div>
                    </div>
                    <div className="form-field full-width">
                        <label>Notes</label>
                        <textarea name="notes" value={formData.notes} onChange={handleFormChange} rows={3} placeholder="Optional notes..." />
                    </div>
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" isLoading={saving}>
                            {modalMode === 'add' ? 'Add Expense' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── Delete Confirmation ── */}
            <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Expense">
                <div className="delete-confirm">
                    <p>Are you sure you want to delete this <strong>{deleteTarget?.type}</strong> expense of <strong>₹{deleteTarget?.amount?.toLocaleString()}</strong>?</p>
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

export default Expenses;
