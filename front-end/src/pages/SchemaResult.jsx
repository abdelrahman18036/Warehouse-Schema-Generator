import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SchemaGraph from '../components/SchemaGraph';
import axios from 'axios';
import ErrorBoundary from '../components/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDatabase, FaTable, FaColumns, FaLightbulb, FaDownload, FaChevronDown, FaChevronUp, FaExclamationTriangle, FaCheck, FaInfo } from 'react-icons/fa';
import { BsRobot } from "react-icons/bs";

const SchemaResult = () => {
    const { id } = useParams();
    const [originalSchema, setOriginalSchema] = useState(null);
    const [warehouseSchema, setWarehouseSchema] = useState(null);
    const [aiEnhancedSchema, setAiEnhancedSchema] = useState(null);
    const [domain, setDomain] = useState('');
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [missingTables, setMissingTables] = useState([]);
    const [missingColumns, setMissingColumns] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('graph');
    const [openAccordion, setOpenAccordion] = useState('ai-suggestions');
    const [downloading, setDownloading] = useState(false);
    
    // Refs for scroll transitions
    const resultRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [
                    originalRes,
                    warehouseRes,
                    aiEnhancedRes,
                    metadataRes
                ] = await Promise.all([
                    axios.get(`http://localhost:8000/api/schema/original_schema/${id}/`),
                    axios.get(`http://localhost:8000/api/schema/warehouse_schema/${id}/`),
                    axios.get(`http://localhost:8000/api/schema/ai_enhanced_schema/${id}/`),
                    axios.get(`http://localhost:8000/api/schema/metadata/${id}/`)
                ]);

                setOriginalSchema(originalRes.data);
                setWarehouseSchema(warehouseRes.data);
                setAiEnhancedSchema(aiEnhancedRes.data);
                setDomain(metadataRes.data.domain || 'Unknown');
                setAiSuggestions(metadataRes.data.ai_suggestions || {});
                setMissingTables(Array.isArray(metadataRes.data.missing_tables) ? metadataRes.data.missing_tables : []);
                setMissingColumns(metadataRes.data.missing_columns || {});
                setLoading(false);
            } catch (err) {
                console.error('Error fetching schema result:', err);
                setError(err.response ? err.response.data : { message: 'Error fetching data' });
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const combinedData = {
        original_schema: originalSchema || {},
        warehouse_schema: warehouseSchema || {},
        ai_enhanced_schema: aiEnhancedSchema || {}
    };

    // Toggle accordion
    const toggleAccordion = (accordionId) => {
        setOpenAccordion(openAccordion === accordionId ? null : accordionId);
    };

    // Download schema function
    const downloadSchema = async (type) => {
        try {
            setDownloading(true);
            let endpoint;
            let filename;
            
            switch(type) {
                case 'original':
                    endpoint = `http://localhost:8000/api/schema/download/original/${id}/`;
                    filename = `original_schema_${id}.sql`;
                    break;
                case 'warehouse':
                    endpoint = `http://localhost:8000/api/schema/download/warehouse/${id}/`;
                    filename = `warehouse_schema_${id}.sql`;
                    break;
                case 'ai':
                    endpoint = `http://localhost:8000/api/schema/download/ai_enhanced/${id}/`;
                    filename = `ai_enhanced_schema_${id}.sql`;
                    break;
                default:
                    throw new Error('Invalid schema type');
            }
            
            const response = await axios.get(endpoint, { responseType: 'blob' });
            
            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            setDownloading(false);
        } catch (err) {
            console.error('Error downloading schema:', err);
            setError({ message: 'Error downloading schema' });
            setDownloading(false);
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { 
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };
    
    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    // Tab panel animations
    const tabVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    // Reusable Accordion Component
    const Accordion = ({ id, title, icon, children }) => {
        const isOpen = openAccordion === id;
        const contentRef = React.useRef(null);

        return (
            <motion.div 
                className="bg-white rounded-xl shadow-md overflow-hidden mb-6 border border-gray-100"
                variants={itemVariants}
            >
                {/* Accordion Header */}
                <div 
                    className={`p-5 flex justify-between items-center cursor-pointer transition-colors ${isOpen ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => toggleAccordion(id)}
                >
                    <div className="flex items-center space-x-3">
                        <div className={`text-[#2B5EE8] ${isOpen ? 'opacity-100' : 'opacity-70'}`}>
                            {icon}
                        </div>
                        <h3 className={`text-xl font-semibold ${isOpen ? 'text-[#2B5EE8]' : 'text-gray-800'}`}>{title}</h3>
                    </div>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className={isOpen ? 'text-[#2B5EE8]' : 'text-gray-500'}
                    >
                        <FaChevronDown />
                    </motion.div>
                </div>

                {/* AnimatePresence for Sliding Content */}
                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            ref={contentRef}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ 
                                height: { duration: 0.3, ease: [0.33, 1, 0.68, 1] },
                                opacity: { duration: 0.2 }
                            }}
                            className="overflow-hidden"
                        >
                            <div className="p-6 bg-white border-t border-gray-100">
                                {children}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    // Loading skeleton animation
    const LoadingSkeleton = () => (
        <motion.div
            className="w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="animate-pulse space-y-6">
                <div className="h-[400px] bg-gray-200 rounded-lg w-full"></div>
                
                <div className="space-y-4">
                    <div className="h-14 bg-gray-200 rounded-lg w-full"></div>
                    <div className="h-14 bg-gray-200 rounded-lg w-full"></div>
                    <div className="h-14 bg-gray-200 rounded-lg w-full"></div>
                </div>
            </div>
        </motion.div>
    );

    // Error display
    const ErrorDisplay = ({ message }) => (
        <motion.div
            className="w-full bg-red-50 border border-red-200 rounded-xl p-6 shadow-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 text-red-500">
                    <FaExclamationTriangle size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-medium text-red-600 mb-2">Failed to Load Schema Results</h3>
                    <p className="text-red-600 mb-4">
                        {typeof message === 'object' ? JSON.stringify(message) : message || 'An unexpected error occurred. Please try again later.'}
                    </p>
                    <Link to="/upload" className="inline-flex items-center px-4 py-2 bg-white border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                        Return to Upload Page
                    </Link>
                </div>
            </div>
        </motion.div>
    );

    return (
        <Layout>
            <div ref={resultRef} className="min-h-screen bg-gray-50">
                {/* Hero Section */}
                <motion.div 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="max-w-7xl mx-auto">
                        <motion.h1 
                            className="text-4xl font-bold mb-2 text-center"
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            Schema Transformation Results
                        </motion.h1>
                        <motion.p 
                            className="text-blue-100 text-xl text-center mb-6"
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            Domain: <span className="font-semibold">{domain}</span>
                        </motion.p>
                        
                        {/* Action buttons */}
                        <motion.div 
                            className="flex flex-wrap justify-center gap-4 mt-8"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                        >
                            <button 
                                onClick={() => downloadSchema('warehouse')}
                                disabled={loading || downloading}
                                className="flex items-center space-x-2 bg-white text-blue-600 px-5 py-3 rounded-lg shadow-md hover:bg-blue-50 transition-colors font-medium"
                            >
                                <FaDownload />
                                <span>Download Warehouse Schema</span>
                            </button>
                            <button 
                                onClick={() => downloadSchema('ai')}
                                disabled={loading || downloading}
                                className="flex items-center space-x-2 bg-blue-800 text-white px-5 py-3 rounded-lg shadow-md hover:bg-blue-900 transition-colors font-medium"
                            >
                                <FaDownload />
                                <span>Download AI Enhanced Schema</span>
                            </button>
                        </motion.div>
                    </div>
                </motion.div>
                
                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 py-12">
                    {/* Navigation Tabs */}
                    <motion.div 
    className="mb-8 flex flex-wrap justify-center gap-4"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5, duration: 0.5 }}
>
    <button 
        className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeTab === 'graph' ? 
            'bg-[#2B5EE8] text-white shadow-md' : 
            'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        onClick={() => setActiveTab('graph')}
    >
        <FaDatabase size={16} />
        <span>Schema Visualization</span>
    </button>
    <button 
        className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeTab === 'recommendations' ? 
            'bg-[#2B5EE8] text-white shadow-md' : 
            'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        onClick={() => setActiveTab('recommendations')}
    >
        <BsRobot size={16} />
        <span>AI Recommendations</span>
    </button>
    <button 
        className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeTab === 'details' ? 
            'bg-[#2B5EE8] text-white shadow-md' : 
            'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        onClick={() => setActiveTab('details')}
    >
        <FaInfo size={16} />
        <span>Schema Details</span>
    </button>
</motion.div>
                    
                    {/* Content Area */}
                    {loading ? (
                        <LoadingSkeleton />
                    ) : error ? (
                        <ErrorDisplay message={error.message || error} />
                    ) : (
                        <AnimatePresence mode="wait">
                            {activeTab === 'graph' && (
                                <motion.div
                                    key="graph"
                                    variants={tabVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="w-full"
                                >
                                    <motion.div 
                                        className="bg-white p-4 rounded-xl shadow-md mb-6 overflow-hidden border border-gray-100"
                                        variants={itemVariants}
                                    >
                                        <div className="flex justify-between items-center mb-4 px-2">
                                            <h3 className="text-xl font-semibold text-gray-800">Schema Visualization</h3>
                                            <div className="bg-blue-50 text-[#2B5EE8] px-3 py-1 rounded-full text-sm font-medium">
                                                Interactive
                                            </div>
                                        </div>
                                        <ErrorBoundary>
                                            <div className="w-full h-[600px] rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
                                                <SchemaGraph data={combinedData} />
                                            </div>
                                        </ErrorBoundary>
                                        <div className="mt-4 px-2 text-sm text-gray-500">
                                            <p className="flex items-center gap-2">
                                                <FaInfo size={14} /> Drag nodes to reposition them. Scroll to zoom in/out.
                                            </p>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}

                            {activeTab === 'recommendations' && (
                                <motion.div
                                    key="recommendations"
                                    variants={tabVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="w-full"
                                >
                                    <motion.div 
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="space-y-6"
                                    >
                                        <Accordion 
                                            id="ai-suggestions" 
                                            title="AI Suggestions" 
                                            icon={<FaLightbulb size={20} />}
                                        >
                                            <div className="space-y-6">
                                                {/* Introduction card */}
                                                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                                                    <p className="text-gray-700">
                                                        Our AI has analyzed your schema and identified the following recommendations 
                                                        to optimize your data warehouse design.
                                                    </p>
                                                </div>
                                                
                                                {/* Missing Tables Recommendations */}
                                                <div className="mb-6">
                                                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                                        <FaTable className="text-[#2B5EE8] mr-2" /> 
                                                        Recommended Tables
                                                    </h4>
                                                    {Array.isArray(aiSuggestions?.missing_tables) && aiSuggestions.missing_tables.length > 0 ? (
                                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                            <ul className="divide-y divide-gray-200">
                                                                {aiSuggestions.missing_tables.map((table, index) => (
                                                                    <li 
                                                                        key={index} 
                                                                        className="p-4 flex items-start hover:bg-gray-50"
                                                                    >
                                                                        <div className="mr-3 mt-0.5 text-green-500">
                                                                            <FaPlus size={14} />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-medium text-gray-800">
                                                                                {typeof table === 'string' ? table : 'Unknown Table'}
                                                                            </p>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-green-50 p-4 rounded-lg">
                                                            <div className="flex items-center">
                                                                <FaCheck className="text-green-500 mr-2" />
                                                                <p className="text-green-700">
                                                                    No additional tables recommended.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Missing Columns Recommendations */}
                                                <div>
                                                    <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                                        <FaColumns className="text-[#2B5EE8] mr-2" /> 
                                                        Recommended Columns
                                                    </h4>
                                                    {Array.isArray(aiSuggestions?.missing_columns) && aiSuggestions.missing_columns.length > 0 ? (
                                                        <div className="space-y-4">
                                                            {aiSuggestions.missing_columns.map((item, index) => (
                                                                <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                                                                        <p className="font-medium text-gray-800">
                                                                            Table: {item.table || item.table_name || 'Unknown Table'}
                                                                        </p>
                                                                    </div>
                                                                    {Array.isArray(item.columns) && item.columns.length > 0 ? (
                                                                        <ul className="divide-y divide-gray-200">
                                                                            {item.columns.map((col, idx) => (
                                                                                <li 
                                                                                    key={idx} 
                                                                                    className="p-3 flex items-start hover:bg-gray-50"
                                                                                >
                                                                                    <div className="mr-3 mt-0.5 text-blue-500">
                                                                                        <FaPlus size={14} />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-gray-800">
                                                                                            {typeof col === 'string' ? col : 
                                                                                            typeof col === 'object' && col !== null ? 
                                                                                            (col.column_name || 'Unknown Column') : 'Unknown'}
                                                                                        </p>
                                                                                    </div>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : (
                                                                        <div className="p-3">
                                                                            <p className="text-gray-500">No column recommendations.</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="bg-green-50 p-4 rounded-lg">
                                                            <div className="flex items-center">
                                                                <FaCheck className="text-green-500 mr-2" />
                                                                <p className="text-green-700">
                                                                    No additional columns recommended.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Accordion>
                                    </motion.div>
                                </motion.div>
                            )}

                            {activeTab === 'details' && (
                                <motion.div
                                    key="details"
                                    variants={tabVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="w-full"
                                >
                                    <motion.div 
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="space-y-6"
                                    >
                                        <Accordion 
                                            id="missing-tables" 
                                            title="Missing Tables" 
                                            icon={<FaTable size={20} />}
                                        >
                                            {Array.isArray(missingTables) && missingTables.length > 0 ? (
                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                    <ul className="divide-y divide-gray-200">
                                                        {missingTables.map((table, index) => (
                                                            <li 
                                                                key={index} 
                                                                className="p-4 hover:bg-gray-50"
                                                            >
                                                                <p className="text-gray-800">
                                                                    {typeof table === 'string' ? table : 'Unknown Table'}
                                                                </p>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <div className="bg-green-50 p-4 rounded-lg">
                                                    <div className="flex items-center">
                                                        <FaCheck className="text-green-500 mr-2" />
                                                        <p className="text-green-700">
                                                            No missing tables detected.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </Accordion>

                                        <Accordion 
                                            id="missing-columns" 
                                            title="Missing Columns" 
                                            icon={<FaColumns size={20} />}
                                        >
                                            {missingColumns && Object.keys(missingColumns).length > 0 ? (
                                                <div className="space-y-4">
                                                    {Object.keys(missingColumns).map((table, index) => (
                                                        <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                            <div className="bg-gray-50 p-3 border-b border-gray-200">
                                                                <p className="font-medium text-gray-800">
                                                                    Table: {table}
                                                                </p>
                                                            </div>
                                                            {Array.isArray(missingColumns[table]) && missingColumns[table].length > 0 ? (
                                                                <ul className="divide-y divide-gray-200">
                                                                    {missingColumns[table].map((col, idx) => (
                                                                        <li 
                                                                            key={idx} 
                                                                            className="p-3 hover:bg-gray-50"
                                                                        >
                                                                            <p className="text-gray-800">
                                                                                {typeof col === 'string' ? col : 'Unknown Column'}
                                                                            </p>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <div className="p-3">
                                                                    <p className="text-gray-500">No missing columns.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="bg-green-50 p-4 rounded-lg">
                                                    <div className="flex items-center">
                                                        <FaCheck className="text-green-500 mr-2" />
                                                        <p className="text-green-700">
                                                            No missing columns detected.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </Accordion>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </Layout>
    );
};

const FaPlus = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
    </svg>
);

export default SchemaResult;