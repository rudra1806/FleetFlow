import { useState } from 'react';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import './Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const response = await api.post('/auth/forgot-password', { email });
            if (response.data.status) {
                setSuccess(response.data.message || 'If a user with that email exists, a reset link has been sent.');
            } else {
                setError(response.data.message || 'Something went wrong.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass-effect animate-fade-in">
                <div className="auth-header">
                    <div className="auth-logo">Fleet<span>Flow</span></div>
                    <h1>Forgot Password</h1>
                    <p>Enter your email to receive a reset link</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-alert danger">{error}</div>}
                    {success && <div className="auth-alert success">{success}</div>}

                    <Input
                        label="Email Address"
                        icon={Mail}
                        type="email"
                        name="email"
                        placeholder="manager@fleetflow.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Button
                        type="submit"
                        isLoading={loading}
                        fullWidth
                        icon={Send}
                    >
                        Send Reset Link
                    </Button>
                </form>

                <div className="auth-footer">
                    <Link to="/login"><ArrowLeft size={14} /> Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
