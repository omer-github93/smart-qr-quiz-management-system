import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    children,
    ...props
}, ref) => {
    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200',
        secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-slate-100',
        danger: 'bg-red-600 text-white hover:bg-red-700 shadow-red-200',
        outline: 'border border-slate-200 bg-transparent text-slate-600 hover:bg-slate-50',
        ghost: 'bg-transparent text-slate-500 hover:bg-slate-50'
    };

    const sizes = {
        sm: 'h-9 px-3 text-xs',
        md: 'h-11 px-6 text-sm',
        lg: 'h-14 px-8 text-base'
    };

    return (
        <button
            ref={ref}
            disabled={isLoading || props.disabled}
            className={cn(
                'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-sm',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
