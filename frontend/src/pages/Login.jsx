import { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import './Auth.css';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await login(formData.email, formData.password);
            if (result.status) {
                navigate('/');
            } else {
                setError(result.message || 'Invalid credentials');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass-effect animate-fade-in">
                <div className="auth-header">
                    <div className="auth-logo">Fleet<span>Flow</span></div>
                    <h1>Welcome Back</h1>
                    <p>Sign in to manage your fleet</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-alert danger">{error}</div>}

                    <Input
                        label="Email Address"
                        icon={Mail}
                        type="email"
                        name="email"
                        placeholder="manager@fleetflow.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <Input
                        label="Password"
                        icon={Lock}
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <div className="auth-actions">
                        <Link to="/forgot-password">Forgot password?</Link>
                    </div>

                    <Button
                        type="submit"
                        isLoading={loading}
                        fullWidth
                        icon={LogIn}
                    >
                        Sign In
                    </Button>
                </form>

                <div className="auth-footer">
                    Don't have an account? <Link to="/register">Register now</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
