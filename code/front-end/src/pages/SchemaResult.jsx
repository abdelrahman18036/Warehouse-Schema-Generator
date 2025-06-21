import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SchemaGraph from '../components/SchemaGraph';
import SchemaEditor from '../components/SchemaEditor';
import ExportButtons from '../components/ExportButtons';
import ExportView from '../components/ExportView';
import axios from 'axios';
import ErrorBoundary from '../components/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDatabase, FaTable, FaColumns, FaLightbulb, FaDownload, FaChevronDown, FaChevronUp, FaExclamationTriangle, FaCheck, FaInfo, FaEdit, FaCode, FaChartBar } from 'react-icons/fa';
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
    const [evaluationResults, setEvaluationResults] = useState(null);
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
                    metadataRes,
                    evaluationRes
                ] = await Promise.all([
                    axios.get(`http://localhost:8000/api/schema/original_schema/${id}/`),
                    axios.get(`http://localhost:8000/api/schema/warehouse_schema/${id}/`),
                    axios.get(`http://localhost:8000/api/schema/ai_enhanced_schema/${id}/`),
                    axios.get(`http://localhost:8000/api/schema/metadata/${id}/`),
                    axios.get(`http://localhost:8000/api/schema/evaluation/${id}/`).catch(err => {
                        console.warn('Evaluation results not available:', err);
                        return { data: null };
                    })
                ]);

                setOriginalSchema(originalRes.data);
                setWarehouseSchema(warehouseRes.data);
                setAiEnhancedSchema(aiEnhancedRes.data);
                setDomain(metadataRes.data.domain || 'Unknown');
                setAiSuggestions(metadataRes.data.ai_suggestions || {});
                setMissingTables(Array.isArray(metadataRes.data.missing_tables) ? metadataRes.data.missing_tables : []);
                setMissingColumns(metadataRes.data.missing_columns || {});
                setEvaluationResults(evaluationRes.data);
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

    // Handle schema updates from editor
    const handleSchemaUpdate = (updatedSchema, schemaType) => {
        if (schemaType === 'warehouse') {
            setWarehouseSchema(updatedSchema);
        } else if (schemaType === 'ai_enhanced') {
            setAiEnhancedSchema(updatedSchema);
        }

        // Update combined data for graph refresh
        if (activeTab === 'graph') {
            // Force re-render of graph component by updating combinedData
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
        }
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

            switch (type) {
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
                        {/* <motion.div
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
                        </motion.div> */}
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
                            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'graph' ?
                                'bg-[#2B5EE8] text-white shadow-md' :
                                'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                            onClick={() => setActiveTab('graph')}
                        >
                            <FaDatabase size={16} />
                            <span>Schema Visualization</span>
                        </button>
                        <button
                            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'recommendations' ?
                                'bg-[#2B5EE8] text-white shadow-md' :
                                'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                            onClick={() => setActiveTab('recommendations')}
                        >
                            <BsRobot size={16} />
                            <span>AI Recommendations</span>
                        </button>
                        <button
                            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'edit' ?
                                'bg-[#2B5EE8] text-white shadow-md' :
                                'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                            onClick={() => setActiveTab('edit')}
                        >
                            <FaEdit size={16} />
                            <span>Edit Schemas</span>
                        </button>
                        <button
                            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'export' ?
                                'bg-[#2B5EE8] text-white shadow-md' :
                                'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                            onClick={() => setActiveTab('export')}
                        >
                            <FaCode size={16} />
                            <span>Export</span>
                        </button>
                        <button
                            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'evaluation' ?
                                'bg-[#2B5EE8] text-white shadow-md' :
                                'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                            onClick={() => setActiveTab('evaluation')}
                        >
                            <FaChartBar size={16} />
                            <span>Evaluation</span>
                        </button>
                        <button
                            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'details' ?
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
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-50 text-[#2B5EE8] px-3 py-1 rounded-full text-sm font-medium">
                                                    Interactive
                                                </div>
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
                                                        to optimize your data warehouse design for your {domain} domain.
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
                                                                    <li key={index} className="p-4 flex items-start hover:bg-gray-50 transition-colors">
                                                                        <div className="mr-3 mt-0.5 text-green-500">
                                                                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                                                                <FaPlus size={12} />
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="font-semibold text-gray-800 text-lg">
                                                                                {typeof table === 'object' ? table.name : table || 'Unknown Table'}
                                                                            </p>
                                                                            {typeof table === 'object' && table.purpose && (
                                                                                <p className="text-gray-600 text-sm mt-1 leading-relaxed">{table.purpose}</p>
                                                                            )}
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-green-50 p-4 rounded-lg">
                                                            <div className="flex items-center">
                                                                <FaCheck className="text-green-500 mr-2" />
                                                                <p className="text-green-700">No additional tables recommended.</p>
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
                                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                            <ul className="divide-y divide-gray-200">
                                                                {aiSuggestions.missing_columns.map((col, index) => (
                                                                    <li key={index} className="p-4 flex items-start hover:bg-gray-50 transition-colors">
                                                                        <div className="mr-3 mt-0.5 text-purple-500">
                                                                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                                                                <FaColumns size={12} />
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <span className="font-semibold text-gray-800">{col.table || 'Unknown Table'}</span>
                                                                                <span className="text-gray-400">→</span>
                                                                                <span className="font-semibold text-blue-600">{col.name || 'Unknown Column'}</span>
                                                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{col.type}</span>
                                                                            </div>
                                                                            <p className="text-gray-600 text-sm leading-relaxed">{col.purpose}</p>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-green-50 p-4 rounded-lg">
                                                            <div className="flex items-center">
                                                                <FaCheck className="text-green-500 mr-2" />
                                                                <p className="text-green-700">No additional columns recommended.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Accordion>
                                    </motion.div>
                                </motion.div>
                            )}

                            {activeTab === 'edit' && (
                                <motion.div
                                    key="edit"
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


                                        {/* Warehouse Schema Editor */}
                                        <motion.div variants={itemVariants}>
                                            <SchemaEditor
                                                schemaData={warehouseSchema}
                                                schemaType="warehouse"
                                                schemaId={id}
                                                onSchemaUpdate={(updatedSchema) => handleSchemaUpdate(updatedSchema, 'warehouse')}
                                            />
                                        </motion.div>

                                        {/* AI Enhanced Schema Editor */}
                                        <motion.div variants={itemVariants}>
                                            <SchemaEditor
                                                schemaData={aiEnhancedSchema}
                                                schemaType="ai_enhanced"
                                                schemaId={id}
                                                onSchemaUpdate={(updatedSchema) => handleSchemaUpdate(updatedSchema, 'ai_enhanced')}
                                            />
                                        </motion.div>
                                    </motion.div>
                                </motion.div>
                            )}

                            {activeTab === 'export' && (
                                <motion.div
                                    key="export"
                                    variants={tabVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="w-full"
                                >
                                    <ExportView
                                        originalSchema={originalSchema}
                                        warehouseSchema={warehouseSchema}
                                        aiEnhancedSchema={aiEnhancedSchema}
                                        schemaId={id}
                                    />
                                </motion.div>
                            )}

                            {activeTab === 'evaluation' && (
                                <motion.div
                                    key="evaluation"
                                    variants={tabVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="w-full"
                                >
                                    {evaluationResults ? (
                                        <motion.div
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                            className="space-y-6"
                                        >
                                            {/* Header */}
                                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
                                                <h1 className="text-2xl font-bold mb-2">🔬 Schema Evaluation Results</h1>
                                                <p className="opacity-90">
                                                    Comprehensive analysis using 6 advanced algorithms for domain: <strong>{evaluationResults.domain}</strong>
                                                </p>
                                                <p className="text-sm opacity-75 mt-1">
                                                    Generated: {new Date(evaluationResults.evaluation_timestamp).toLocaleString()}
                                                </p>
                                            </div>

                                            {/* Schema Comparison */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h2 className="text-xl font-bold text-gray-800 mb-4">🏆 Schema Comparison & Best Recommendation</h2>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    <div className={`p-4 rounded-lg border-2 ${evaluationResults.best_schema_recommendation.schema_type === 'warehouse'
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-300 bg-gray-50'
                                                        }`}>
                                                        <h3 className="font-semibold text-gray-800">Warehouse Schema</h3>
                                                        <div className={`text-2xl font-bold ${evaluationResults.warehouse_schema_evaluation.overall_score >= 80 ? 'text-green-600' : evaluationResults.warehouse_schema_evaluation.overall_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                            {evaluationResults.warehouse_schema_evaluation.overall_score}%
                                                        </div>
                                                        <p className="text-sm text-gray-600">AI-Generated Warehouse Design</p>
                                                    </div>

                                                    <div className={`p-4 rounded-lg border-2 ${evaluationResults.best_schema_recommendation.schema_type === 'ai_enhanced'
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-300 bg-gray-50'
                                                        }`}>
                                                        <h3 className="font-semibold text-gray-800">AI Enhanced Schema</h3>
                                                        <div className={`text-2xl font-bold ${evaluationResults.ai_enhanced_schema_evaluation.overall_score >= 80 ? 'text-green-600' : evaluationResults.ai_enhanced_schema_evaluation.overall_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                            {evaluationResults.ai_enhanced_schema_evaluation.overall_score}%
                                                        </div>
                                                        <p className="text-sm text-gray-600">Comprehensive Enterprise Design</p>
                                                    </div>
                                                </div>

                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                    <h4 className="font-semibold text-blue-800 mb-2">
                                                        🎯 Recommended Schema: {evaluationResults.best_schema_recommendation.schema_type === 'warehouse' ? 'Warehouse Schema' : 'AI Enhanced Schema'}
                                                    </h4>
                                                    <p className="text-blue-700 text-sm">
                                                        <strong>Score:</strong> {evaluationResults.best_schema_recommendation.score}% | <strong>Reason:</strong> {evaluationResults.best_schema_recommendation.reason}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Algorithm Performance */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Algorithm Performance Comparison</h2>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {Object.keys(evaluationResults.warehouse_schema_evaluation.algorithm_scores).map((algorithmKey) => {
                                                        const warehouse = evaluationResults.warehouse_schema_evaluation.algorithm_scores[algorithmKey];
                                                        const aiEnhanced = evaluationResults.ai_enhanced_schema_evaluation.algorithm_scores[algorithmKey];

                                                        return (
                                                            <div key={algorithmKey} className="border rounded-lg p-4">
                                                                <h4 className="font-semibold text-gray-800 text-sm mb-3">
                                                                    {evaluationResults.algorithm_details[algorithmKey].name}
                                                                </h4>

                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-xs text-gray-600">Warehouse:</span>
                                                                        <span className={`font-bold text-sm ${warehouse.score >= 80 ? 'text-green-600' : warehouse.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                            {warehouse.score}%
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-xs text-gray-600">AI Enhanced:</span>
                                                                        <span className={`font-bold text-sm ${aiEnhanced.score >= 80 ? 'text-green-600' : aiEnhanced.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                                            {aiEnhanced.score}%
                                                                        </span>
                                                                    </div>

                                                                    <div className="text-xs text-center mt-2">
                                                                        <span className={`px-2 py-1 rounded ${aiEnhanced.score > warehouse.score
                                                                            ? 'bg-green-100 text-green-700'
                                                                            : aiEnhanced.score < warehouse.score
                                                                                ? 'bg-red-100 text-red-700'
                                                                                : 'bg-gray-100 text-gray-700'
                                                                            }`}>
                                                                            {aiEnhanced.score > warehouse.score
                                                                                ? `AI +${(aiEnhanced.score - warehouse.score).toFixed(1)}`
                                                                                : aiEnhanced.score < warehouse.score
                                                                                    ? `Warehouse +${(warehouse.score - aiEnhanced.score).toFixed(1)}`
                                                                                    : 'Tied'
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Recommendations */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h2 className="text-xl font-bold text-gray-800 mb-4">💡 Recommendations</h2>
                                                <div className="space-y-2">
                                                    {evaluationResults.recommendations.map((recommendation, index) => (
                                                        <div key={index} className="flex items-start space-x-2">
                                                            <span className="text-blue-600 font-bold text-sm">•</span>
                                                            <span className="text-gray-700 text-sm">{recommendation}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Algorithm Explanations */}
                                            <div className="bg-white rounded-lg shadow-md p-6">
                                                <h2 className="text-xl font-bold text-gray-800 mb-4">🧠 Algorithm Explanations</h2>
                                                <div className="space-y-4">
                                                    {Object.entries(evaluationResults.algorithm_details).map(([key, algo]) => (
                                                        <div key={key} className="border-l-4 border-blue-500 pl-4">
                                                            <h3 className="font-semibold text-gray-800">{algo.name}</h3>
                                                            <p className="text-gray-600 text-sm mt-1">{algo.description}</p>
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {algo.metrics.map((metric, index) => (
                                                                    <span
                                                                        key={index}
                                                                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                                                                    >
                                                                        {metric}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                                            <FaChartBar className="mx-auto text-gray-400 text-4xl mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-600 mb-2">Evaluation Results Not Available</h3>
                                            <p className="text-gray-500">
                                                Evaluation results are generated during schema processing. Please upload a new schema to see evaluation metrics.
                                            </p>
                                        </div>
                                    )}
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
                                                            <li key={index} className="p-4 flex items-start hover:bg-gray-50">
                                                                <div className="mr-3 mt-0.5 text-orange-500">
                                                                    <FaTable size={14} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-800">
                                                                        {typeof table === 'object' ? table.name : table || 'Unknown Table'}
                                                                    </p>
                                                                    {typeof table === 'object' && table.purpose && (
                                                                        <p className="text-gray-600 text-sm mt-1">{table.purpose}</p>
                                                                    )}
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
                                            {Array.isArray(aiSuggestions?.missing_columns) && aiSuggestions.missing_columns.length > 0 ? (
                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                    <ul className="divide-y divide-gray-200">
                                                        {aiSuggestions.missing_columns.map((col, index) => (
                                                            <li key={index} className="p-4 flex items-start hover:bg-gray-50">
                                                                <div className="mr-3 mt-0.5 text-purple-500">
                                                                    <FaColumns size={14} />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="font-medium text-gray-800">{col.table || 'Unknown Table'}</span>
                                                                        <span className="text-gray-400">→</span>
                                                                        <span className="font-medium text-blue-600">{col.name || 'Unknown Column'}</span>
                                                                    </div>
                                                                    <div className="text-sm text-gray-600 space-y-1">
                                                                        <p><span className="font-medium">Type:</span> {col.type}</p>
                                                                        <p><span className="font-medium">Purpose:</span> {col.purpose}</p>
                                                                    </div>
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
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
    </svg>
);

export default SchemaResult;