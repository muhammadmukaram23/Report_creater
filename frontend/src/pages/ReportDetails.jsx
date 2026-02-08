import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { schemeService } from '../api';
import {
    ArrowLeft, Calendar, MapPin, CloudSun,
    Activity, CheckCircle2, Clock, Image as ImageIcon,
    User, HardHat, Construction, Info,
    ChevronRight, ExternalLink, Globe, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const ReportDetails = () => {
    const { reportId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchDetails();
    }, [reportId]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const response = await schemeService.getReportDetails(reportId);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching report details:', error);
            toast.error('Failed to load report details');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 space-y-4">
                <div className="w-14 h-14 border-b-4 border-emerald-600 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Decompressing Report Detail</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-20">
            {/* Header / Navigation */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-5 w-full md:w-auto">
                    <button onClick={() => navigate('/reports')} className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all border border-transparent hover:border-slate-200 active:scale-90">
                        <ArrowLeft size={22} />
                    </button>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight italic">{data.reportNumber}</h1>
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-lg border border-emerald-100">Live Ledger</span>
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            {data.projectName} • {data.site?.name || 'Main Site'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="flex-1 md:flex-none p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center md:text-left">
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Created At</p>
                        <p className="text-xs font-black text-slate-800 italic">{formatDate(data.date)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Core Info */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Progress Activities */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden p-8 space-y-8">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
                                <Activity size={24} className="text-emerald-500" />
                                Execution Progress
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Milestone Tracking</span>
                                <div className="w-10 h-1 bg-emerald-100 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full w-2/3"></div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {data.progress && data.progress.length > 0 ? data.progress.map((item, idx) => (
                                <div key={idx} className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 group hover:border-emerald-200 hover:bg-white transition-all">
                                    <div className="flex flex-col md:flex-row justify-between gap-6">
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                                                <Construction size={14} />
                                                Activity {idx + 1}
                                            </div>
                                            <p className="text-lg font-bold text-slate-800 leading-snug tracking-tight">
                                                {item.activityDescription}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Execution Qty</p>
                                                <div className="flex items-end gap-1.5 justify-end">
                                                    <span className="text-2xl font-black text-slate-900 tracking-tighter italic">{item.quantityToday}</span>
                                                    <span className="text-xs font-bold text-slate-400 mb-1">{item.unit === '%' ? 'Percent' : item.unit}</span>
                                                </div>
                                            </div>
                                            <div className="w-px h-10 bg-slate-200 hidden md:block"></div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cumulative</p>
                                                <p className="text-lg font-black text-emerald-600 italic">{item.totalToDate}{item.unit}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="bg-emerald-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                            style={{ width: `${item.totalToDate}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-slate-400 italic font-bold">No specific progress activities logged for this date.</div>
                            )}
                        </div>
                    </div>

                    {/* Photo Gallery */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden p-8 space-y-8">
                        <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3 italic">
                                <ImageIcon size={24} className="text-emerald-500" />
                                Visual Verification
                            </h2>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{data.photos?.length || 0} Assets Captured</span>
                        </div>

                        {data.photos && data.photos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {data.photos.map((photo, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedImage(`https://tourism.datsystems.co${photo.path}`)}
                                        className="group relative rounded-[2rem] overflow-hidden border border-slate-200 shadow-md aspect-video bg-slate-100 cursor-pointer"
                                    >
                                        <img
                                            src={`https://tourism.datsystems.co${photo.path}`}
                                            alt={`Site Capture ${idx}`}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                                            <p className="text-white font-black text-xs uppercase tracking-[0.2em] mb-1">Timestamp</p>
                                            <p className="text-slate-300 text-xs font-bold italic">{formatDate(photo.capturedAt)}</p>
                                        </div>
                                        <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md rounded-xl p-2 border border-white/20">
                                            <ImageIcon size={16} className="text-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                <p className="text-slate-400 font-bold italic">No site photos accompany this report.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Metadata & Side Stats */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Site Status Card */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>

                        <div className="space-y-1 relative z-10">
                            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">Environment Intelligence</p>
                            <h3 className="text-2xl font-black tracking-tight italic">Site Metadata</h3>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center gap-4 group">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-emerald-500/20 transition-all">
                                    <CloudSun size={20} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Ambient Conditions</p>
                                    <p className="text-sm font-black italic">{data.weather.join(', ') || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-emerald-500/20 transition-all">
                                    <MapPin size={20} className="text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Global Coordinates</p>
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-black italic">{data.latitude?.toFixed(5)}, {data.longitude?.toFixed(5)}</p>
                                        <a
                                            href={`https://www.google.com/maps?q=${data.latitude},${data.longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-1 hover:text-emerald-400 transition-colors"
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group">
                                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-emerald-500/20 transition-all">
                                    <Globe size={20} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">GPS Precision</p>
                                    <p className="text-sm font-black italic">± {data.locationAccuracy} Meters</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/10 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black italic">
                                    {data.createdBy?.firstName?.[0]}
                                </div>
                                <div>
                                    <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Authenticated User</p>
                                    <p className="text-xs font-bold">{data.createdBy?.firstName} {data.createdBy?.lastName}</p>
                                    <p className="text-[9px] text-emerald-400 italic">Project {data.createdBy?.role}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Site Details Extra */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-8 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <Info size={18} />
                            </div>
                            <h4 className="font-black text-slate-800 tracking-tight italic">Resource Utilization</h4>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Manpower Status</span>
                                </div>
                                <span className="text-xs font-black text-slate-800">{data.manpower?.length || 0} Teams Active</span>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Equipment Status</span>
                                </div>
                                <span className="text-xs font-black text-slate-800">{data.equipment?.length || 0} Units Deployed</span>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Site Condition</span>
                                </div>
                                <span className="text-xs font-black text-slate-800 italic uppercase">Normal Execution</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xl"></div>
                    <button
                        className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all z-10"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={24} />
                    </button>
                    <div className="relative max-w-5xl w-full max-h-full flex items-center justify-center animate-in zoom-in duration-500">
                        <img
                            src={selectedImage}
                            alt="Full View"
                            className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border border-white/20 select-none pb-12"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportDetails;
