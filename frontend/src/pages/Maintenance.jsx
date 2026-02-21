import { useState, useEffect } from 'react';
import { Plus, CheckCircle, Search, Calendar, DollarSign, PenTool } from 'lucide-react';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import './Vehicles.css';

const Maintenance = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMaintenance = async () => {
        try {
            setLoading(true);
            const response = await api.get('/maintenance');
            setRecords(response.data.maintenance);
        } catch (error) {
            console.error('Error fetching maintenance:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaintenance();
    }, []);

    const headers = ['Vehicle', 'Service Type', 'Description', 'Cost', 'Status', 'Service Date', 'Actions'];

    const renderRow = (record) => (
        <tr key={record._id}>
            <td>
                <div className="vehicle-info">
                    <p className="vehicle-name">{record.vehicle?.name}</p>
                    <p className="vehicle-model">{record.vehicle?.licensePlate}</p>
                </div>
            </td>
            <td>
                <div className="service-type">
                    <PenTool size={14} />
                    <span>{record.serviceType.replace('_', ' ')}</span>
                </div>
            </td>
            <td><p className="table-desc">{record.description}</p></td>
            <td><span className="cost-tag">₹{record.cost.toLocaleString()}</span></td>
            <td>
                <span className={`badge ${record.status}`}>
                    {record.status.replace('_', ' ')}
                </span>
            </td>
            <td>{new Date(record.serviceDate).toLocaleDateString()}</td>
            <td>
                <div className="table-actions">
                    {record.status !== 'completed' && <button className="icon-btn available" title="Mark Completed"><CheckCircle size={16} /></button>}
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
                        <input type="text" placeholder="Search logs..." />
                    </div>
                </div>
                <Button icon={Plus}>Log Maintenance</Button>
            </div>

            <Table
                headers={headers}
                data={records}
                renderRow={renderRow}
                loading={loading}
                emptyMessage="No maintenance records found."
            />
        </div>
    );
};

export default Maintenance;
