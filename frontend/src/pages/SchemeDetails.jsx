import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { schemeService, componentService, uploadService, getImageUrl } from '../api';
import {
    ArrowLeft, Plus, Image as ImageIcon, Trash2, Save,
    ChevronDown, ChevronUp, Loader2, Upload, X, Filter, Edit2
} from 'lucide-react';
import toast from 'react-hot-toast';

const SchemeDetails = () => {
    const { gs_no } = useParams();
    const navigate = useNavigate();
    const [scheme, setScheme] = useState(null);
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCompModal, setShowCompModal] = useState(false);
    const [showEditSchemeModal, setShowEditSchemeModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [newComp, setNewComp] = useState({
        component_name: '',
        starting_date: '',
        before_images: [],
        after_images: [],
        gs_no: gs_no
    });

    const [previews, setPreviews] = useState({
        before: [],
        after: []
    });

    const [showEditCompModal, setShowEditCompModal] = useState(false);
    const [editingComp, setEditingComp] = useState(null);

    useEffect(() => {
        fetchData();
    }, [gs_no]);

    const fetchData = async () => {
        try {
            const [schemeRes, compsRes] = await Promise.all([
                schemeService.getOne(gs_no),
                componentService.getAll(gs_no)
            ]);
            setScheme(schemeRes.data);
            setComponents(compsRes.data);
        } catch (error) {
            toast.error('Error fetching scheme details');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e, type) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const uploadedFilenames = [];
        const newPreviews = [];

        for (const file of files) {
            try {
                const response = type === 'before'
                    ? await uploadService.uploadBefore(file)
                    : await uploadService.uploadAfter(file);

                uploadedFilenames.push(response.data.filename);
                newPreviews.push(URL.createObjectURL(file));
            } catch (err) {
                toast.error(`Failed to upload ${file.name}`);
            }
        }

        setNewComp(prev => ({
            ...prev,
            [type === 'before' ? 'before_images' : 'after_images']: [
                ...prev[type === 'before' ? 'before_images' : 'after_images'],
                ...uploadedFilenames
            ]
        }));

        setPreviews(prev => ({
            ...prev,
            [type]: [...prev[type], ...newPreviews]
        }));

        setUploading(false);
    };

    const removeImage = (index, type) => {
        setNewComp(prev => ({
            ...prev,
            [type === 'before' ? 'before_images' : 'after_images']: prev[type === 'before' ? 'before_images' : 'after_images'].filter((_, i) => i !== index)
        }));
        setPreviews(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const handleCreateComponent = async (e) => {
        e.preventDefault();
        try {
            await componentService.create({
                ...newComp,
                gs_no: parseInt(gs_no)
            });
            toast.success('Component added successfully');
            setShowCompModal(false);
            setNewComp({ component_name: '', starting_date: '', before_images: [], after_images: [], gs_no: gs_no, is_active: true });
            setPreviews({ before: [], after: [] });
            fetchData();
        } catch (err) {
            toast.error('Error creating component');
        }
    };

    const handleEditComponent = (comp) => {
        setEditingComp({ ...comp });
        setPreviews({
            before: comp.before_images.map(img => getImageUrl(img, 'before')),
            after: comp.after_images.map(img => getImageUrl(img, 'after'))
        });
        setShowEditCompModal(true);
    };

    const handleUpdateComponent = async (e) => {
        e.preventDefault();
        try {
            await componentService.update(editingComp.comp_id, {
                component_name: editingComp.component_name,
                starting_date: editingComp.starting_date,
                before_images: editingComp.before_images,
                after_images: editingComp.after_images,
                gs_no: parseInt(gs_no),
                is_active: editingComp.is_active
            });
            toast.success('Component updated successfully');
            setShowEditCompModal(false);
            fetchData();
        } catch (err) {
            toast.error('Error updating component');
        }
    };

    const handleEditFileChange = async (e, type) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);
        const uploadedFilenames = [];
        const newPreviews = [];

        for (const file of files) {
            try {
                const response = type === 'before'
                    ? await uploadService.uploadBefore(file)
                    : await uploadService.uploadAfter(file);

                uploadedFilenames.push(response.data.filename);
                newPreviews.push(URL.createObjectURL(file));
            } catch (err) {
                toast.error(`Failed to upload ${file.name}`);
            }
        }

        setEditingComp(prev => ({
            ...prev,
            [type === 'before' ? 'before_images' : 'after_images']: [
                ...prev[type === 'before' ? 'before_images' : 'after_images'],
                ...uploadedFilenames
            ]
        }));

        setPreviews(prev => ({
            ...prev,
            [type]: [...prev[type], ...newPreviews]
        }));

        setUploading(false);
    };

    const removeEditImage = (index, type) => {
        setEditingComp(prev => ({
            ...prev,
            [type === 'before' ? 'before_images' : 'after_images']: prev[type === 'before' ? 'before_images' : 'after_images'].filter((_, i) => i !== index)
        }));
        setPreviews(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const handleDeleteComponent = async (id) => {
        if (!window.confirm('Are you sure you want to delete this component?')) return;
        try {
            await componentService.delete(id);
            toast.success('Component deleted');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete component');
        }
    };

    const handleUpdateScheme = async (e) => {
        e.preventDefault();
        try {
            await schemeService.update(gs_no, scheme);
            toast.success('Scheme updated successfully');
            setShowEditSchemeModal(false);
            fetchData();
        } catch (err) {
            toast.error('Error updating scheme');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
            <p className="text-slate-400">Loading scheme details...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">{scheme?.name_of_scheme}</h1>
                    <p className="text-slate-500 font-mono text-sm">GS NO: {gs_no}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Scheme Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card rounded-3xl p-6 space-y-6">
                        <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3">Scheme Overview</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Status</p>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-sm text-slate-200">In Progress</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Progress</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-blue-400">{scheme?.physical_progress || 0}%</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Labour</p>
                                <p className="text-sm text-slate-200">{scheme?.labour_deployed || 0} Workers</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Allocation</p>
                                    <p className="text-xs text-slate-200 font-mono">₹{scheme?.total_allocation || 0}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Released</p>
                                    <p className="text-xs text-emerald-400 font-mono">₹{scheme?.funds_released || 0}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Utilization</p>
                                <p className="text-xs text-blue-400 font-mono">₹{scheme?.committed_fund_utilization || 0}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Remarks</p>
                                <p className="text-sm text-slate-400 italic line-clamp-3">"{scheme?.remarks || 'No remarks provided'}"</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowEditSchemeModal(true)}
                            className="w-full py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Edit2 size={16} />
                            Edit Scheme
                        </button>
                    </div>
                </div>

                {/* Components List */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Project Components</h2>
                        <button
                            onClick={() => setShowCompModal(true)}
                            className="flex items-center gap-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-600/30 transition-all"
                        >
                            <Plus size={18} />
                            Add Component
                        </button>
                    </div>

                    {components.length === 0 ? (
                        <div className="glass-card rounded-3xl p-12 text-center text-slate-500 border-dashed border-2">
                            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No components added to this scheme yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {components.map((comp) => (
                                <div key={comp.comp_id} className="glass-card rounded-3xl overflow-hidden group">
                                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                                                {comp.comp_id}
                                            </div>
                                            <h3 className="text-lg font-bold text-white leading-tight">
                                                {comp.component_name}
                                                <div className="flex flex-col gap-1 mt-1">
                                                    {comp.starting_date && (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400/80 tracking-widest uppercase">
                                                            {comp.starting_date.toLowerCase() === 'not started' ? 'Status: Not Started' : `Launched: ${comp.starting_date}`}
                                                        </span>
                                                    )}
                                                    {!comp.is_active && (
                                                        <span className="text-[10px] font-bold text-red-400/80 tracking-widest uppercase">
                                                            Images Hidden from PDF
                                                        </span>
                                                    )}
                                                </div>
                                            </h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditComponent(comp)}
                                                className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteComponent(comp.comp_id)}
                                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Before Images */}
                                        <div className="space-y-3">
                                            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                                Before Work ({comp.before_images?.length || 0})
                                            </h4>
                                            <div className="grid grid-cols-3 gap-2">
                                                {comp.before_images?.map((img, i) => (
                                                    <div key={i} className="aspect-square rounded-xl overflow-hidden glass-morphism group/img relative">
                                                        <img
                                                            src={getImageUrl(img, 'before')}
                                                            className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                                                            alt="Before"
                                                        />
                                                    </div>
                                                ))}
                                                {comp.before_images?.length === 0 && (
                                                    <div className="col-span-3 py-6 text-center text-slate-600 text-sm italic">No images</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* After Images */}
                                        <div className="space-y-3">
                                            <h4 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                After Work ({comp.after_images?.length || 0})
                                            </h4>
                                            <div className="grid grid-cols-3 gap-2">
                                                {comp.after_images?.map((img, i) => (
                                                    <div key={i} className="aspect-square rounded-xl overflow-hidden glass-morphism group/img relative">
                                                        <img
                                                            src={getImageUrl(img, 'after')}
                                                            className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                                                            alt="After"
                                                        />
                                                    </div>
                                                ))}
                                                {comp.after_images?.length === 0 && (
                                                    <div className="col-span-3 py-6 text-center text-slate-600 text-sm italic">No images</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Component Add Modal */}
            {showCompModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in duration-300">
                    <div className="glass-card w-full max-w-4xl rounded-[2.5rem] p-10 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-3xl font-bold text-white">Add Component</h2>
                            <button onClick={() => setShowCompModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateComponent} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 ml-1">Component Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full input-glass rounded-2xl px-5 py-4 text-slate-200 outline-none focus:ring-2 ring-blue-500/20"
                                        placeholder="e.g. Excavation, Foundation, etc."
                                        value={newComp.component_name}
                                        onChange={(e) => setNewComp({ ...newComp, component_name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-slate-400 ml-1">Starting Date</label>
                                        <button
                                            type="button"
                                            onClick={() => setNewComp({ ...newComp, starting_date: 'Not started' })}
                                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider"
                                        >
                                            Set "Not started"
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full input-glass rounded-2xl px-5 py-4 text-slate-200 outline-none focus:ring-2 ring-blue-500/20"
                                        placeholder="e.g. 2023-10-01 or Not started"
                                        value={newComp.starting_date}
                                        onChange={(e) => setNewComp({ ...newComp, starting_date: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center gap-4 mt-8">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={newComp.is_active}
                                            onChange={(e) => setNewComp({ ...newComp, is_active: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-200">Show Images in Report</span>
                                        <span className="text-[10px] text-slate-500 font-medium">Toggle this to hide/show component photos in PDF</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Before Upload */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                        Before Images
                                        <span className="text-xs text-blue-400">{newComp.before_images.length} Selected</span>
                                    </h3>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {previews.before.map((p, i) => (
                                            <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group">
                                                <img src={p} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(i, 'before')}
                                                    className="absolute inset-0 bg-red-500/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="text-white" />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/30 hover:bg-white/5 transition-all text-slate-500 hover:text-blue-400">
                                            <input type="file" multiple className="hidden" onChange={(e) => handleFileChange(e, 'before')} />
                                            <Upload size={24} className="mb-2" />
                                            <span className="text-xs font-bold">Upload</span>
                                        </label>
                                    </div>
                                </div>

                                {/* After Upload */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                        After Images
                                        <span className="text-xs text-emerald-400">{newComp.after_images.length} Selected</span>
                                    </h3>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {previews.after.map((p, i) => (
                                            <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group">
                                                <img src={p} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(i, 'after')}
                                                    className="absolute inset-0 bg-red-500/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="text-white" />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/30 hover:bg-white/5 transition-all text-slate-500 hover:text-emerald-400">
                                            <input type="file" multiple className="hidden" onChange={(e) => handleFileChange(e, 'after')} />
                                            <Upload size={24} className="mb-2" />
                                            <span className="text-xs font-bold">Upload</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end gap-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setShowCompModal(false)}
                                    className="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="btn-premium px-12 py-4 rounded-2xl font-bold text-white shadow-xl shadow-blue-500/30 flex items-center gap-2"
                                >
                                    {uploading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    Save Component
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Component Edit Modal */}
            {showEditCompModal && editingComp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in duration-300">
                    <div className="glass-card w-full max-w-4xl rounded-[2.5rem] p-10 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-3xl font-bold text-white">Edit Component</h2>
                            <button onClick={() => setShowEditCompModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateComponent} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-400 ml-1">Component Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full input-glass rounded-2xl px-5 py-4 text-slate-200 outline-none focus:ring-2 ring-blue-500/20"
                                        placeholder="e.g. Excavation, Foundation, etc."
                                        value={editingComp.component_name}
                                        onChange={(e) => setEditingComp({ ...editingComp, component_name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-slate-400 ml-1">Starting Date</label>
                                        <button
                                            type="button"
                                            onClick={() => setEditingComp({ ...editingComp, starting_date: 'Not started' })}
                                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider"
                                        >
                                            Set "Not started"
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full input-glass rounded-2xl px-5 py-4 text-slate-200 outline-none focus:ring-2 ring-blue-500/20"
                                        placeholder="e.g. 2023-10-01 or Not started"
                                        value={editingComp.starting_date || ''}
                                        onChange={(e) => setEditingComp({ ...editingComp, starting_date: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center gap-4 mt-8">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={editingComp.is_active}
                                            onChange={(e) => setEditingComp({ ...editingComp, is_active: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-200">Show Images in Report</span>
                                        <span className="text-[10px] text-slate-500 font-medium">Toggle this to hide/show component photos in PDF</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Before Upload */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                        Before Images
                                        <span className="text-xs text-blue-400">{editingComp.before_images?.length || 0} Selected</span>
                                    </h3>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {previews.before.map((p, i) => (
                                            <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group">
                                                <img src={p} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeEditImage(i, 'before')}
                                                    className="absolute inset-0 bg-red-500/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="text-white" />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/30 hover:bg-white/5 transition-all text-slate-500 hover:text-blue-400">
                                            <input type="file" multiple className="hidden" onChange={(e) => handleEditFileChange(e, 'before')} />
                                            <Upload size={24} className="mb-2" />
                                            <span className="text-xs font-bold">Upload</span>
                                        </label>
                                    </div>
                                </div>

                                {/* After Upload */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between">
                                        After Images
                                        <span className="text-xs text-emerald-400">{editingComp.after_images?.length || 0} Selected</span>
                                    </h3>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {previews.after.map((p, i) => (
                                            <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group">
                                                <img src={p} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeEditImage(i, 'after')}
                                                    className="absolute inset-0 bg-red-500/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="text-white" />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/30 hover:bg-white/5 transition-all text-slate-500 hover:text-emerald-400">
                                            <input type="file" multiple className="hidden" onChange={(e) => handleEditFileChange(e, 'after')} />
                                            <Upload size={24} className="mb-2" />
                                            <span className="text-xs font-bold">Upload</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end gap-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setShowEditCompModal(false)}
                                    className="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="btn-premium px-12 py-4 rounded-2xl font-bold text-white shadow-xl shadow-blue-500/30 flex items-center gap-2"
                                >
                                    {uploading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    Update Component
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Edit Scheme Modal */}
            {showEditSchemeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="glass-card w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Edit Scheme Details</h2>
                            <button onClick={() => setShowEditSchemeModal(false)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateScheme} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-sm font-medium text-slate-400 ml-1">Scheme Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full input-glass rounded-xl px-4 py-3 text-slate-200 outline-none"
                                    value={scheme?.name_of_scheme || ''}
                                    onChange={(e) => setScheme({ ...scheme, name_of_scheme: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-400 ml-1">Physical Progress (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full input-glass rounded-xl px-4 py-3 text-slate-200 outline-none"
                                    value={scheme?.physical_progress || 0}
                                    onChange={(e) => setScheme({ ...scheme, physical_progress: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-400 ml-1">Labour Deployed</label>
                                <input
                                    type="number"
                                    className="w-full input-glass rounded-xl px-4 py-3 text-slate-200 outline-none"
                                    value={scheme?.labour_deployed || 0}
                                    onChange={(e) => setScheme({ ...scheme, labour_deployed: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-400 ml-1">Total Allocation</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full input-glass rounded-xl px-4 py-3 text-slate-200 outline-none"
                                    value={scheme?.total_allocation || 0}
                                    onChange={(e) => setScheme({ ...scheme, total_allocation: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-400 ml-1">Funds Released</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full input-glass rounded-xl px-4 py-3 text-slate-200 outline-none"
                                    value={scheme?.funds_released || 0}
                                    onChange={(e) => setScheme({ ...scheme, funds_released: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-400 ml-1">Fund Utilization</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full input-glass rounded-xl px-4 py-3 text-slate-200 outline-none"
                                    value={scheme?.committed_fund_utilization || 0}
                                    onChange={(e) => setScheme({ ...scheme, committed_fund_utilization: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-sm font-medium text-slate-400 ml-1">Remarks</label>
                                <textarea
                                    className="w-full input-glass rounded-xl px-4 py-3 text-slate-200 outline-none min-h-[100px]"
                                    value={scheme?.remarks || ''}
                                    onChange={(e) => setScheme({ ...scheme, remarks: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditSchemeModal(false)}
                                    className="px-6 py-3 rounded-xl font-semibold text-slate-400 hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-premium px-8 py-3 rounded-xl font-semibold text-white"
                                >
                                    Update Scheme
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchemeDetails;
