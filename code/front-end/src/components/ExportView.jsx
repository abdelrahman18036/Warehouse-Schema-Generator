import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDatabase, FaFileCode, FaCopy, FaDownload, FaCheck, FaCode } from 'react-icons/fa';
import { convertSchemaToSQL, formatJSON, copyToClipboard, downloadAsFile } from '../utils/schemaConverter';

const ExportView = ({ originalSchema, warehouseSchema, aiEnhancedSchema, schemaId }) => {
    const [selectedSchema, setSelectedSchema] = useState('warehouse');
    const [selectedFormat, setSelectedFormat] = useState('sql');
    const [copyStatus, setCopyStatus] = useState(null);

    // Convert schemas to different formats
    const formattedSchemas = useMemo(() => {
        return {
            original: {
                sql: convertSchemaToSQL(originalSchema, 'Original Schema'),
                json: formatJSON(originalSchema)
            },
            warehouse: {
                sql: convertSchemaToSQL(warehouseSchema, 'Warehouse Schema'),
                json: formatJSON(warehouseSchema)
            },
            ai_enhanced: {
                sql: convertSchemaToSQL(aiEnhancedSchema, 'AI Enhanced Schema'),
                json: formatJSON(aiEnhancedSchema)
            }
        };
    }, [originalSchema, warehouseSchema, aiEnhancedSchema]);

    const currentContent = formattedSchemas[selectedSchema]?.[selectedFormat] || '';

    const handleCopy = async () => {
        const success = await copyToClipboard(currentContent);
        setCopyStatus(success ? 'success' : 'error');
        setTimeout(() => setCopyStatus(null), 2000);
    };

    const handleDownload = () => {
        const extension = selectedFormat === 'sql' ? 'sql' : 'json';
        const filename = `${selectedSchema}_schema_${schemaId}.${extension}`;
        const contentType = selectedFormat === 'sql' ? 'text/plain' : 'application/json';
        downloadAsFile(currentContent, filename, contentType);
    };

    const getSchemaDisplayName = (key) => {
        const names = {
            'original': 'Original Schema',
            'warehouse': 'Warehouse Schema',
            'ai_enhanced': 'AI Enhanced Schema'
        };
        return names[key] || key;
    };

    const getSchemaCount = (schema) => {
        if (!schema || typeof schema !== 'object') return 0;
        return Object.keys(schema).length;
    };

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                    <FaCode className="text-blue-600" />
                    Export Schemas
                </h2>
                <p className="text-slate-600">
                    View and export your generated schemas in SQL or JSON format
                </p>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Schema Selector */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                            Select Schema
                        </label>
                        <div className="space-y-2">
                            {[
                                { key: 'original', schema: originalSchema },
                                { key: 'warehouse', schema: warehouseSchema },
                                { key: 'ai_enhanced', schema: aiEnhancedSchema }
                            ].map(({ key, schema }) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedSchema(key)}
                                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${selectedSchema === key
                                            ? 'border-blue-500 bg-blue-50 text-blue-900'
                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{getSchemaDisplayName(key)}</span>
                                        <span className="text-sm opacity-75">
                                            {getSchemaCount(schema)} tables
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format Selector */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                            Export Format
                        </label>
                        <div className="space-y-2">
                            <button
                                onClick={() => setSelectedFormat('sql')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${selectedFormat === 'sql'
                                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <FaDatabase className="text-blue-600" />
                                    <div>
                                        <div className="font-medium">SQL Format</div>
                                        <div className="text-sm opacity-75">CREATE TABLE statements</div>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => setSelectedFormat('json')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${selectedFormat === 'json'
                                        ? 'border-green-500 bg-green-50 text-green-900'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <FaFileCode className="text-green-600" />
                                    <div>
                                        <div className="font-medium">JSON Format</div>
                                        <div className="text-sm opacity-75">Structured data format</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        {copyStatus === 'success' ? (
                            <FaCheck className="text-green-400" />
                        ) : (
                            <FaCopy />
                        )}
                        {copyStatus === 'success' ? 'Copied!' : 'Copy to Clipboard'}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownload}
                        className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${selectedFormat === 'sql'
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                    >
                        <FaDownload />
                        Download {selectedFormat.toUpperCase()}
                    </motion.button>
                </div>

                {/* Status Message */}
                <AnimatePresence>
                    {copyStatus && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`mt-3 p-3 rounded-lg text-sm ${copyStatus === 'success'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                        >
                            {copyStatus === 'success'
                                ? 'Content copied to clipboard successfully!'
                                : 'Failed to copy to clipboard. Please try again.'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Code Preview */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        {selectedFormat === 'sql' ? <FaDatabase /> : <FaFileCode />}
                        {getSchemaDisplayName(selectedSchema)} - {selectedFormat.toUpperCase()}
                    </h3>
                </div>
                <div className="p-6">
                    <pre className={`bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono max-h-96 overflow-y-auto ${selectedFormat === 'sql' ? 'language-sql' : 'language-json'
                        }`}>
                        <code>{currentContent}</code>
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default ExportView; 