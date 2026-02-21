import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

// ProtectedRoute v3.0 (With Role Support)
const ProtectedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    const getTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        const name = path.substring(1);
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    // 🔹 Loading screen
    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
            </div>
        );
    }

    // 🔹 Not logged in
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 🔥 Role Restriction Check
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div className="app-layout">
                <Sidebar />
                <div className="main-content">
                    <Navbar title="Access Denied" />
                    <main className="content-container">
                        <div style={{ padding: "2rem", textAlign: "center" }}>
                            <h2>🚫 Access Denied</h2>
                            <p>You do not have permission to access this page.</p>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // 🔹 Authorized Layout
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <Navbar title={getTitle()} />
                <main className="content-container">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default ProtectedRoute;