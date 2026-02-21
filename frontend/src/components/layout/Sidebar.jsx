import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Truck,
    Users,
    MapPin,
    Fuel,
    Wrench,
    BarChart3,
    LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const { logout, user } = useAuth();

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Vehicles', icon: Truck, path: '/vehicles' },
        { name: 'Drivers', icon: Users, path: '/drivers' },
        { name: 'Trips', icon: MapPin, path: '/trips' },
        { name: 'Expenses', icon: Fuel, path: '/expenses' },
        { name: 'Maintenance', icon: Wrench, path: '/maintenance' },
        { name: 'Analytics', icon: BarChart3, path: '/analytics' },
    ];

    return (
        <aside className="sidebar glass-effect">
            <div className="sidebar-header">
                <div className="sidebar-logo">Fleet<span>Flow</span></div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <NavLink to="/profile" className="user-profile-link">
                    <div className="user-profile">
                        <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
                        <div className="user-info">
                            <p className="user-name">{user?.name || 'User'}</p>
                            <p className="user-role">{user?.role || 'Manager'}</p>
                        </div>
                    </div>
                </NavLink>
                <button onClick={logout} className="logout-btn">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
