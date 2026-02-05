import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Simulated hardcoded authentication
        setTimeout(() => {
            if (credentials.username === 'admin' && credentials.password === 'admin123') {
                localStorage.setItem('isAuthenticated', 'true');
                toast.success('Login successful!');
                navigate('/');
            } else {
                toast.error('Invalid username or password');
            }
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md rounded-[2.5rem] p-10 space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                        <Lock className="text-blue-400 w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-white leading-tight">Welcome Back</h1>
                    <p className="text-slate-500">Sign in to manage your reports</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 ml-1">Username</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                            <input
                                type="text"
                                name="username"
                                required
                                value={credentials.username}
                                onChange={handleChange}
                                className="w-full input-glass rounded-2xl pl-12 pr-5 py-4 text-slate-200 outline-none focus:ring-2 ring-blue-500/20 transition-all"
                                placeholder="Enter username"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                            <input
                                type="password"
                                name="password"
                                required
                                value={credentials.password}
                                onChange={handleChange}
                                className="w-full input-glass rounded-2xl pl-12 pr-5 py-4 text-slate-200 outline-none focus:ring-2 ring-blue-500/20 transition-all"
                                placeholder="Enter password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-premium py-4 rounded-2xl font-bold text-white shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                    </button>

                    <div className="text-center">
                        <p className="text-xs text-slate-600">
                            Managed Security Protocol Enabled
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
