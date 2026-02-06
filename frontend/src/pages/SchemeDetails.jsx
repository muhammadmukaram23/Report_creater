import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { schemeService, componentService, uploadService, getImageUrl } from '../api';
import {
    ArrowLeft, Plus, Image as ImageIcon, Trash2, Save,
    Loader2, Upload, X, Edit2, Check
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const SchemeDetails = () => {
    const { gs_no } = useParams();
    const navigate = useNavigate();
    const [scheme, setScheme] = useState(null);
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCompModal, setShowCompModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingTable, setEditingTable] = useState(false);
    const [editedScheme, setEditedScheme] = useState(null);
    const [editedComponents, setEditedComponents] = useState([]);

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
            setEditedScheme(schemeRes.data);
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

    const handleAddImageToComponent = async (compId, file, type) => {
        try {
            setUploading(true);
            const response = type === 'before'
                ? await uploadService.uploadBefore(file)
                : await uploadService.uploadAfter(file);

            const component = components.find(c => c.comp_id === compId);
            const updatedImages = type === 'before'
                ? [...(component.before_images || []), response.data.filename]
                : [...(component.after_images || []), response.data.filename];

            await componentService.update(compId, {
                component_name: component.component_name,
                starting_date: component.starting_date,
                before_images: type === 'before' ? updatedImages : component.before_images,
                after_images: type === 'after' ? updatedImages : component.after_images,
                gs_no: parseInt(gs_no),
                is_active: component.is_active
            });

            toast.success('Image added successfully');
            fetchData();
        } catch (err) {
            toast.error('Failed to add image');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImageFromComponent = async (compId, imageIndex, type) => {
        if (!window.confirm('Are you sure you want to remove this image?')) return;

        try {
            const component = components.find(c => c.comp_id === compId);
            const updatedImages = type === 'before'
                ? component.before_images.filter((_, i) => i !== imageIndex)
                : component.after_images.filter((_, i) => i !== imageIndex);

            await componentService.update(compId, {
                component_name: component.component_name,
                starting_date: component.starting_date,
                before_images: type === 'before' ? updatedImages : component.before_images,
                after_images: type === 'after' ? updatedImages : component.after_images,
                gs_no: parseInt(gs_no),
                is_active: component.is_active
            });

            toast.success('Image removed successfully');
            fetchData();
        } catch (err) {
            toast.error('Failed to remove image');
        }
    };

    const handleDeleteComponent = async (id) => {
        // Auth Check
        const code = window.prompt("Enter authorization code to delete this component:");
        if (code === null) return; // User cancelled

        if (code !== '9022b9ac') {
            toast.error('Invalid authorization code! Deletion denied.');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this component?')) return;
        try {
            await componentService.delete(id);
            toast.success('Component deleted');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete component');
        }
    };

    const handleToggleComponentActive = async (component) => {
        try {
            await componentService.update(component.comp_id, {
                component_name: component.component_name,
                starting_date: component.starting_date,
                before_images: component.before_images,
                after_images: component.after_images,
                gs_no: parseInt(gs_no),
                is_active: !component.is_active
            });
            toast.success('Visibility updated');
            fetchData();
        } catch (err) {
            toast.error('Failed to update visibility');
        }
    };

    const handleSaveScheme = async () => {
        try {
            // Update Scheme
            await schemeService.update(gs_no, editedScheme);

            // Update Components
            const componentUpdates = editedComponents.map(comp => {
                return componentService.update(comp.comp_id, {
                    component_name: comp.component_name,
                    starting_date: comp.starting_date,
                    gs_no: parseInt(gs_no)
                });
            });

            await Promise.all(componentUpdates);

            toast.success('Scheme and components updated successfully');
            setEditingTable(false);
            fetchData(); // Refresh everything
        } catch (err) {
            console.error(err);
            toast.error('Error updating details');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-40">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
            <p className="text-slate-600">Loading scheme details...</p>
        </div>
    );

    return (
        <div className="space-y-6 pb-20 px-4 sm:px-6 lg:px-8 py-6 relative">
            <Toaster position="top-right" />

            {/* Premium Upload Loader Overlay */}
            {uploading && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/30 backdrop-blur-[2px] animate-in fade-in duration-300">
                    <div className="glass-card px-8 py-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border-emerald-200/50 scale-110">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                            <Upload className="absolute inset-0 m-auto text-emerald-600 animate-pulse" size={24} />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-slate-800">Uploading Images</p>
                            <p className="text-xs text-slate-500 font-medium">Please wait while we process your files...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{scheme?.name_of_scheme}</h1>
                        <p className="text-slate-600 font-mono text-sm">GS NO: {gs_no}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {editingTable ? (
                        <>
                            <button
                                onClick={() => {
                                    setEditingTable(false);
                                    setEditedScheme(scheme);
                                }}
                                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-300 transition-colors flex items-center gap-2"
                            >
                                <X size={16} />
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveScheme}
                                className="btn-premium px-4 py-2 rounded-xl text-sm font-semibold shadow-lg flex items-center gap-2"
                            >
                                <Check size={16} />
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => {
                                setEditedScheme(scheme);
                                setEditedComponents(JSON.parse(JSON.stringify(components)));
                                setEditingTable(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2"
                        >
                            <Edit2 size={16} />
                            Edit Table
                        </button>
                    )}
                </div>
            </div>

            {/* Scheme Details Table (Responsive) */}
            <div className="glass-card rounded-2xl overflow-hidden p-1 sm:p-0">
                <style>{`
                    input[type=number]::-webkit-inner-spin-button, 
                    input[type=number]::-webkit-outer-spin-button { 
                        -webkit-appearance: none; 
                        margin: 0; 
                    }
                    input[type=number] {
                        -moz-appearance: textfield;
                    }
                `}</style>

                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#116945] text-white">
                                <th className="px-3 py-3 text-center font-bold border border-slate-300 w-[50px] min-w-[50px]" rowSpan="2">Sr. No.</th>
                                <th className="px-3 py-3 text-center font-bold border border-slate-300 w-[70px] min-w-[70px]" rowSpan="2">GS No.</th>
                                <th className="px-3 py-3 text-center font-bold border border-slate-300" rowSpan="2">Name of Scheme</th>
                                <th className="px-3 py-3 text-center font-bold border border-slate-300 w-[200px]" rowSpan="2">Components</th>
                                <th className="px-3 py-3 text-center font-bold border border-slate-300 w-[100px]" rowSpan="2">Starting Date</th>
                                <th className="px-3 py-3 text-center font-bold border border-slate-300" colSpan="4">Financial Detail</th>
                                <th className="px-3 py-3 text-center font-bold border border-slate-300 w-[80px]" rowSpan="2">Labour Deployed</th>
                                <th className="px-3 py-3 text-center font-bold border border-slate-300 w-[250px]" rowSpan="2">Remarks</th>
                            </tr>
                            <tr className="bg-[#116945] text-white text-xs">
                                <th className="px-2 py-2 text-center font-bold border border-slate-300 w-[90px]">Physical Progress (%)</th>
                                <th className="px-2 py-2 text-center font-bold border border-slate-300 w-[90px]">Total Allocation (M)</th>
                                <th className="px-2 py-2 text-center font-bold border border-slate-300 w-[90px]">Funds Released (M)</th>
                                <th className="px-2 py-2 text-center font-bold border border-slate-300 w-[90px]">Committed Funds Utilized (M)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {components.length === 0 ? (
                                <tr>
                                    <td className="px-3 py-3 text-center border border-slate-300">{scheme?.sr_no || 1}</td>
                                    <td className="px-3 py-3 text-center border border-slate-300 font-mono font-bold">{gs_no}</td>
                                    <td className="px-3 py-3 border border-slate-300 font-semibold p-0 relative group">
                                        {editingTable ? (
                                            <input
                                                type="text"
                                                value={editedScheme?.name_of_scheme || ''}
                                                onChange={(e) => setEditedScheme({ ...editedScheme, name_of_scheme: e.target.value })}
                                                className="w-full h-full absolute inset-0 px-3 py-3 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 font-semibold"
                                            />
                                        ) : null}
                                        <div className={editingTable ? "opacity-0 px-3 py-3 pointer-events-none" : "px-3 py-3"}>{scheme?.name_of_scheme}</div>
                                    </td>
                                    <td className="px-3 py-3 border border-slate-300 text-slate-500 italic">No components</td>
                                    <td className="px-3 py-3 text-center border border-slate-300">-</td>
                                    <td className="px-3 py-3 text-center border border-slate-300 font-bold p-0 relative group">
                                        {editingTable ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editedScheme?.physical_progress ?? ''}
                                                onChange={(e) => setEditedScheme({ ...editedScheme, physical_progress: e.target.value })}
                                                className="w-full h-full absolute inset-0 px-3 py-3 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 text-center font-bold"
                                            />
                                        ) : null}
                                        <div className={editingTable ? "opacity-0 px-3 py-3 pointer-events-none" : "px-3 py-3"}>{`${scheme?.physical_progress || 0}%`}</div>
                                    </td>
                                    <td className="px-3 py-3 text-center border border-slate-300 p-0 relative group">
                                        {editingTable ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editedScheme?.total_allocation ?? ''}
                                                onChange={(e) => setEditedScheme({ ...editedScheme, total_allocation: e.target.value })}
                                                className="w-full h-full absolute inset-0 px-3 py-3 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 text-center"
                                            />
                                        ) : null}
                                        <div className={editingTable ? "opacity-0 px-3 py-3 pointer-events-none" : "px-3 py-3"}>{scheme?.total_allocation || '-'}</div>
                                    </td>
                                    <td className="px-3 py-3 text-center border border-slate-300 p-0 relative group">
                                        {editingTable ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editedScheme?.funds_released ?? ''}
                                                onChange={(e) => setEditedScheme({ ...editedScheme, funds_released: e.target.value })}
                                                className="w-full h-full absolute inset-0 px-3 py-3 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 text-center"
                                            />
                                        ) : null}
                                        <div className={editingTable ? "opacity-0 px-3 py-3 pointer-events-none" : "px-3 py-3"}>{scheme?.funds_released || '-'}</div>
                                    </td>
                                    <td className="px-3 py-3 text-center border border-slate-300 p-0 relative group">
                                        {editingTable ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editedScheme?.committed_fund_utilization ?? ''}
                                                onChange={(e) => setEditedScheme({ ...editedScheme, committed_fund_utilization: e.target.value })}
                                                className="w-full h-full absolute inset-0 px-3 py-3 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 text-center"
                                            />
                                        ) : null}
                                        <div className={editingTable ? "opacity-0 px-3 py-3 pointer-events-none" : "px-3 py-3"}>{scheme?.committed_fund_utilization || '-'}</div>
                                    </td>
                                    <td className="px-3 py-3 text-center border border-slate-300 p-0 relative group">
                                        {editingTable ? (
                                            <input
                                                type="number"
                                                value={editedScheme?.labour_deployed ?? 0}
                                                onChange={(e) => setEditedScheme({ ...editedScheme, labour_deployed: e.target.value })}
                                                className="w-full h-full absolute inset-0 px-3 py-3 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 text-center"
                                            />
                                        ) : null}
                                        <div className={editingTable ? "opacity-0 px-3 py-3 pointer-events-none" : "px-3 py-3"}>{scheme?.labour_deployed || 0}</div>
                                    </td>
                                    <td className="px-3 py-3 border border-slate-300 p-0 relative group">
                                        {editingTable ? (
                                            <textarea
                                                value={editedScheme?.remarks || ''}
                                                onChange={(e) => setEditedScheme({ ...editedScheme, remarks: e.target.value })}
                                                className="w-full h-full absolute inset-0 px-3 py-3 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 resize-none"
                                            />
                                        ) : null}
                                        <div className={editingTable ? "opacity-0 px-3 py-3 pointer-events-none" : "px-3 py-3"}>{scheme?.remarks || '-'}</div>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    <tr>
                                        <td className="px-3 py-3 text-center border border-slate-300" rowSpan={components.length}>{scheme?.sr_no || 1}</td>
                                        <td className="px-3 py-3 text-center border border-slate-300 font-mono font-bold" rowSpan={components.length}>{gs_no}</td>
                                        <td className="px-3 py-3 border border-slate-300 font-semibold p-0 relative group" rowSpan={components.length}>
                                            {editingTable ? (
                                                <input
                                                    type="text"
                                                    value={editedScheme?.name_of_scheme || ''}
                                                    onChange={(e) => setEditedScheme({ ...editedScheme, name_of_scheme: e.target.value })}
                                                    className="w-full h-full absolute inset-0 px-3 py-3 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 font-semibold"
                                                />
                                            ) : null}
                                            <div className={editingTable ? "opacity-0 px-3 py-3 pointer-events-none" : "px-3 py-3"}>{scheme?.name_of_scheme}</div>
                                        </td>
                                        <td className="px-3 py-2 border border-slate-300">
                                            <div className="flex items-center justify-between h-full relative group">
                                                <span className="font-bold mr-2">1.</span>
                                                {editingTable ? (
                                                    <input
                                                        type="text"
                                                        value={editedComponents[0]?.component_name || ''}
                                                        onChange={(e) => {
                                                            const newComps = [...editedComponents];
                                                            newComps[0].component_name = e.target.value;
                                                            setEditedComponents(newComps);
                                                        }}
                                                        className="w-full h-full absolute inset-0 pl-8 pr-3 py-2 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 font-normal"
                                                    />
                                                ) : null}
                                                <span className={editingTable ? "opacity-0 pointer-events-none" : ""}>{components[0].component_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-center border border-slate-300 font-semibold relative group">
                                            {editingTable ? (
                                                <input
                                                    type="text"
                                                    value={editedComponents[0]?.starting_date || ''}
                                                    onChange={(e) => {
                                                        const newComps = [...editedComponents];
                                                        newComps[0].starting_date = e.target.value;
                                                        setEditedComponents(newComps);
                                                    }}
                                                    className="w-full h-full absolute inset-0 px-2 py-2 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 text-center font-semibold"
                                                />
                                            ) : null}
                                            <span className={editingTable ? "opacity-0 pointer-events-none" : ""}>{components[0].starting_date || '-'}</span>
                                        </td>
                                        <td className="px-3 py-3 text-center border border-slate-300 font-bold p-0 relative group" rowSpan={components.length}>
                                            {editingTable ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editedScheme?.physical_progress ?? ''}
                                                    onChange={(e) => setEditedScheme({ ...editedScheme, physical_progress: e.target.value })}
                                                    className="w-full h-full absolute inset-0 px-3 py-3 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 text-center font-bold"
                                                />
                                            ) : null}
                                            <div className={editingTable ? "opacity-0 px-3 py-3 pointer-events-none" : "px-3 py-3"}>{`${scheme?.physical_progress || 0}%`}</div>
                                        </td>
                                        <td className="px-3 py-3 text-center border border-slate-300 p-0 relative group" rowSpan={components.length}>
                                            {editingTable ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editedScheme?.total_allocation ?? ''}
                                                    onChange={(e) => setEditedScheme({ ...editedScheme, total_allocation: e.target.value })}
                                                    className="w-full h-full absolute inset-0 px-3 py-3 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 text-center"
                                                />
                                            ) : null}
                                            <div className={editingTable ? "opacity-0 px-3 py-3 pointer-events-none" : "px-3 py-3"}>{scheme?.total_allocation || '-'}</div>
                                        </td>
                                        <td className="px-3 py-3 text-center border border-slate-300 p-0 relative group" rowSpan={components.length}>
                                            {editingTable ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editedScheme?.funds_released ?? ''}
                                                    onChange={(e) => setEditedScheme({ ...editedScheme, funds_released: e.target.value })}
                                                    className="w-full h-full absolute inset-0 px-3 py-3 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 text-center"
                                                />
                                            ) : null}
                                            <div className={editingTable ? "opacity-0 px-3 py-3 pointer-events-none" : "px-3 py-3"}>{scheme?.funds_released || '-'}</div>
                                        </td>
                                        <td className="px-3 py-3 text-center border border-slate-300 p-0 relative group" rowSpan={components.length}>
                                            {editingTable ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editedScheme?.committed_fund_utilization ?? ''}
                                                    onChange={(e) => setEditedScheme({ ...editedScheme, committed_fund_utilization: e.target.value })}
                                                    className="w-full h-full absolute inset-0 px-3 py-3 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 text-center"
                                                />
                                            ) : null}
                                            <div className={editingTable ? "opacity-0 px-3 py-3 pointer-events-none" : "px-3 py-3"}>{scheme?.committed_fund_utilization || '-'}</div>
                                        </td>
                                        <td className="px-3 py-3 text-center border border-slate-300 p-0 relative group" rowSpan={components.length}>
                                            {editingTable ? (
                                                <input
                                                    type="number"
                                                    value={editedScheme?.labour_deployed ?? 0}
                                                    onChange={(e) => setEditedScheme({ ...editedScheme, labour_deployed: e.target.value })}
                                                    className="w-full h-full absolute inset-0 px-3 py-3 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 text-center"
                                                />
                                            ) : null}
                                            <div className={editingTable ? "opacity-0 px-3 py-3 pointer-events-none" : "px-3 py-3"}>{scheme?.labour_deployed || 0}</div>
                                        </td>
                                        <td className="px-3 py-3 border border-slate-300 p-0 relative group" rowSpan={components.length}>
                                            {editingTable ? (
                                                <textarea
                                                    value={editedScheme?.remarks || ''}
                                                    onChange={(e) => setEditedScheme({ ...editedScheme, remarks: e.target.value })}
                                                    className="w-full h-full absolute inset-0 px-3 py-3 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 resize-none"
                                                />
                                            ) : null}
                                            <div className={editingTable ? "opacity-0 px-3 py-3 pointer-events-none" : "px-3 py-3"}>{scheme?.remarks || '-'}</div>
                                        </td>
                                    </tr>
                                    {components.slice(1).map((comp, idx) => (
                                        <tr key={comp.comp_id}>
                                            <td className="px-3 py-2 border border-slate-300">
                                                <div className="flex items-center justify-between h-full relative group">
                                                    <span className="font-bold mr-2">{idx + 2}.</span>
                                                    {editingTable ? (
                                                        <input
                                                            type="text"
                                                            value={editedComponents[idx + 1]?.component_name || ''}
                                                            onChange={(e) => {
                                                                const newComps = [...editedComponents];
                                                                newComps[idx + 1].component_name = e.target.value;
                                                                setEditedComponents(newComps);
                                                            }}
                                                            className="w-full h-full absolute inset-0 pl-8 pr-3 py-2 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 font-normal"
                                                        />
                                                    ) : null}
                                                    <span className={editingTable ? "opacity-0 pointer-events-none" : ""}>{comp.component_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-center border border-slate-300 font-semibold relative group">
                                                {editingTable ? (
                                                    <input
                                                        type="text"
                                                        value={editedComponents[idx + 1]?.starting_date || ''}
                                                        onChange={(e) => {
                                                            const newComps = [...editedComponents];
                                                            newComps[idx + 1].starting_date = e.target.value;
                                                            setEditedComponents(newComps);
                                                        }}
                                                        className="w-full h-full absolute inset-0 px-2 py-2 bg-emerald-50/50 outline-none focus:bg-emerald-100/50 transition-colors z-10 text-center font-semibold"
                                                    />
                                                ) : null}
                                                <span className={editingTable ? "opacity-0 pointer-events-none" : ""}>{comp.starting_date || '-'}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View Cards */}
                <div className="block md:hidden p-4 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                            <h3 className="text-lg font-bold text-emerald-800 uppercase tracking-tight">Scheme Overview</h3>
                            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold font-mono">GS #{gs_no}</span>
                        </div>

                        <div className="space-y-3">
                            <div className="relative group rounded-xl border border-slate-200 overflow-hidden">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase px-3 pt-2">Name of Scheme</label>
                                {editingTable ? (
                                    <textarea
                                        value={editedScheme?.name_of_scheme || ''}
                                        onChange={(e) => setEditedScheme({ ...editedScheme, name_of_scheme: e.target.value })}
                                        className="w-full px-3 py-2 bg-emerald-50 outline-none focus:bg-emerald-100 transition-colors z-10 font-semibold text-sm min-h-[80px]"
                                    />
                                ) : (
                                    <div className="px-3 py-2 font-semibold text-sm text-slate-800">{scheme?.name_of_scheme}</div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative group rounded-xl border border-slate-200 overflow-hidden">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase px-3 pt-2">Sr. No.</label>
                                    <div className="px-3 py-2 font-semibold text-sm text-slate-800">{scheme?.sr_no || 1}</div>
                                </div>
                                <div className="relative group rounded-xl border border-slate-200 overflow-hidden">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase px-3 pt-2 text-emerald-600">Physical Progress</label>
                                    {editingTable ? (
                                        <div className="flex items-center bg-emerald-50">
                                            <input
                                                type="number"
                                                value={editedScheme?.physical_progress ?? ''}
                                                onChange={(e) => setEditedScheme({ ...editedScheme, physical_progress: e.target.value })}
                                                className="w-full px-3 py-2 bg-transparent outline-none focus:bg-emerald-100 transition-colors z-10 font-bold text-sm text-center"
                                            />
                                            <span className="pr-3 text-sm font-bold text-emerald-600">%</span>
                                        </div>
                                    ) : (
                                        <div className="px-3 py-2 font-bold text-sm text-emerald-700">{scheme?.physical_progress || 0}%</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Financial Details (M)
                            </h4>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { label: 'Total Allocation', key: 'total_allocation' },
                                    { label: 'Funds Released', key: 'funds_released' },
                                    { label: 'Committed Utilization', key: 'committed_fund_utilization' }
                                ].map((field) => (
                                    <div key={field.key} className="relative group rounded-xl border border-slate-200 overflow-hidden bg-white">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase px-3 pt-2">{field.label}</label>
                                        {editingTable ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editedScheme?.[field.key] ?? ''}
                                                onChange={(e) => setEditedScheme({ ...editedScheme, [field.key]: e.target.value })}
                                                className="w-full px-3 py-2 bg-emerald-50 outline-none focus:bg-emerald-100 transition-colors z-10 text-sm font-bold"
                                            />
                                        ) : (
                                            <div className="px-3 py-2 font-bold text-sm text-slate-800">{scheme?.[field.key] || '-'}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="relative group rounded-xl border border-slate-200 overflow-hidden">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase px-3 pt-2">Labour Deployed</label>
                                {editingTable ? (
                                    <input
                                        type="number"
                                        value={editedScheme?.labour_deployed ?? 0}
                                        onChange={(e) => setEditedScheme({ ...editedScheme, labour_deployed: e.target.value })}
                                        className="w-full px-3 py-2 bg-emerald-50 outline-none focus:bg-emerald-100 transition-colors z-10 text-sm font-bold"
                                    />
                                ) : (
                                    <div className="px-3 py-2 font-bold text-sm text-slate-800">{scheme?.labour_deployed || 0}</div>
                                )}
                            </div>
                            <div className="relative group rounded-xl border border-slate-200 overflow-hidden">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase px-3 pt-2">Remarks</label>
                                {editingTable ? (
                                    <textarea
                                        value={editedScheme?.remarks || ''}
                                        onChange={(e) => setEditedScheme({ ...editedScheme, remarks: e.target.value })}
                                        className="w-full px-3 py-2 bg-emerald-50 outline-none focus:bg-emerald-100 transition-colors z-10 text-sm min-h-[60px]"
                                    />
                                ) : (
                                    <div className="px-3 py-2 text-sm text-slate-700 italic">{scheme?.remarks || '-'}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                            <h3 className="text-lg font-bold text-emerald-800 uppercase tracking-tight">Components</h3>
                            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-black">{components.length} Total</span>
                        </div>

                        <div className="space-y-3">
                            {components.map((comp, idx) => (
                                <div key={comp.comp_id} className="relative group rounded-2xl border border-slate-200 bg-white overflow-hidden p-4 space-y-3 shadow-sm hover:border-emerald-300 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 w-6 h-6 flex items-center justify-center rounded-lg border border-emerald-100">{idx + 1}</span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="relative rounded-xl border border-slate-100 overflow-hidden">
                                            <label className="block text-[9px] font-black text-slate-400 uppercase px-2 pt-1.5">Component Name</label>
                                            {editingTable ? (
                                                <input
                                                    type="text"
                                                    value={editedComponents[idx]?.component_name || ''}
                                                    onChange={(e) => {
                                                        const newComps = [...editedComponents];
                                                        newComps[idx].component_name = e.target.value;
                                                        setEditedComponents(newComps);
                                                    }}
                                                    className="w-full px-2 py-1.5 bg-emerald-50 outline-none focus:bg-emerald-100 transition-colors text-sm font-semibold"
                                                />
                                            ) : (
                                                <div className="px-2 py-1.5 font-bold text-sm text-slate-800">{comp.component_name}</div>
                                            )}
                                        </div>

                                        <div className="relative rounded-xl border border-slate-100 overflow-hidden">
                                            <label className="block text-[9px] font-black text-slate-400 uppercase px-2 pt-1.5">Starting Date</label>
                                            {editingTable ? (
                                                <div className="flex items-center bg-emerald-50">
                                                    <input
                                                        type="text"
                                                        value={editedComponents[idx]?.starting_date || ''}
                                                        onChange={(e) => {
                                                            const newComps = [...editedComponents];
                                                            newComps[idx].starting_date = e.target.value;
                                                            setEditedComponents(newComps);
                                                        }}
                                                        className="w-full px-2 py-1.5 bg-transparent outline-none focus:bg-emerald-100 transition-colors text-sm font-semibold"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newComps = [...editedComponents];
                                                            newComps[idx].starting_date = 'Not started';
                                                            setEditedComponents(newComps);
                                                        }}
                                                        className="text-[8px] font-bold text-emerald-600 pr-2 uppercase"
                                                    >
                                                        Not started
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="px-2 py-1.5 font-semibold text-sm text-slate-600 italic">
                                                    {comp.starting_date || 'Not specified'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Component Button */}
            <div className="flex justify-center">
                <button
                    onClick={() => setShowCompModal(true)}
                    className="btn-premium flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-lg"
                >
                    <Plus size={18} />
                    Add New Component
                </button>
            </div>

            {/* Component Images Section */}
            {components.length > 0 && (
                <div className="space-y-8">
                    <h2 className="text-2xl font-bold text-slate-800 border-b-2 border-slate-200 pb-3">Component Images</h2>

                    {components.map((comp, compIdx) => (
                        <div key={comp.comp_id} className="glass-card rounded-2xl p-6 space-y-6">
                            {/* Component Header */}
                            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{compIdx + 1}. {comp.component_name}</h3>
                                    <p className="text-sm text-slate-600 mt-1">
                                        Starting Date: <span className="font-semibold">{comp.starting_date || 'Not Set'}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all duration-300 ${comp.is_active ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                                        <label className="relative inline-flex items-center cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={comp.is_active}
                                                onChange={() => handleToggleComponentActive(comp)}
                                            />
                                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-emerald-600"></div>
                                        </label>
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${comp.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>Report Visibility</span>
                                            <span className={`text-[11px] font-bold mt-0.5 ${comp.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                {comp.is_active ? 'Visible' : 'Hidden'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200 mx-2"></div>
                                    <button
                                        onClick={() => handleDeleteComponent(comp.comp_id)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Delete Component"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Before Images */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
                                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                        Before Work ({comp.before_images?.length || 0})
                                    </h4>
                                    <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${uploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}>
                                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                        {uploading ? 'Uploading...' : 'Add Image'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => e.target.files[0] && handleAddImageToComponent(comp.comp_id, e.target.files[0], 'before')}
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {comp.before_images?.length > 0 ? (
                                        comp.before_images.map((img, imgIdx) => (
                                            <div key={imgIdx} className="relative aspect-square rounded-xl overflow-hidden group border-2 border-amber-200">
                                                <img
                                                    src={getImageUrl(img, 'before')}
                                                    className="w-full h-full object-cover"
                                                    alt={`Before ${imgIdx + 1}`}
                                                />
                                                <button
                                                    onClick={() => handleRemoveImageFromComponent(comp.comp_id, imgIdx, 'before')}
                                                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-8 text-center text-slate-400 italic text-sm">
                                            No before images yet
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* After Images */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
                                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                        After Work ({comp.after_images?.length || 0})
                                    </h4>
                                    <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${uploading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
                                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                        {uploading ? 'Uploading...' : 'Add Image'}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => e.target.files[0] && handleAddImageToComponent(comp.comp_id, e.target.files[0], 'after')}
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {comp.after_images?.length > 0 ? (
                                        comp.after_images.map((img, imgIdx) => (
                                            <div key={imgIdx} className="relative aspect-square rounded-xl overflow-hidden group border-2 border-emerald-200">
                                                <img
                                                    src={getImageUrl(img, 'after')}
                                                    className="w-full h-full object-cover"
                                                    alt={`After ${imgIdx + 1}`}
                                                />
                                                <button
                                                    onClick={() => handleRemoveImageFromComponent(comp.comp_id, imgIdx, 'after')}
                                                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-8 text-center text-slate-400 italic text-sm">
                                            No after images yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Component Add Modal */}
            {showCompModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in zoom-in duration-300">
                    <div className="glass-card w-full max-w-4xl rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-10 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 sm:mb-10">
                            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Add Component</h2>
                            <button onClick={() => setShowCompModal(false)} className="text-slate-500 hover:text-slate-800 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateComponent} className="space-y-6 sm:space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Component Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full input-glass rounded-2xl px-5 py-4 text-slate-700 outline-none"
                                        placeholder="e.g. Excavation, Foundation, etc."
                                        value={newComp.component_name}
                                        onChange={(e) => setNewComp({ ...newComp, component_name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-slate-700 ml-1">Starting Date</label>
                                        <button
                                            type="button"
                                            onClick={() => setNewComp({ ...newComp, starting_date: 'Not started' })}
                                            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
                                        >
                                            Set "Not started"
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full input-glass rounded-2xl px-5 py-4 text-slate-700 outline-none"
                                        placeholder="e.g. 2023-10-01 or Not started"
                                        value={newComp.starting_date}
                                        onChange={(e) => setNewComp({ ...newComp, starting_date: e.target.value })}
                                    />
                                </div>

                                <div className={`flex items-center gap-4 px-6 py-4 rounded-[2rem] border transition-all duration-300 mt-2 md:col-span-2 ${newComp.is_active ? 'bg-emerald-50/50 border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={newComp.is_active}
                                            onChange={(e) => setNewComp({ ...newComp, is_active: e.target.checked })}
                                        />
                                        <div className="w-12 h-6.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-emerald-600"></div>
                                    </label>
                                    <div className="flex flex-col">
                                        <span className={`text-[11px] font-black uppercase tracking-widest leading-none ${newComp.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>Include Images in Report</span>
                                        <span className={`text-xs font-bold mt-1 ${newComp.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {newComp.is_active ? 'Photos will be visible in PDF' : 'Photos will be hidden in PDF'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                                {/* Before Upload */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest flex items-center justify-between">
                                        Before Images
                                        <span className="text-xs text-emerald-600">{newComp.before_images.length} Selected</span>
                                    </h3>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {previews.before.map((p, i) => (
                                            <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group">
                                                <img src={p} className="w-full h-full object-cover" alt="Preview" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(i, 'before')}
                                                    className="absolute inset-0 bg-red-500/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="text-white" />
                                                </button>
                                            </div>
                                        ))}
                                        <label className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${uploading ? 'border-slate-200 bg-slate-50 cursor-not-allowed text-slate-400' : 'border-slate-300 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600'}`}>
                                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileChange(e, 'before')} disabled={uploading} />
                                            {uploading ? <Loader2 size={24} className="mb-2 animate-spin text-emerald-500" /> : <Upload size={24} className="mb-2" />}
                                            <span className="text-xs font-bold">{uploading ? 'Uploading...' : 'Upload'}</span>
                                        </label>
                                    </div>
                                </div>

                                {/* After Upload */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-600 uppercase tracking-widest flex items-center justify-between">
                                        After Images
                                        <span className="text-xs text-emerald-600">{newComp.after_images.length} Selected</span>
                                    </h3>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {previews.after.map((p, i) => (
                                            <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group">
                                                <img src={p} className="w-full h-full object-cover" alt="Preview" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(i, 'after')}
                                                    className="absolute inset-0 bg-red-500/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="text-white" />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all text-slate-500 hover:text-emerald-600">
                                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileChange(e, 'after')} />
                                            <Upload size={24} className="mb-2" />
                                            <span className="text-xs font-bold">Upload</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowCompModal(false)}
                                    className="px-6 sm:px-8 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="btn-premium px-8 sm:px-12 py-4 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-2"
                                >
                                    {uploading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    Save Component
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
