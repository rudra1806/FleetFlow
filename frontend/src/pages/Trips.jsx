import { useState, useEffect } from 'react';
import { Plus, Edit2, Play, CheckCircle2, XCircle, Search, MapPin } from 'lucide-react';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import './Vehicles.css';

const Trips = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTrips = async () => {
        try {
            setLoading(true);
            const response = await api.get('/trips');
            setTrips(response.data.trips);
        } catch (error) {
            console.error('Error fetching trips:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, []);

    const headers = ['Vehicle', 'Driver', 'Route', 'Cargo', 'Status', 'Date', 'Actions'];

    const renderRow = (trip) => (
        <tr key={trip._id}>
            <td>
                <div className="vehicle-info">
                    <p className="vehicle-name">{trip.vehicle?.name}</p>
                    <p className="vehicle-model">{trip.vehicle?.licensePlate}</p>
                </div>
            </td>
            <td>{trip.driver?.name}</td>
            <td>
                <div className="route-info">
                    <span>{trip.origin}</span>
                    <div className="route-line"></div>
                    <span>{trip.destination}</span>
                </div>
            </td>
            <td>{trip.cargoWeight} kg</td>
            <td>
                <span className={`badge ${trip.status}`}>
                    {trip.status}
                </span>
            </td>
            <td>{trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'Draft'}</td>
            <td>
                <div className="table-actions">
                    {trip.status === 'draft' && <button className="icon-btn trip" title="Dispatch"><Play size={16} /></button>}
                    {trip.status === 'dispatched' && <button className="icon-btn available" title="Complete"><CheckCircle2 size={16} /></button>}
                    {trip.status === 'draft' && <button className="icon-btn edit" title="Edit"><Edit2 size={16} /></button>}
                    {(trip.status === 'draft' || trip.status === 'dispatched') && <button className="icon-btn delete" title="Cancel"><XCircle size={16} /></button>}
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
                        <input type="text" placeholder="Search trips..." />
                    </div>
                </div>
                <Button icon={Plus}>Dispatch Trip</Button>
            </div>

            <Table
                headers={headers}
                data={trips}
                renderRow={renderRow}
                loading={loading}
                emptyMessage="No trips found."
            />
        </div>
    );
};

export default Trips;
