import { Link, useNavigate } from 'react-router-dom';
import { Home, FileText, LogOut } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        navigate('/login');
    };

    return (
        <nav className="glass-morphism sticky top-0 z-50 border-b border-white/10 px-6 py-4">
            <div className="container mx-auto flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="p-2 btn-premium rounded-lg group-hover:scale-110 transition-transform">
                        <FileText className="text-white w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        ReportPro
                    </span>
                </Link>

                {isAuthenticated && (
                    <>
                        <div className="hidden md:flex items-center gap-8">
                            <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors">
                                <Home size={18} />
                                Dashboard
                            </Link>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="hidden sm:flex flex-col items-end">
                                <p className="text-sm font-medium text-slate-200 leading-none">Admin User</p>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Super Admin</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all group"
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
