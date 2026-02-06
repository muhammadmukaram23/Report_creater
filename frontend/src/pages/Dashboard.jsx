import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { schemeService } from '../api';
import { Plus, Calendar, Activity, ChevronRight, FolderOpen, Loader2, FileText, Trash2, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import punjabLogo from '../assets/punjab_logo.png';

const INITIAL_SCHEME_STATE = {
    gs_no: '',
    sr_no: '',
    name_of_scheme: '',
    physical_progress: 0,
    total_allocation: 0,
    funds_released: 0,
    committed_fund_utilization: 0,
    labour_deployed: 0,
    remarks: ''
};

const Dashboard = () => {
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newScheme, setNewScheme] = useState(INITIAL_SCHEME_STATE);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterScheme, setFilterScheme] = useState('');
    const [allSchemeNames, setAllSchemeNames] = useState([]);

    useEffect(() => {
        const fetchAllSchemeNames = async () => {
            try {
                const response = await schemeService.getAll();
                const names = [...new Set(response.data.map(s => s.name_of_scheme))].filter(Boolean);
                setAllSchemeNames(names);
            } catch (error) {
                console.error('Failed to fetch scheme names for dropdown:', error);
            }
        };
        fetchAllSchemeNames();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSchemes();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, filterScheme]);

    const fetchSchemes = async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchTerm) params.name = searchTerm;
            if (filterScheme) params.name = filterScheme;

            const response = await schemeService.getAll(params);
            setSchemes(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('❌ Error fetching schemes:', error);
            toast.error('Failed to fetch schemes');
            setSchemes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await schemeService.create(newScheme);
            toast.success('Scheme created successfully');
            setNewScheme(INITIAL_SCHEME_STATE);
            setShowModal(false);
            setSearchTerm('');
            setFilterScheme('');
            fetchSchemes();
        } catch (error) {
            toast.error('Error creating scheme');
        }
    };

    const handleDeleteScheme = async (e, gs_no) => {
        e.preventDefault();
        e.stopPropagation();

        // Auth Check
        const code = window.prompt("Enter authorization code to delete this scheme:");
        if (code === null) return; // User cancelled

        if (code !== '9022b9ac') {
            toast.error('Invalid authorization code! Deletion denied.');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this WHOLE scheme? This will delete all components and images forever.')) return;

        try {
            await schemeService.delete(gs_no);
            toast.success('Scheme and all its data deleted');
            fetchSchemes();
        } catch (error) {
            toast.error('Failed to delete scheme');
            console.error(error);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 px-4 sm:px-6 lg:px-8 py-6">
            <Toaster position="top-right" />

            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <img src={punjabLogo} alt="Punjab Government Logo" className="w-16 h-auto" />
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Project Dashboard</h1>
                        <p className="text-slate-600 mt-1">Manage and track all development schemes</p>
                    </div>
                </div>

                <div className="bg-white/80 p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                        {/* Search and Filter Section */}
                        <div className="flex flex-col sm:flex-row gap-3 flex-1 min-w-0">
                            <div className="relative flex-1 min-w-[200px]">
                                <input
                                    type="text"
                                    placeholder="Search by name or GS #..."
                                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-blue-500 transition-all pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <FolderOpen size={18} className="absolute left-3 top-3.5 text-slate-400" />
                            </div>

                            <select
                                className="bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-700 outline-none focus:border-blue-500 transition-all min-w-[180px] cursor-pointer"
                                value={filterScheme}
                                onChange={(e) => setFilterScheme(e.target.value)}
                                style={{
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none',
                                    appearance: 'none',
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 1rem center',
                                    paddingRight: '2.5rem'
                                }}
                            >
                                <option value="">All Schemes</option>
                                {allSchemeNames.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Action Buttons Section */}
                        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
                            <a
                                href="/api/reports/all/pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glass-morphism flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-xl font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 transition-all text-sm whitespace-nowrap"
                            >
                                <FileText size={18} className="text-blue-500" />
                                <span className="hidden lg:inline">Download PDF</span>
                                <span className="lg:hidden">PDF Report</span>
                            </a>
                            <button
                                onClick={() => setShowModal(true)}
                                className="btn-premium flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/20 whitespace-nowrap"
                            >
                                <Plus size={20} />
                                New Scheme
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p>Loading projects...</p>
                </div>
            ) : schemes.length === 0 ? (
                <div className="glass-card rounded-3xl p-12 text-center space-y-4">
                    <div className="bg-slate-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto border border-slate-200">
                        <FolderOpen className="text-slate-400 w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">No Schemes Found</h3>
                    <p className="text-slate-600 max-w-xs mx-auto">Get started by creating your first construction or development scheme.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {schemes.map((scheme) => (
                        <Link
                            key={scheme.gs_no}
                            to={`/scheme/${scheme.gs_no}`}
                            className="glass-card rounded-2xl p-6 group hover:border-emerald-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                                    <Activity className="text-emerald-600 w-6 h-6" />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                        GS #{scheme.gs_no}
                                    </span>
                                    <button
                                        onClick={(e) => handleDeleteScheme(e, scheme.gs_no)}
                                        className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 line-clamp-2 mb-3 group-hover:text-emerald-600 transition-colors min-h-[3.5rem]">
                                {scheme.name_of_scheme || 'Untitled Scheme'}
                            </h3>

                            <div className="space-y-3 mb-6">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-600 uppercase tracking-wider font-bold">Physical Progress</span>
                                        <span className="text-emerald-600 font-bold">{scheme.physical_progress || 0}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-300"
                                            style={{ width: `${scheme.physical_progress || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-200 group-hover:border-emerald-300">
                                <span className="text-sm text-slate-600">
                                    {scheme.labour_deployed || 0} Labourers
                                </span>
                                <div className="flex items-center text-emerald-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Details
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* New Scheme Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="glass-card w-full max-w-2xl rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto relative">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Create New Scheme</h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setNewScheme(INITIAL_SCHEME_STATE);
                                }}
                                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700 ml-1">GS Number *</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full input-glass rounded-xl px-4 py-3 text-slate-700 outline-none"
                                    placeholder="e.g. 1001"
                                    value={newScheme.gs_no}
                                    onChange={(e) => setNewScheme({ ...newScheme, gs_no: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Serial Number</label>
                                <input
                                    type="number"
                                    className="w-full input-glass rounded-xl px-4 py-3 text-slate-700 outline-none"
                                    placeholder="e.g. 1"
                                    value={newScheme.sr_no}
                                    onChange={(e) => setNewScheme({ ...newScheme, sr_no: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Scheme Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full input-glass rounded-xl px-4 py-3 text-slate-700 outline-none"
                                    placeholder="Enter full name of the scheme"
                                    value={newScheme.name_of_scheme}
                                    onChange={(e) => setNewScheme({ ...newScheme, name_of_scheme: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Physical Progress (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full input-glass rounded-xl px-4 py-3 text-slate-700 outline-none"
                                    value={newScheme.physical_progress}
                                    onChange={(e) => setNewScheme({ ...newScheme, physical_progress: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Total Allocation</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full input-glass rounded-xl px-4 py-3 text-slate-700 outline-none"
                                    value={newScheme.total_allocation}
                                    onChange={(e) => setNewScheme({ ...newScheme, total_allocation: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Funds Released</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full input-glass rounded-xl px-4 py-3 text-slate-700 outline-none"
                                    value={newScheme.funds_released}
                                    onChange={(e) => setNewScheme({ ...newScheme, funds_released: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Fund Utilization</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full input-glass rounded-xl px-4 py-3 text-slate-700 outline-none"
                                    value={newScheme.committed_fund_utilization}
                                    onChange={(e) => setNewScheme({ ...newScheme, committed_fund_utilization: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Labour Deployed</label>
                                <input
                                    type="number"
                                    className="w-full input-glass rounded-xl px-4 py-3 text-slate-700 outline-none"
                                    value={newScheme.labour_deployed}
                                    onChange={(e) => setNewScheme({ ...newScheme, labour_deployed: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Remarks</label>
                                <p className="text-xs text-slate-500 ml-1 mb-1">Add detailed notes, observations, or comments about this scheme</p>
                                <textarea
                                    className="w-full input-glass rounded-xl px-4 py-4 text-slate-700 outline-none min-h-[140px] resize-y"
                                    placeholder="Enter remarks, observations, or important notes about this scheme..."
                                    value={newScheme.remarks}
                                    onChange={(e) => setNewScheme({ ...newScheme, remarks: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setNewScheme(INITIAL_SCHEME_STATE);
                                    }}
                                    className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-premium px-8 py-3 rounded-xl font-semibold text-white shadow-lg"
                                >
                                    Create Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
