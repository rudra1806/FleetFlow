import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Shield, Calendar, Edit3, X, Save } from 'lucide-react';
import api from '../services/api';
import Button from '../components/common/Button';
import './Profile.css';

const Profile = () => {
    const { user, login } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');
            const res = await api.put('/auth/profile', {
                name: form.name,
                phone: form.phone,
            });
            if (res.data.status) {
                setSuccess('Profile updated successfully!');
                setEditing(false);
                const meRes = await api.get('/auth/me');
                if (meRes.data.status) {
                    window.location.reload();
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setForm({ name: user?.name || '', phone: user?.phone || '' });
        setEditing(false);
        setError('');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="profile-page animate-fade-in">
            <div className="profile-header glass-card">
                <div className="profile-avatar">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="profile-header-info">
                    <h2>{user?.name || 'User'}</h2>
                    <span className="role-badge">{user?.role?.replace('_', ' ') || 'Member'}</span>
                </div>
            </div>

            {success && <div className="success-msg">{success}</div>}
            {error && <div className="error-msg">{error}</div>}

            {!editing ? (
                <div className="profile-section glass-card">
                    <h3><User size={18} /> Personal Information</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="label">Full Name</span>
                            <span className="value">{user?.name || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Email Address</span>
                            <span className="value">{user?.email || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Phone</span>
                            <span className="value">{user?.phone || 'Not provided'}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Role</span>
                            <span className="value" style={{ textTransform: 'capitalize' }}>
                                {user?.role?.replace('_', ' ') || 'N/A'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="label">Account Status</span>
                            <span className="value" style={{ color: user?.isActive ? 'var(--success)' : 'var(--danger)' }}>
                                {user?.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="label">Member Since</span>
                            <span className="value">{formatDate(user?.createdAt)}</span>
                        </div>
                    </div>
                    <div className="profile-actions">
                        <Button variant="primary" icon={Edit3} onClick={() => setEditing(true)}>
                            Edit Profile
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="profile-section glass-card">
                    <h3><Edit3 size={18} /> Edit Profile</h3>
                    <div className="edit-form">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="text"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                            />
                        </div>
                        <div className="form-actions">
                            <Button
                                variant="primary"
                                icon={Save}
                                onClick={handleSave}
                                isLoading={saving}
                            >
                                Save Changes
                            </Button>
                            <Button variant="secondary" icon={X} onClick={handleCancel}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
