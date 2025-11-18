import { useState, useEffect, useRef } from "react";
import { FaTimes, FaFileInvoice, FaCheck, FaEye } from "react-icons/fa";
import html2canvas from "html2canvas";
import { API_BASE_URL } from '../config/api';

const ChooseTemplateModal = ({ onClose, onSelectTemplate }) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [hoveredTemplate, setHoveredTemplate] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [thumbnailCache, setThumbnailCache] = useState({});
    const [loadingThumbnails, setLoadingThumbnails] = useState({});
    const iframeRef = useRef(null);

    // Fetch templates
    const fetchTemplates = async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE_URL}/api/invoicetemplates`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch templates");
            }

            const data = await response.json();
            setTemplates(data);
        } catch (err) {
            setError("Error loading templates");
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch templates on mount
    useEffect(() => {
        fetchTemplates();
    }, []);

    // Generate thumbnail for a specific template using canvas
    const generateThumbnail = async (templateId, templateHTML) => {
        if (thumbnailCache[templateId] || loadingThumbnails[templateId]) {
            return; // Already cached or loading
        }

        setLoadingThumbnails(prev => ({ ...prev, [templateId]: true }));

        try {
            // Create a temporary iframe
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.left = '-9999px';
            iframe.style.width = '800px'; // Smaller width for faster rendering
            iframe.style.height = '1120px';
            iframe.style.border = 'none';
            document.body.appendChild(iframe);

            // Write template HTML
            iframe.srcdoc = templateHTML;

            // Wait for iframe to load - shorter timeout
            await new Promise((resolve) => {
                iframe.onload = () => setTimeout(resolve, 200); // Reduced from 1000ms to 200ms
            });

            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            // Use html2canvas to capture
            const canvas = await html2canvas(iframeDoc.body, {
                scale: 0.4, // Lower scale for faster rendering
                width: 800,
                height: 1120,
                logging: false,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });

            const thumbnail = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG with 80% quality for smaller size
            
            setThumbnailCache(prev => ({ ...prev, [templateId]: thumbnail }));
            setLoadingThumbnails(prev => ({ ...prev, [templateId]: false }));
            
            // Cleanup
            document.body.removeChild(iframe);

        } catch (error) {
            console.error('Error generating thumbnail: ', error);
            setLoadingThumbnails(prev => ({ ...prev, [templateId]: false }));
        }
    };

    // Load thumbnail when template is hovered or selected
    useEffect(() => {
        if (hoveredTemplate) {
            const template = templates.find(t => t.id === hoveredTemplate);
            if (template && !thumbnailCache[hoveredTemplate]) {
                generateThumbnail(hoveredTemplate, template.templateHTML);
            }
        }
    }, [hoveredTemplate]);

    useEffect(() => {
        if (selectedTemplate) {
            const template = templates.find(t => t.id === selectedTemplate);
            if (template && !thumbnailCache[selectedTemplate]) {
                generateThumbnail(selectedTemplate, template.templateHTML);
            }
        }
    }, [selectedTemplate]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
            <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 rounded-2xl shadow-2xl w-full max-w-6xl relative max-h-[90vh] flex flex-col border border-purple-500/20 overflow-hidden">
                
                {/* Header with Gradient */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 border-b border-purple-500/30">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <FaFileInvoice className="text-white" />
                                Choose Invoice Template
                            </h2>
                            <p className="text-purple-100 text-sm mt-1">
                                Select a professional template for your invoice PDF
                            </p>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
                            <p className="text-red-400 text-center flex items-center justify-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 text-center">Loading templates...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {templates.length > 0 ? (
                                templates.map((template) => (
                                    <div 
                                        key={template.id} 
                                        className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 transform
                                        ${selectedTemplate === template.id 
                                            ? "ring-4 ring-purple-500 shadow-2xl shadow-purple-500/50 scale-[1.02]" 
                                            : "ring-2 ring-gray-700 hover:ring-purple-400 hover:scale-[1.02] hover:shadow-xl"
                                        }`}
                                        onClick={() => setSelectedTemplate(template.id)}
                                        onMouseEnter={() => setHoveredTemplate(template.id)}
                                        onMouseLeave={() => setHoveredTemplate(null)}
                                    >
                                        {/* Template Preview with Lazy Loading */}
                                        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 h-72 overflow-hidden flex items-center justify-center">
                                            {thumbnailCache[template.id] ? (
                                                // Show actual thumbnail
                                                <img 
                                                    src={thumbnailCache[template.id]} 
                                                    alt={template.title}
                                                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                                                />
                                            ) : loadingThumbnails[template.id] ? (
                                                // Show loading state
                                                <div className="text-center">
                                                    <div className="w-12 h-12 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3"></div>
                                                    <p className="text-gray-400 text-sm">Generating preview...</p>
                                                </div>
                                            ) : (
                                                // Show placeholder with icon
                                                <div className="text-center">
                                                    <FaFileInvoice 
                                                        className={`mx-auto mb-4 transition-all duration-300 ${
                                                            selectedTemplate === template.id 
                                                                ? 'text-purple-500' 
                                                                : hoveredTemplate === template.id 
                                                                    ? 'text-purple-400' 
                                                                    : 'text-gray-600'
                                                        }`} 
                                                        size={96} 
                                                    />
                                                    <div className={`text-sm font-semibold transition-colors duration-300 ${
                                                        selectedTemplate === template.id 
                                                            ? 'text-purple-400' 
                                                            : 'text-gray-500'
                                                    }`}>
                                                        {template.title}
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        {template.category} Template
                                                    </div>
                                                    <div className="text-xs text-purple-400 mt-2">
                                                        Hover to preview
                                                    </div>
                                                </div>
                                            )}

                                            {/* Preview Overlay on Hover */}
                                            {hoveredTemplate === template.id && thumbnailCache[template.id] && (
                                                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-800/50 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <div className="text-white text-center">
                                                        <FaEye className="mx-auto mb-2" size={32} />
                                                        <p className="font-semibold">Click to Select</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Selected Badge */}
                                            {selectedTemplate === template.id && (
                                                <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg animate-pulse">
                                                    <FaCheck size={12} />
                                                    <span className="text-xs font-semibold">Selected</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Template Info */}
                                        <div className="bg-gray-900/80 p-4 border-t border-gray-700">
                                            <h3 className="text-white font-semibold text-lg mb-1 flex items-center gap-2">
                                                {template.title}
                                                {selectedTemplate === template.id && (
                                                    <span className="text-green-400">
                                                        <FaCheck size={14} />
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{template.description}</p>
                                            
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded-full border border-purple-500/30">
                                                    {template.category}
                                                </span>
                                                <span className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30">
                                                    {template.currency}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-20">
                                    <FaFileInvoice className="mx-auto text-gray-600 mb-4" size={64} />
                                    <p className="text-gray-400 text-lg">No templates available.</p>
                                    <p className="text-gray-500 text-sm mt-2">Create templates to get started</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer with Actions */}
                {!loading && templates.length > 0 && (
                    <div className="bg-gray-900/80 px-6 py-4 border-t border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                            {selectedTemplate ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Template selected: <span className="text-white font-semibold">
                                        {templates.find(t => t.id === selectedTemplate)?.title}
                                    </span>
                                </span>
                            ) : (
                                <span>Select a template to continue</span>
                            )}
                        </div>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={onClose}
                                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                            >
                                <FaTimes size={14} />
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    if (selectedTemplate) {
                                        const template = templates.find(t => t.id === selectedTemplate);
                                        onSelectTemplate(template);
                                        onClose();
                                    }
                                }}
                                disabled={!selectedTemplate}
                                className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg
                                    ${selectedTemplate 
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white hover:shadow-purple-500/50' 
                                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <FaCheck size={14} />
                                Use Template
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChooseTemplateModal;


