// src/pages/SchemaResult.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SchemaGraph from '../components/SchemaGraph';
import axios from 'axios';
import ErrorBoundary from '../components/ErrorBoundary';

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
                console.log('SchemaResult: Fetched all schema data');
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
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <Navbar />
            <main className="flex-grow container mx-auto p-6">
                <h2 className="text-4xl font-extrabold mb-6 text-teal-400">Schema Result</h2>
                {loading && <p className="text-center text-lg">Loading...</p>}
                {error && (
                    <div className="mt-4 p-4 bg-red-700 border border-red-500 rounded">
                        <pre className="whitespace-pre-wrap text-white">{JSON.stringify(error, null, 2)}</pre>
                    </div>
                )}
                {!loading && !error && (
                    <>
                        <ErrorBoundary>
                            <div className="w-full h-[700px] mb-8 rounded-lg shadow-lg overflow-hidden">
                                <SchemaGraph data={combinedData} />
                            </div>
                        </ErrorBoundary>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                                <h3 className="text-2xl font-semibold text-teal-300 mb-4">Domain</h3>
                                <p className="text-lg">{domain}</p>
                            </div>
                            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                                <h3 className="text-2xl font-semibold text-teal-300 mb-4">AI Suggestions</h3>
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
                            </div>
                        </div>
                        <div className="mt-8">
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
                        </div>
                        <div className="mt-6">
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
                        </div>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );

}

export default SchemaResult;
