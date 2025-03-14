// src/pages/SchemaResult.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import SchemaGraph from '../components/SchemaGraph';
import axios from 'axios';
import ErrorBoundary from '../components/ErrorBoundary';
import { motion } from 'framer-motion';

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

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center w-full px-4 py-8"
            >
                <h2 className="text-4xl font-extrabold mb-6 text-teal-400 text-center">
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
                                className="w-full h-96 mb-8 rounded-lg shadow-lg overflow-hidden"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <SchemaGraph data={combinedData} />
                            </motion.div>
                        </ErrorBoundary>
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* AI Suggestions */}
                            <motion.div
                                className="bg-gray-800 p-6 rounded-lg shadow-lg"
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <h3 className="text-2xl font-semibold text-teal-300 mb-4">AI Suggestions</h3>
                                {/* Missing Tables */}
                                <div className="mb-4">
                                    <h4 className="text-xl font-semibold text-teal-200">Missing Tables:</h4>
                                    {Array.isArray(aiSuggestions?.missing_tables) && aiSuggestions.missing_tables.length > 0 ? (
                                        <ul className="list-disc list-inside ml-4">
                                            {aiSuggestions.missing_tables.map((table, index) => (
                                                typeof table === 'string' ? (
                                                    <li key={index}>{table}</li>
                                                ) : (
                                                    <li key={index}>Unknown Table</li>
                                                )
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-teal-100">No missing tables.</p>
                                    )}
                                </div>
                                {/* Missing Columns */}
                                <div>
                                    <h4 className="text-xl font-semibold text-teal-200">Missing Columns:</h4>
                                    {Array.isArray(aiSuggestions?.missing_columns) && aiSuggestions.missing_columns.length > 0 ? (
                                        aiSuggestions.missing_columns.map((item, index) => (
                                            <div key={index} className="mb-2">
                                                <p className="font-medium">{item.table || item.table_name || 'Unknown Table'}:</p>
                                                {Array.isArray(item.columns) && item.columns.length > 0 ? (
                                                    <ul className="list-disc list-inside ml-6">
                                                        {item.columns.map((col, idx) => (
                                                            typeof col === 'string' ? (
                                                                <li key={idx}>{col}</li>
                                                            ) : typeof col === 'object' && col !== null ? (
                                                                <li key={idx}>{col.column_name || 'Unknown Column'}</li>
                                                            ) : (
                                                                <li key={idx}>Unknown</li>
                                                            )
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-teal-100">No missing columns.</p>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-teal-100">No missing columns.</p>
                                    )}
                                </div>
                            </motion.div>
                            {/* Combined Missing Tables and Columns */}
                            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Missing Tables */}
                                <motion.div
                                    className="bg-gray-800 p-6 rounded-lg shadow-lg"
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <h3 className="text-2xl font-semibold text-teal-300 mb-4">Missing Tables</h3>
                                    {Array.isArray(missingTables) && missingTables.length > 0 ? (
                                        <ul className="list-disc list-inside ml-6">
                                            {missingTables.map((table, index) => (
                                                typeof table === 'string' ? (
                                                    <li key={index}>{table}</li>
                                                ) : (
                                                    <li key={index}>Unknown Table</li>
                                                )
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-teal-100">No missing tables.</p>
                                    )}
                                </motion.div>
                                {/* Missing Columns */}
                                <motion.div
                                    className="bg-gray-800 p-6 rounded-lg shadow-lg"
                                    initial={{ y: 50, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                >
                                    <h3 className="text-2xl font-semibold text-teal-300 mb-4">Missing Columns</h3>
                                    {missingColumns && Object.keys(missingColumns).length > 0 ? (
                                        Object.keys(missingColumns).map((table, index) => (
                                            <div key={index} className="mb-4">
                                                <p className="font-medium">{table}:</p>
                                                {Array.isArray(missingColumns[table]) && missingColumns[table].length > 0 ? (
                                                    <ul className="list-disc list-inside ml-6">
                                                        {missingColumns[table].map((col, idx) => (
                                                            typeof col === 'string' ? (
                                                                <li key={idx}>{col}</li>
                                                            ) : (
                                                                <li key={idx}>Unknown Column</li>
                                                            )
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-teal-100">No missing columns.</p>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-teal-100">No missing columns.</p>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        </Layout>
    );

};

export default SchemaResult;
