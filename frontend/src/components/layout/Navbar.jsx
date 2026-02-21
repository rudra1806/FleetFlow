import './Navbar.css';

const Navbar = ({ title }) => {
    return (
        <header className="navbar glass-effect">
            <div className="navbar-left">
                <h1>{title}</h1>
            </div>
        </header>
    );
};

export default Navbar;
