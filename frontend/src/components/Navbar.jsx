import { Link, useNavigate } from 'react-router-dom';
import { Home, FileText, LogOut } from 'lucide-react';
import punjabLogo from '../assets/punjab_logo.png';

const Navbar = () => {
    const navigate = useNavigate();
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    return (
        <nav className="glass-morphism sticky top-0 z-50 border-b border-slate-200 px-4 sm:px-6 py-4 shadow-sm">
            <div className="container mx-auto flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 group">
                    <img src={punjabLogo} alt="Logo" className="w-10 h-auto group-hover:scale-105 transition-transform" />
                    <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-700">
                        Report Pro
                    </span>
                </Link>

                {isAuthenticated && (
                    <>
                        <div className="hidden md:flex items-center gap-8">
                            <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors font-medium">
                                <Home size={18} />
                                Dashboard
                            </Link>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-6">
                            <div className="hidden sm:flex flex-col items-end">
                                <p className="text-sm font-semibold text-slate-700 leading-none">Admin User</p>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Super Admin</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group"
                                title="Logout"
                            >
                                <LogOut size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
