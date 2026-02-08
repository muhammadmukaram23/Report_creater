import { useState, useEffect } from 'react';
import { schemeService } from '../api';
import {
    ChevronDown, ChevronRight, Activity, Calendar,
    DollarSign, BarChart3, Clock, LayoutGrid,
    Layers, Milestone, Info, ArrowLeft,
    CheckCircle2, AlertCircle, Search
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

const ProjectOverview = () => {
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const navigate = useNavigate();

    const fetchData = async (id) => {
        if (!id) return;
        setLoading(true);
        try {
            const [structureRes, detailsRes] = await Promise.all([
                schemeService.getProjectStructure(id),
                schemeService.getProjectDetails(id)
            ]);

            // Combine both data sets
            setData({
                ...structureRes.data,
                details: detailsRes.data
            });

            toast.success('Project intelligence synchronized');
        } catch (error) {
            console.error('Error fetching project data:', error);
            toast.error('Failed to load project metrics');
        } finally {
            setLoading(false);
        }
    };

    const handleProjectSelect = (e) => {
        const id = e.target.value;
        setSelectedProjectId(id);
        fetchData(id);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return '0';
        return amount.toLocaleString();
    };

    const ProgressCircle = ({ percent, size = "md" }) => {
        let radius, stroke, fontSize;
        switch (size) {
            case 'xl': radius = 48; stroke = 6; fontSize = 'text-lg'; break;
            case 'lg': radius = 32; stroke = 5; fontSize = 'text-sm'; break;
            case 'md': radius = 24; stroke = 4; fontSize = 'text-xs'; break;
            default: radius = 18; stroke = 3; fontSize = 'text-[10px]'; break;
        }

        const normalizedRadius = radius - stroke * 2;
        const circumference = normalizedRadius * 2 * Math.PI;
        const strokeDashoffset = circumference - (percent / 100) * circumference;

        return (
            <div className={`relative flex items-center justify-center shrink-0`}>
                <svg
                    height={radius * 2}
                    width={radius * 2}
                    className="transform -rotate-90"
                >
                    <circle
                        stroke="rgba(16, 185, 129, 0.1)"
                        fill="transparent"
                        strokeWidth={stroke}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    <circle
                        stroke="#10b981"
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset }}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>
                <span className={`absolute ${fontSize} font-black text-emerald-300`}>
                    {Math.round(percent)}%
                </span>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Navigation & Selector Header */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-5 w-full md:w-auto">
                    <button onClick={() => navigate('/')} className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all border border-transparent hover:border-slate-200">
                        <ArrowLeft size={22} />
                    </button>
                    <div className="space-y-0.5">
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Project Overview</h1>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            Tourism & Cultural Heritage • Real-time Monitoring
                        </p>
                    </div>
                </div>

                <div className="relative w-full md:w-80 group">
                    <select
                        onChange={handleProjectSelect}
                        value={selectedProjectId}
                        className="w-full appearance-none bg-slate-50 border-2 border-slate-100 hover:border-emerald-200 text-slate-700 py-3.5 pl-11 pr-10 rounded-2xl font-black text-sm outline-none transition-all cursor-pointer shadow-inner"
                    >
                        <option value="">Select Project to Review...</option>
                        {TOURISM_PROJECTS.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <Layers className="absolute left-4 top-4 text-slate-400 group-hover:text-emerald-500 transition-colors" size={20} />
                    <ChevronDown className="absolute right-4 top-4 text-slate-400 pointer-events-none" size={20} />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-4">
                    <div className="w-14 h-14 border-b-4 border-emerald-600 rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Synchronizing Project Data</p>
                </div>
            ) : data ? (
                <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
                    {/* Project Status Banner */}
                    <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-10 md:p-14 text-white shadow-2xl">
                        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"></div>
                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            <div className="lg:col-span-12 space-y-10">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                                    <div className="space-y-6">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                                            <Activity size={14} className="text-emerald-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Tracker: {data.details?.trackerStatus || 'Active'}</span>
                                        </div>
                                        <h2 className="text-5xl sm:text-7xl font-black tracking-tighter leading-none italic">{data.project.name}</h2>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] p-10 border border-white/20 flex items-center gap-10 shadow-2xl relative overflow-hidden group hover:bg-white/10 transition-all duration-500">
                                        <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-emerald-500/30 blur-3xl rounded-full scale-150"></div>
                                            <ProgressCircle percent={data.details?.avgPhysicalWorkPercent || data.project.progressPercent} size="xl" />
                                        </div>
                                        <div className="space-y-1 relative z-10">
                                            <p className="text-white text-5xl font-black tracking-tighter italic leading-none">
                                                {Math.round(data.details?.avgPhysicalWorkPercent || data.project.progressPercent)}%
                                            </p>
                                            <p className="text-emerald-400 text-xl font-black tracking-tighter uppercase italic">Avg. Progress</p>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">Aggregate Physical Work</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-4">
                                    <div className="space-y-1 group">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.15em] group-hover:text-emerald-400 transition-colors">Approved Cost</p>
                                        <div className="flex items-center gap-2 text-xl font-black text-white tracking-tight">
                                            <DollarSign size={20} className="text-emerald-500" />
                                            {formatCurrency(data.details?.approvedCost)}
                                        </div>
                                    </div>
                                    <div className="space-y-1 group">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.15em] group-hover:text-emerald-400 transition-colors">Approved Budget</p>
                                        <div className="flex items-center gap-2 text-xl font-black text-white tracking-tight">
                                            <DollarSign size={20} className="text-emerald-500" />
                                            {formatCurrency(data.details?.approvedBudget)}
                                        </div>
                                    </div>
                                    <div className="space-y-1 group">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.15em] group-hover:text-emerald-400 transition-colors">Total Released</p>
                                        <div className="flex items-center gap-2 text-xl font-black text-emerald-400 tracking-tight">
                                            <CheckCircle2 size={20} />
                                            {formatCurrency(data.details?.totalReleased)}
                                        </div>
                                    </div>
                                    <div className="space-y-1 group">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.15em] group-hover:text-emerald-400 transition-colors">Actual Spend</p>
                                        <div className="flex items-center gap-2 text-xl font-black text-emerald-400 tracking-tight">
                                            <BarChart3 size={20} />
                                            {formatCurrency(data.details?.actualSpendPKR)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Approved Budget Used', val: `${data.details?.approvedBudgetUsedPercent || 0}%`, icon: BarChart3, color: 'blue' },
                            { label: 'Released Budget Used', val: `${data.details?.releasedBudgetUsedPercent || 0}%`, icon: CheckCircle2, color: 'emerald' },
                            { label: 'Utilization', val: `${data.details?.utilizationPercent || 0}%`, icon: Activity, color: 'purple' },
                            { label: 'Execution', val: `${data.details?.avgPhysicalWorkPercent || 0}%`, icon: Milestone, color: 'orange' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-all">
                                <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                                    <stat.icon size={22} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-2xl font-black text-slate-800 tracking-tighter italic">{stat.val}</p>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Structure Table */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
                                <LayoutGrid className="text-emerald-600" size={22} />
                                Project Structure Hierarchy
                            </h3>
                            <span className="px-3 py-1 bg-white text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] border border-slate-200 rounded-lg">
                                Drill Down Analysis
                            </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {data.components.map((comp) => (
                                <div key={comp.id} className="p-0">
                                    <div className="p-8 hover:bg-slate-50/80 transition-all group flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div className="flex gap-5">
                                            <div className="mt-1 p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                <LayoutGrid size={20} />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-lg font-black text-slate-800 tracking-tight leading-snug">{comp.name}</h4>
                                                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5"><Calendar size={12} className="text-emerald-500" /> {formatDate(comp.startDate)} - {formatDate(comp.endDate)}</span>
                                                    <span className="flex items-center gap-1.5"><DollarSign size={13} className="text-emerald-500" /> PKR {formatCurrency(comp.cost)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8 pl-12 md:pl-0">
                                            <div className="text-right space-y-0.5">
                                                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Spent</p>
                                                <p className="text-sm font-black text-slate-700">PKR {formatCurrency(comp.totalSpent)}</p>
                                            </div>
                                            <ProgressCircle percent={comp.progressPercent} size="md" />
                                        </div>
                                    </div>

                                    {/* Sub-components & Milestones Container */}
                                    <div className="bg-slate-50/30 px-8 pb-10">
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                            {/* Sub-components Column */}
                                            <div className="lg:col-span-12 space-y-4">
                                                {data.subComponents
                                                    .filter(sub => sub.componentId === comp.id)
                                                    .map(sub => (
                                                        <div key={sub.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in duration-300">
                                                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/20">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                                                                        <Layers size={16} />
                                                                    </div>
                                                                    <h5 className="font-black text-slate-800 text-sm tracking-tight">{sub.name}</h5>
                                                                </div>
                                                                <div className="flex items-center gap-6">
                                                                    <div className="text-right">
                                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Allocated</p>
                                                                        <p className="text-xs font-black text-blue-600 italic">PKR {formatCurrency(sub.totalSpent)}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-black text-blue-700">{sub.progressPercent}%</span>
                                                                        <div className="w-16 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                                                            <div className="bg-blue-600 h-full" style={{ width: `${sub.progressPercent}%` }}></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Milestones nesting */}
                                                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                {data.milestones
                                                                    .filter(m => m.subComponentId === sub.id)
                                                                    .map(m => (
                                                                        <div key={m.id} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-200 group hover:border-emerald-300 hover:bg-white hover:shadow-lg transition-all">
                                                                            <div className="flex justify-between items-start mb-4">
                                                                                <Milestone size={18} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                                                                {m.status === 'COMPLETED' ? (
                                                                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
                                                                                        <CheckCircle2 size={12} /> Completed
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">
                                                                                        <Clock size={12} /> In Progress
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <h6 className="text-sm font-black text-slate-800 leading-snug mb-4 italic">{m.name}</h6>
                                                                            <div className="space-y-3">
                                                                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                                                                                    <span>Execution Progress</span>
                                                                                    <span>{m.progressPercent}%</span>
                                                                                </div>
                                                                                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                                                                    <div className="bg-emerald-500 h-full" style={{ width: `${m.progressPercent}%` }}></div>
                                                                                </div>
                                                                                <div className="flex justify-between items-start pt-2 border-t border-slate-100">
                                                                                    <div className="space-y-1.5 font-sans">
                                                                                        <div>
                                                                                            <span className="text-[10px] block text-slate-400 uppercase font-black">Budget Allocation</span>
                                                                                            <span className="text-sm font-black text-blue-600 block">PKR {formatCurrency(m.budgetAmount)}</span>
                                                                                        </div>
                                                                                        <div>
                                                                                            <span className="text-[10px] block text-slate-400 uppercase font-black">Actual Spent</span>
                                                                                            <span className="text-sm font-black text-slate-800">PKR {formatCurrency(m.amountSpent)}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="space-y-1 text-right font-sans">
                                                                                        <span className="text-[10px] block text-slate-400 uppercase font-black">Target Date</span>
                                                                                        <span className="text-xs font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg inline-block whitespace-nowrap">{formatDate(m.endDate)}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-40 animate-in fade-in zoom-in duration-500">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-emerald-100 blur-3xl rounded-full opacity-50"></div>
                        <div className="relative p-8 bg-white rounded-full border border-slate-100 shadow-xl">
                            <Activity size={60} className="text-emerald-100" />
                            <Search size={24} className="absolute bottom-2 right-2 text-emerald-500" />
                        </div>
                    </div>
                    <div className="text-center max-w-sm space-y-4">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic">Analytical Project Review</h2>
                        <p className="text-slate-500 text-sm font-bold leading-relaxed">
                            Discover comprehensive project structures, monitor real-time progression, and analyze cross-level financial metrics by selecting a project above.
                        </p>
                        <div className="pt-4 flex justify-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectOverview;
