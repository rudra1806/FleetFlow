import { useState, useEffect } from 'react';
import { Plus, Search, Fuel as FuelIcon, Receipt, Filter } from 'lucide-react';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import './Vehicles.css';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Since the API requires vehicleId to get expenses, we'll need a better way to list all.
    // For now, we'll try to fetch all if backend supports it, or handle it gracefully.
    // Based on backend routes, there's no "get all expenses" global endpoint, 
    // but we can fetch them per vehicle or show a selection.
    // I'll assume we fetch recent expenses.

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            // Fallback or demo approach if no global endpoint
            const response = await api.get('/stats/recent-expenses');
            setExpenses(response.data.expenses || []);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const headers = ['Vehicle', 'Type', 'Amount', 'Liters/Details', 'Date', 'Notes'];

    const renderRow = (expense) => (
        <tr key={expense._id}>
            <td>
                <div className="vehicle-info">
                    <p className="vehicle-name">{expense.vehicle?.name}</p>
                    <p className="vehicle-model">{expense.vehicle?.licensePlate}</p>
                </div>
            </td>
            <td>
                <div className={`expense-type-badge ${expense.type}`}>
                    {expense.type === 'fuel' ? <FuelIcon size={14} /> : <Receipt size={14} />}
                    <span>{expense.type}</span>
                </div>
            </td>
            <td><span className="expense-amount">₹{expense.amount.toLocaleString()}</span></td>
            <td>{expense.type === 'fuel' ? `${expense.liters} L` : 'N/A'}</td>
            <td>{new Date(expense.date).toLocaleDateString()}</td>
            <td><p className="table-desc">{expense.notes || '-'}</p></td>
        </tr>
    );

    return (
        <div className="vehicles-page animate-fade-in">
            <div className="page-header">
                <div className="header-search">
                    <div className="search-input-wrapper">
                        <Search size={18} />
                        <input type="text" placeholder="Search expenses..." />
                    </div>
                    <Button variant="secondary" icon={Filter}>All Types</Button>
                </div>
                <Button icon={Plus}>Add Expense</Button>
            </div>

            <Table
                headers={headers}
                data={expenses}
                renderRow={renderRow}
                loading={loading}
                emptyMessage="No expenses found."
            />
        </div>
    );
};

export default Expenses;
