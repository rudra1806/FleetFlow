import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

// ProtectedRoute v2.1
const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    const getTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        const name = path.substring(1);
        return name.charAt(0).toUpperCase() + name.slice(1);
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

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
