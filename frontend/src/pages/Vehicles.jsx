import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import './Vehicles.css';

const Vehicles = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/vehicles?search=${search}`);
            setVehicles(response.data.vehicles);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(fetchVehicles, 300);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const headers = ['Vehicle', 'License Plate', 'Type', 'Status', 'Odometer', 'Capacity', 'Actions'];

    const renderRow = (vehicle) => (
        <tr key={vehicle._id}>
            <td>
                <div className="vehicle-info">
                    <p className="vehicle-name">{vehicle.name}</p>
                    <p className="vehicle-model">{vehicle.model}</p>
                </div>
            </td>
            <td><code className="license-plate">{vehicle.licensePlate}</code></td>
            <td>{vehicle.type}</td>
            <td>
                <span className={`badge ${vehicle.status}`}>
                    {vehicle.status.replace('_', ' ')}
                </span>
            </td>
            <td>{vehicle.currentOdometer.toLocaleString()} km</td>
            <td>{vehicle.maxCapacity} kg</td>
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
                            placeholder="Search vehicles..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="secondary" icon={Filter}>Filters</Button>
                </div>
                <Button icon={Plus}>Add Vehicle</Button>
            </div>

            <Table
                headers={headers}
                data={vehicles}
                renderRow={renderRow}
                loading={loading}
                emptyMessage="No vehicles found."
            />
        </div>
    );
};

export default Vehicles;
