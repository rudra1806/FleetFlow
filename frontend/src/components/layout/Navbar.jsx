import { Bell, Search, User } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ title }) => {
    return (
        <header className="navbar glass-effect">
            <div className="navbar-left">
                <h1>{title}</h1>
            </div>

            <div className="navbar-right">
                <div className="search-bar">
                    <Search size={18} />
                    <input type="text" placeholder="Search..." />
                </div>

                <button className="nav-icon-btn">
                    <Bell size={20} />
                    <span className="notification-badge"></span>
                </button>

                <div className="nav-divider"></div>

                <button className="nav-profile-btn">
                    <User size={20} />
                </button>
            </div>
        </header>
    );
};

export default Navbar;
