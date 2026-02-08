import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, FileText, LogOut, Activity, Menu, X } from 'lucide-react';
import punjabLogo from '../assets/punjab_logo.png';

const Navbar = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
        setIsMenuOpen(false);
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const NavLinks = ({ mobile = false }) => (
        <>
            <Link
                to="/"
                className={`flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors font-medium ${mobile ? 'py-4 border-b border-slate-100' : ''}`}
                onClick={() => mobile && setIsMenuOpen(false)}
            >
                <Home size={18} />
                Dashboard Add reports.
            </Link>
            <Link
                to="/external-search"
                className={`flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors font-medium ${mobile ? 'py-4 border-b border-slate-100' : ''}`}
                onClick={() => mobile && setIsMenuOpen(false)}
            >
                <FileText size={18} />
                SMDP Data
            </Link>
            <Link
                to="/project-overview"
                className={`flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors font-medium ${mobile ? 'py-4 border-b border-slate-100' : ''}`}
                onClick={() => mobile && setIsMenuOpen(false)}
            >
                <Activity size={18} />
                Project Components+SubComponent Info
            </Link>
            <Link
                to="/reports"
                className={`flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors font-medium ${mobile ? 'py-4' : ''}`}
                onClick={() => mobile && setIsMenuOpen(false)}
            >
                <FileText size={18} />
                Site Reports
            </Link>
        </>
    );

    return (
        <nav className="glass-morphism sticky top-0 z-50 border-b border-slate-200 px-4 sm:px-6 py-4 shadow-sm bg-white/80">
            <div className="container mx-auto flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3 group z-50">
                    <img src={punjabLogo} alt="Logo" className="w-10 h-auto group-hover:scale-105 transition-transform" />
                    <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-700">
                        Report Pro
                    </span>
                </Link>

                {isAuthenticated && (
                    <>
                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            <NavLinks />
                        </div>

                        <div className="flex items-center gap-3 sm:gap-6">
                            <div className="hidden sm:flex flex-col items-end">
                                <p className="text-sm font-semibold text-slate-700 leading-none">Admin User</p>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Super Admin</p>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="hidden md:flex p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group"
                                title="Logout"
                            >
                                <LogOut size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                            </button>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={toggleMenu}
                                className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all z-50"
                            >
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>

                        {/* Mobile Navigation Dropdown */}
                        <div
                            className={`absolute top-0 left-0 w-full bg-white shadow-2xl border-b border-slate-200 transition-all duration-300 ease-in-out z-40 md:hidden ${isMenuOpen ? 'translate-y-0 opacity-100 visible' : '-translate-y-full opacity-0 invisible'
                                }`}
                            style={{ paddingTop: '80px' }}
                        >
                            <div className="p-6 flex flex-col gap-2">
                                <NavLinks mobile={true} />
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-red-600 font-bold py-4 mt-2"
                                >
                                    <LogOut size={18} />
                                    Logout Session
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
