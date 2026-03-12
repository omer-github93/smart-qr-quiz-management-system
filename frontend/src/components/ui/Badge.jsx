import React from 'react';
import { cn } from '../../utils/cn';

const Badge = ({ children, variant = 'primary', className }) => {
    const variants = {
        primary: 'bg-blue-100 text-blue-700',
        success: 'bg-emerald-100 text-emerald-700',
        danger: 'bg-red-100 text-red-700',
        warning: 'bg-amber-100 text-amber-700',
        info: 'bg-sky-100 text-sky-700',
        secondary: 'bg-slate-100 text-slate-700',
    };

    return (
        <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold",
            variants[variant],
            className
        )}>
            {children}
        </span>
    );
};

export default Badge;
