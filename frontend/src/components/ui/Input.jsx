import React from 'react';
import { cn } from '../../utils/cn';

const Input = React.forwardRef(({
    className,
    icon: Icon,
    error,
    type = 'text',
    rightElement,
    ...props
}, ref) => {
    return (
        <div className="w-full space-y-1">
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <Icon size={18} strokeWidth={2} />
                    </div>
                )}

                <input
                    type={type}
                    ref={ref}
                    className={cn(
                        'w-full bg-white text-slate-800 rounded-xl px-4 py-3 border transition-all duration-200 outline-none placeholder:text-slate-400',
                        Icon ? 'pl-11' : '',
                        rightElement ? 'pr-11' : '',
                        error
                            ? 'border-red-500 bg-red-50/10 focus:ring-4 focus:ring-red-500/10'
                            : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5',
                        className
                    )}
                    {...props}
                />

                {rightElement && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {rightElement}
                    </div>
                )}
            </div>

            {error && (
                <p className="text-xs font-medium text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
