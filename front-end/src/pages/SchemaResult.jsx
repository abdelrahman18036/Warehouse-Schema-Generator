import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import SchemaGraph from '../components/SchemaGraph';
import axios from 'axios';
import ErrorBoundary from '../components/ErrorBoundary';
import { motion, AnimatePresence } from 'framer-motion';

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
    
    // State to track which accordion is open
    const [openAccordion, setOpenAccordion] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
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

    // Accordion item animations
    const itemVariants = {
        hidden: { x: -5, opacity: 0 },
        visible: { x: 0, opacity: 1 }
    };

    // Reusable Accordion Component
    const Accordion = ({ id, title, children }) => {
        const isOpen = openAccordion === id;
        const contentRef = React.useRef(null);

        return (
            <div className="bg-[#F5F8FA] rounded-lg shadow-lg overflow-hidden mb-4">
                {/* Accordion Header */}
                <div 
                    className="p-5 flex justify-between items-center cursor-pointer hover:bg-[#EDF2F7] transition-colors"
                    onClick={() => toggleAccordion(id)}
                >
                    <h3 className="text-2xl font-semibold text-[#4361ee]">{title}</h3>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-[#4361ee]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </motion.div>
                </div>

                {/* AnimatePresence for Sliding Content */}
                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            ref={contentRef}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: contentRef.current ? contentRef.current.scrollHeight : 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ 
                                height: { duration: 0.3, ease: [0.33, 1, 0.68, 1] },
                                opacity: { duration: 0.2, ease: "easeOut" }
                            }}
                            className="overflow-hidden"
                        >
                            <div className="p-4">{children}</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center w-full px-4 py-8"
            >
                <h2 className="text-4xl font-bold text-[#4361ee] mb-6 text-center">
                    Schema Result for "{domain}" Domain
                </h2>
                
                {loading && <p className="text-center text-lg">Loading...</p>}
                
                {error && (
                    <motion.div
                        className="mt-4 p-4 bg-red-700 border border-red-500 rounded w-full max-w-2xl"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <pre className="whitespace-pre-wrap text-white">{JSON.stringify(error, null, 2)}</pre>
                    </motion.div>
                )}
                
                {!loading && !error && (
                    <>
                        <ErrorBoundary>
                            <motion.div
                                className="w-full h-[450px] mb-8 rounded-lg shadow-lg overflow-hidden"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <SchemaGraph data={combinedData} />
                            </motion.div>
                        </ErrorBoundary>
                        
                        <div className="w-full grid grid-cols-1 gap-6">
                            {/* AI Suggestions Accordion */}
                            <Accordion id="ai-suggestions" title="AI Suggestions">
                                <motion.div variants={itemVariants} className="mb-4">
                                    <h4 className="text-xl font-semibold text-[#4361ee] mb-2">Missing Tables:</h4>
                                    {Array.isArray(aiSuggestions?.missing_tables) && aiSuggestions.missing_tables.length > 0 ? (
                                        <ul className="list-disc list-inside ml-4">
                                            {aiSuggestions.missing_tables.map((table, index) => (
                                                <motion.li 
                                                    key={index} 
                                                    variants={itemVariants}
                                                    className="mb-1 text-[#2b2b2b]"
                                                >
                                                    {typeof table === 'string' ? table : 'Unknown Table'}
                                                </motion.li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <motion.p variants={itemVariants} className="text-[#2b2b2b]">
                                            No missing tables.
                                        </motion.p>
                                    )}
                                </motion.div>

                                <motion.div variants={itemVariants}>
                                    <h4 className="text-xl font-semibold text-[#4361ee] mb-2">Missing Columns:</h4>
                                    {Array.isArray(aiSuggestions?.missing_columns) && aiSuggestions.missing_columns.length > 0 ? (
                                        aiSuggestions.missing_columns.map((item, index) => (
                                            <motion.div key={index} className="mb-3" variants={itemVariants}>
                                                <p className="font-medium text-[#4361ee]">
                                                    {item.table || item.table_name || 'Unknown Table'}:
                                                </p>
                                                {Array.isArray(item.columns) && item.columns.length > 0 ? (
                                                    <ul className="list-disc list-inside ml-6">
                                                        {item.columns.map((col, idx) => (
                                                            <motion.li 
                                                                key={idx} 
                                                                variants={itemVariants}
                                                                className="text-[#2b2b2b]"
                                                            >
                                                                {typeof col === 'string' ? col : 
                                                                 typeof col === 'object' && col !== null ? 
                                                                 (col.column_name || 'Unknown Column') : 'Unknown'}
                                                            </motion.li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <motion.p variants={itemVariants} className="text-[#2b2b2b] ml-6">
                                                        No missing columns.
                                                    </motion.p>
                                                )}
                                            </motion.div>
                                        ))
                                    ) : (
                                        <motion.p variants={itemVariants} className="text-[#2b2b2b]">
                                            No missing columns.
                                        </motion.p>
                                    )}
                                </motion.div>
                            </Accordion>

                            {/* Missing Tables Accordion */}
                            <Accordion id="missing-tables" title="Missing Tables">
                                {Array.isArray(missingTables) && missingTables.length > 0 ? (
                                    <ul className="list-disc list-inside ml-6">
                                        {missingTables.map((table, index) => (
                                            <motion.li 
                                                key={index} 
                                                variants={itemVariants}
                                                className="mb-1 text-[#2b2b2b]"
                                            >
                                                {typeof table === 'string' ? table : 'Unknown Table'}
                                            </motion.li>
                                        ))}
                                    </ul>
                                ) : (
                                    <motion.p variants={itemVariants} className="text-[#2b2b2b]">
                                        No missing tables.
                                    </motion.p>
                                )}
                            </Accordion>

                            {/* Missing Columns Accordion */}
                            <Accordion id="missing-columns" title="Missing Columns">
                                {missingColumns && Object.keys(missingColumns).length > 0 ? (
                                    Object.keys(missingColumns).map((table, index) => (
                                        <motion.div key={index} className="mb-4" variants={itemVariants}>
                                            <p className="font-medium text-[#4361ee]">{table}:</p>
                                            {Array.isArray(missingColumns[table]) && missingColumns[table].length > 0 ? (
                                                <ul className="list-disc list-inside ml-6">
                                                    {missingColumns[table].map((col, idx) => (
                                                        <motion.li 
                                                            key={idx} 
                                                            variants={itemVariants}
                                                            className="text-[#2b2b2b]"
                                                        >
                                                            {typeof col === 'string' ? col : 'Unknown Column'}
                                                        </motion.li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <motion.p variants={itemVariants} className="text-[#2b2b2b] ml-6">
                                                    No missing columns.
                                                </motion.p>
                                            )}
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.p variants={itemVariants} className="text-[#2b2b2b]">
                                        No missing columns.
                                    </motion.p>
                                )}
                            </Accordion>
                        </div>
                    </>
                )}
            </motion.div>
        </Layout>
    );
};

export default SchemaResult;