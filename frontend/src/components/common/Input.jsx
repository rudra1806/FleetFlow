import React from 'react';
import './Input.css';

const Input = ({
    label,
    error,
    icon: Icon,
    type = 'text',
    placeholder,
    value,
    onChange,
    name,
    required = false
}) => {
    return (
        <div className="input-group">
            {label && <label className="input-label">{label}{required && <span className="required">*</span>}</label>}
            <div className={`input-wrapper ${error ? 'input-error' : ''}`}>
                {Icon && <Icon className="input-icon" size={20} />}
                <input
                    type={type}
                    name={name}
                    className={`custom-input ${Icon ? 'with-icon' : ''}`}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required={required}
                />
            </div>
            {error && <span className="error-message">{error}</span>}
        </div>
    );
};

export default Input;
