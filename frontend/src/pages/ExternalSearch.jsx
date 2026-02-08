import { useState, useEffect } from 'react';
import { schemeService } from '../api';
import { Search, Loader2, Info, ArrowLeft, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const PREDEFINED_SCHEMES = [
    { gs_no: '3009', name: "Kamran's Baradari" },
    { gs_no: '2765', name: "Changa Manga" },
    { gs_no: '3027', name: "Taxila" },
    { gs_no: '2758', name: "Dharabi Dam" },
    { gs_no: '2741', name: "Bhera" },
    { gs_no: '2764', name: "Lahore Museum" },
    { gs_no: '2763', name: "Jallo" },
    { gs_no: '2737', name: "Dharabi Lake" },
    { gs_no: '2759', name: "Kallar Kahar" },
];

const ExternalSearch = () => {
    const [gsNo, setGsNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [project, setProject] = useState(null);
    const navigate = useNavigate();

    const triggerSearch = async (searchGsNo) => {
        if (!searchGsNo) return;

        setLoading(true);
        setProject(null);
        try {
            const response = await schemeService.getExternalProject(searchGsNo);
            if (response.data && response.data.data && response.data.data.length > 0) {
                setProject(response.data.data[0]);
                toast.success('Project found!');
            } else {
                toast.error('No project found with this GS Number');
            }
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Failed to fetch data from external API');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        triggerSearch(gsNo);
    };

    const handleDropdownSelect = (e) => {
        const selectedGs = e.target.value;
        setGsNo(selectedGs);
        if (selectedGs) {
            triggerSearch(selectedGs);
        }
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '-';
        return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 px-4 sm:px-6 lg:px-8 py-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">CFY Review Dashboard</h1>
                        <p className="text-slate-500 text-sm font-medium">Search project status from government external API</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    {/* Dropdown Selector */}
                    <div className="relative w-full sm:w-64">
                        <select
                            onChange={handleDropdownSelect}
                            value={gsNo}
                            className="w-full appearance-none bg-emerald-50 border border-emerald-200 text-emerald-800 py-2.5 pl-4 pr-10 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                        >
                            <option value="">Quick Select Scheme...</option>
                            {PREDEFINED_SCHEMES.map((scheme) => (
                                <option key={scheme.gs_no} value={scheme.gs_no}>
                                    GS {scheme.gs_no} - {scheme.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-3 text-emerald-600 pointer-events-none" size={18} />
                    </div>

                    {/* Manual Search Input */}
                    <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
                        <input
                            type="text"
                            placeholder="Or Enter GS No. Manual..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all pl-10 text-sm shadow-inner font-medium"
                            value={gsNo}
                            onChange={(e) => setGsNo(e.target.value)}
                        />
                        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                        <button type="submit" disabled={loading} className="sr-only">Search</button>
                    </form>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32">
                    <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Accessing SMDP External Database...</p>
                </div>
            ) : project ? (
                <div className="space-y-4 animate-in slide-in-from-bottom duration-500">
                    {/* Project Title Banner */}
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <div className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/30 backdrop-blur-sm">
                                GS Number {project.gsNo}
                            </div>
                            <div className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/30 backdrop-blur-sm">
                                {project.district}
                            </div>
                        </div>
                        <h2 className="text-xl font-black tracking-tight leading-tight">{project.name}</h2>
                    </div>

                    {/* Financial Review Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1500px]">
                                <thead>
                                    <tr className="bg-slate-100 border-b border-slate-300">
                                        <th className="px-5 py-4 text-[11px] font-black text-slate-700 border-r border-slate-300 text-center whitespace-nowrap bg-slate-200/50">GS No.</th>
                                        <th className="px-5 py-4 text-[11px] font-black text-slate-700 border-r border-slate-300 min-w-[300px]">Name</th>
                                        <th className="px-5 py-4 text-[11px] font-black text-slate-700 border-r border-slate-300 min-w-[120px] text-center">District</th>
                                        <th className="px-5 py-4 text-[11px] font-black text-slate-700 border-r border-slate-300 min-w-[150px]">Approval Status</th>
                                        <th className="px-5 py-4 text-[11px] font-black text-slate-700 border-r border-slate-300 text-right whitespace-nowrap">Cost (M)</th>
                                        <th className="px-5 py-4 text-[11px] font-black text-slate-700 border-r border-slate-300 text-right whitespace-nowrap">Exp Upto June 2025</th>
                                        <th className="px-5 py-4 text-[11px] font-black text-slate-700 border-r border-slate-300 text-right whitespace-nowrap">Actual Expenditure<br />upto June 2025</th>
                                        <th className="px-5 py-4 text-[11px] font-black text-emerald-700 border-r border-slate-300 text-right whitespace-nowrap bg-emerald-100/50">Allocation 2025-26</th>
                                        <th className="px-5 py-4 text-[11px] font-black text-emerald-700 border-r border-slate-300 text-right whitespace-nowrap bg-emerald-100/50">Revised Allocation</th>
                                        <th className="px-5 py-4 text-[11px] font-black text-blue-700 border-r border-slate-300 text-right whitespace-nowrap bg-blue-50/50">Release by P&DD</th>
                                        <th className="px-5 py-4 text-[11px] font-black text-blue-700 border-r border-slate-300 text-right whitespace-nowrap bg-blue-50/50">FD Release</th>
                                        <th className="px-5 py-4 text-[11px] font-black text-blue-700 border-r border-slate-300 text-right whitespace-nowrap bg-blue-50/50">Spending Release</th>
                                        <th className="px-5 py-4 text-[11px] font-black text-orange-700 border-r border-slate-300 text-right whitespace-nowrap bg-orange-100/50">Utilization (M)</th>
                                        <th className="px-5 py-4 text-[11px] font-black text-orange-700 border-r border-slate-300 text-center whitespace-nowrap bg-orange-100/50">% Util. FD</th>
                                        <th className="px-5 py-4 text-[11px] font-black text-orange-700 border-r border-slate-300 text-center whitespace-nowrap bg-orange-100/50">% Util. Rev. Alloc.</th>
                                        <th className="px-5 py-4 text-[11px] font-black text-slate-700 text-right whitespace-nowrap bg-slate-100/50">Total Throw Forward</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="px-5 py-6 text-sm font-black text-slate-800 border-r border-slate-100 text-center bg-slate-50/30">{project.gsNo}</td>
                                        <td className="px-5 py-6 border-r border-slate-100 text-sm font-black text-slate-800 leading-snug">{project.name}</td>
                                        <td className="px-5 py-6 border-r border-slate-100 text-center">
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-widest">{project.district}</span>
                                        </td>
                                        <td className="px-5 py-6 text-[11px] font-bold text-slate-600 border-r border-slate-100 leading-relaxed max-w-[150px]">{project.approvalStatus}</td>
                                        <td className="px-5 py-6 text-sm font-bold text-slate-800 border-r border-slate-100 text-right">{formatCurrency(project.estimatedCost)}</td>
                                        <td className="px-5 py-6 text-sm font-semibold text-slate-500 border-r border-slate-100 text-right">{formatCurrency(project.expUpToJune)}</td>
                                        <td className="px-5 py-6 text-sm font-semibold text-slate-500 border-r border-slate-100 text-right">{formatCurrency(project.actExpUpTo)}</td>
                                        <td className="px-5 py-6 text-sm font-black text-emerald-700 border-r border-slate-100 text-right bg-emerald-50/20">{formatCurrency(project.allocation)}</td>
                                        <td className="px-5 py-6 text-sm font-black text-emerald-700 border-r border-slate-100 text-right bg-emerald-50/20">{formatCurrency(project.revisedAllocation)}</td>
                                        <td className="px-5 py-6 text-sm font-bold text-blue-700 border-r border-slate-100 text-right bg-blue-50/10">{formatCurrency(project.releaseByPD)}</td>
                                        <td className="px-5 py-6 text-sm font-bold text-blue-700 border-r border-slate-100 text-right bg-blue-50/10">{formatCurrency(project.financeReleaseFD)}</td>
                                        <td className="px-5 py-6 text-sm font-bold text-blue-700 border-r border-slate-100 text-right bg-blue-50/10">{formatCurrency(project.financeReleasePifra)}</td>
                                        <td className="px-5 py-6 text-sm font-black text-orange-700 border-r border-slate-100 text-right bg-orange-50/20">{formatCurrency(project.utilication)}</td>
                                        <td className="px-5 py-6 text-center border-r border-slate-100 bg-orange-50/20">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-12 bg-orange-100 rounded-full h-1 overflow-hidden">
                                                    <div className="bg-orange-600 h-full" style={{ width: `${Math.min(project.utilicationPercent, 100)}%` }}></div>
                                                </div>
                                                <span className="text-[10px] font-black text-orange-700">{project.utilicationPercent}%</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-6 text-center border-r border-slate-100 bg-orange-50/20">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-12 bg-orange-100 rounded-full h-1 overflow-hidden">
                                                    <div className="bg-orange-600 h-full" style={{ width: `${Math.min(project.utilicationPercentGrade, 100)}%` }}></div>
                                                </div>
                                                <span className="text-[10px] font-black text-orange-700">{project.utilicationPercentGrade}%</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-6 text-sm font-black text-slate-800 text-right bg-slate-50/30">{formatCurrency(project.totalThrowForward)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest pl-2">
                        <Info size={12} />
                        Government of Punjab • Finance & Planning Data Review • Last Sync: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 mx-auto max-w-2xl space-y-4 shadow-sm border-spacing-4">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                        <Search size={48} className="text-slate-300" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-black text-slate-800 leading-tight">Project Status Lookup</h3>
                        <p className="text-slate-500 text-sm font-medium px-8 leading-relaxed">Select a project from the dropdown or manually enter a GS number to fetch real-time financial tracking data from the SMDP API.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExternalSearch;
