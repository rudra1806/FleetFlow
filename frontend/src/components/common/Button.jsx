import React from 'react';
import './Button.css';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    fullWidth = false,
    type = 'button',
    icon: Icon
}) => {
    return (
        <button
            type={type}
            className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${isLoading ? 'btn-loading' : ''}`}
            onClick={onClick}
            disabled={disabled || isLoading}
        >
            {isLoading ? (
                <span className="loader"></span>
            ) : (
                <>
                    {Icon && <Icon size={size === 'sm' ? 16 : 20} className="btn-icon" />}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;
