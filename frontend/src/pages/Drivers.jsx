import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Phone, Mail, Award } from 'lucide-react';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import './Vehicles.css'; // Reuse table styles

const Drivers = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchDrivers = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/drivers?search=${search}`);
            setDrivers(response.data.drivers);
        } catch (error) {
            console.error('Error fetching drivers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(fetchDrivers, 300);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const headers = ['Driver', 'Contact Info', 'License Number', 'Expiry', 'Status', 'Performance', 'Actions'];

    const renderRow = (driver) => (
        <tr key={driver._id}>
            <td>
                <div className="vehicle-info">
                    <p className="vehicle-name">{driver.name}</p>
                    <p className="vehicle-model">ID: {driver._id.slice(-6).toUpperCase()}</p>
                </div>
            </td>
            <td>
                <div className="contact-info">
                    <p><Phone size={12} /> {driver.phone}</p>
                    <p><Mail size={12} /> {driver.email}</p>
                </div>
            </td>
            <td><code className="license-plate">{driver.licenseNumber}</code></td>
            <td>
                <span className={`expiry-date ${new Date(driver.licenseExpiry) < new Date() ? 'expired' : ''}`}>
                    {new Date(driver.licenseExpiry).toLocaleDateString()}
                </span>
            </td>
            <td>
                <span className={`badge ${driver.status}`}>
                    {driver.status.replace('_', ' ')}
                </span>
            </td>
            <td>
                <div className="performance-score">
                    <Award size={16} color="#f59e0b" />
                    <span>{driver.safetyScore || 4.5}</span>
                </div>
            </td>
            <td>
                <div className="table-actions">
                    <button className="icon-btn edit"><Edit2 size={16} /></button>
                    <button className="icon-btn delete"><Trash2 size={16} /></button>
                </div>
            </td>
        </tr>
    );

    return (
        <div className="vehicles-page animate-fade-in">
            <div className="page-header">
                <div className="header-search">
                    <div className="search-input-wrapper">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search drivers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <Button icon={Plus}>Add Driver</Button>
            </div>

            <Table
                headers={headers}
                data={drivers}
                renderRow={renderRow}
                loading={loading}
                emptyMessage="No drivers found."
            />
        </div>
    );
};

export default Drivers;
