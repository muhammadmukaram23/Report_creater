import { useState, useEffect } from 'react';
import { schemeService } from '../api';
import {
    FileText, Search, Filter, Calendar,
    MapPin, User, ArrowRight, Activity,
    CloudSun, ChevronRight, LayoutGrid
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TOURISM_PROJECTS = [
    { id: '156fe7e8-0776-44f1-a4dd-b4c9db4d602f', name: "Bhera" },
    { id: '7c828f9f-8fc3-4e04-b5fc-e6b04faad434', name: "Taxila" },
    { id: '6b425936-ce50-43e3-a028-13e7e11cb7ac', name: "Lahore Museum" },
    { id: '489e2c36-41f8-4365-ba03-1bb91796fa66', name: "Dharabi Dam" },
    { id: '0e213372-3229-4972-a26c-25fdfe27c83a', name: "Changa Manga" },
    { id: '02330710-f43a-4375-8337-4396722c703c', name: "Jallo" },
    { id: '1e6356b7-0521-40d5-b669-5eafdb396096', name: "Kamran's Baradari" },
    { id: '6ffe24db-b2a0-42a6-937d-0224f65a1763', name: "Dharabi Lake" },
    { id: 'a25ea9aa-4e99-49ad-892f-04278c414ff8', name: "Kallar Kahar" },
];

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await schemeService.getReports();
            setReports(response.data);
            setFilteredReports(response.data);
        } catch (error) {
            console.error('Error fetching reports:', error);
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let result = [...reports];

        // Sort by date descending (latest first)
        result.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (selectedProject !== 'all') {
            result = result.filter(r => r.site?.projectId === selectedProject);
        }

        if (searchQuery) {
            result = result.filter(r =>
                (r.reportNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.projectName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.contractorName || "").toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredReports(result);
    }, [selectedProject, searchQuery, reports]);

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"></div>
                <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <FileText size={14} className="text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Project Execution Logs</span>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic">Site Reports</h1>
                            <p className="text-slate-400 font-bold text-sm mt-2">Daily Progress Reports • Environmental Data • Execution Milestones</p>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                            <div className="text-right">
                                <p className="text-emerald-400 text-2xl font-black tracking-tighter italic">{filteredReports.length}</p>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Active Logs Found</p>
                            </div>
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                                <Activity size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200 shadow-lg flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search logs by report #, contractor, or project name..."
                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-200 py-3 pl-12 pr-4 rounded-2xl outline-none text-sm font-bold text-slate-700 transition-all shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <div className="relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-500" size={18} />
                        <select
                            className="bg-slate-50 border-2 border-slate-100 hover:border-emerald-200 py-3 pl-11 pr-10 rounded-2xl outline-none text-sm font-black text-slate-700 appearance-none cursor-pointer transition-all shadow-inner"
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                        >
                            <option value="all">All Tourism Projects</option>
                            {TOURISM_PROJECTS.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={16} />
                    </div>
                    <button
                        onClick={fetchReports}
                        className="p-3.5 bg-slate-900 text-white rounded-2xl hover:bg-emerald-600 transition-colors shadow-lg active:scale-95"
                    >
                        <Activity size={20} />
                    </button>
                </div>
            </div>

            {/* Reports List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-4">
                    <div className="w-14 h-14 border-b-4 border-emerald-600 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Retrieving Execution Ledger</p>
                </div>
            ) : filteredReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReports.map((report, idx) => (
                        <div
                            key={report.id}
                            onClick={() => navigate(`/reports/${report.id}`)}
                            className="group relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:border-emerald-200 transition-all duration-500 cursor-pointer overflow-hidden animate-in slide-in-from-bottom-6"
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            <div className="p-6 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                                        <FileText size={24} />
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        {idx === 0 && searchQuery === '' && selectedProject === 'all' && (
                                            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase rounded-md shadow-sm animate-pulse">Latest</span>
                                        )}
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reference</p>
                                            <p className="text-sm font-black text-slate-800 tracking-tight">{report.reportNumber}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 leading-tight tracking-tight group-hover:text-emerald-700 transition-colors">
                                            {report.projectName}
                                        </h3>
                                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mt-1.5 uppercase tracking-wider">
                                            <MapPin size={12} className="text-emerald-500" />
                                            {report.site?.location || report.projectName}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-50/50 transition-colors">
                                            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-400 mb-1">Status Date</p>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-700">
                                                <Calendar size={12} className="text-emerald-500" />
                                                {formatDate(report.date)}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-50/50 transition-colors">
                                            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-400 mb-1">Weather</p>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-700 uppercase">
                                                <CloudSun size={12} className="text-emerald-500" />
                                                {report.weather[0] || 'Unknown'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-[10px] font-black text-white italic">
                                            {report.createdBy?.firstName?.[0] || 'A'}
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Observer</p>
                                            <p className="text-[10px] font-bold text-slate-700 italic">{report.createdBy?.firstName || 'Admin'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all">
                                        Open Details <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-40 animate-in fade-in zoom-in duration-500">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-emerald-100 blur-3xl rounded-full opacity-50"></div>
                        <div className="relative p-8 bg-white rounded-full border border-slate-100 shadow-xl">
                            <LayoutGrid size={60} className="text-emerald-100" />
                            <Search size={24} className="absolute bottom-2 right-2 text-emerald-500" />
                        </div>
                    </div>
                    <div className="text-center max-w-sm space-y-4">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic">No Logs Found</h2>
                        <p className="text-slate-500 text-sm font-bold leading-relaxed">
                            No site reports were found matching your current filter. Try selecting a different project or adjusting your search criteria.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
