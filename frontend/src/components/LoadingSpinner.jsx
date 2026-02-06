import React from 'react';
import punjabLogo from '../assets/punjab_logo.png';

const LoadingSpinner = ({ message = "Loading state-of-the-art reports..." }) => {
    return (
        <div className="flex flex-col items-center justify-center p-12 sm:p-20 animate-in fade-in duration-700">
            <div className="relative group">
                {/* Outer pulsing ring */}
                <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/30 transition-all duration-1000 animate-pulse"></div>

                {/* Rotating border */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin transition-all duration-300"></div>

                {/* Center logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <img
                        src={punjabLogo}
                        alt="Punjab Logo"
                        className="w-12 h-12 sm:w-16 sm:h-16 object-contain animate-pulse"
                    />
                </div>
            </div>

            {/* Loading text */}
            <div className="mt-8 text-center space-y-2">
                <p className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">{message}</p>
                <div className="flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
                </div>
            </div>
        </div>
    );
};

export default LoadingSpinner;
