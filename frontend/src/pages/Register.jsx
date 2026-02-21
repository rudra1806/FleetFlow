import { useState } from 'react';
import { Mail, Lock, User, Phone, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'manager' // Default role for testing
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await register(formData);
            if (result.status) {
                navigate('/');
            } else {
                setError(result.message || 'Registration failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass-effect animate-fade-in">
                <div className="auth-header">
                    <div className="auth-logo">Fleet<span>Flow</span></div>
                    <h1>Create Account</h1>
                    <p>Join FleetFlow management system</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="auth-alert danger">{error}</div>}

                    <Input
                        label="Full Name"
                        icon={User}
                        type="text"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />

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
                        label="Phone Number"
                        icon={Phone}
                        type="tel"
                        name="phone"
                        placeholder="9876543210"
                        value={formData.phone}
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

                    <Button
                        type="submit"
                        isLoading={loading}
                        fullWidth
                        icon={UserPlus}
                    >
                        Create Account
                    </Button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Login here</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
