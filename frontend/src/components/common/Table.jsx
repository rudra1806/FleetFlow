import React from 'react';
import './Table.css';

const Table = ({ headers, data, renderRow, loading, emptyMessage = 'No data available' }) => {
    return (
        <div className="table-container glass-effect">
            <table className="custom-table">
                <thead>
                    <tr>
                        {headers.map((header, index) => (
                            <th key={index}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={headers.length} className="table-loading">
                                <div className="loader"></div>
                                <span>Loading data...</span>
                            </td>
                        </tr>
                    ) : data && data.length > 0 ? (
                        data.map((item, index) => renderRow(item, index))
                    ) : (
                        <tr>
                            <td colSpan={headers.length} className="table-empty">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
