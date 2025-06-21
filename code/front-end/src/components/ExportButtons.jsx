import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaDatabase, FaFileCode, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

const ExportButtons = ({ schemaId, schemaType, schemaName }) => {
    const [downloading, setDownloading] = useState({ sql: false, json: false });
    const [message, setMessage] = useState(null);

    const downloadFile = async (format) => {
        setDownloading(prev => ({ ...prev, [format]: true }));
        setMessage(null);

        try {
            const endpoint = `http://localhost:8000/api/schema/export/${schemaType}/${schemaId}/?format=${format}`;

            const response = await axios.get(endpoint, {
                responseType: 'blob'
            });

            // Create blob URL and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Get filename from response headers or create default
            const contentDisposition = response.headers['content-disposition'];
            let filename = `${schemaType}_schema_${schemaId}.${format}`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            setMessage({ type: 'success', text: `${format.toUpperCase()} file downloaded successfully!` });
            setTimeout(() => setMessage(null), 3000);

        } catch (error) {
            console.error(`Error downloading ${format} file:`, error);
            setMessage({
                type: 'error',
                text: error.response?.data?.error || `Failed to download ${format.toUpperCase()} file`
            });
            setTimeout(() => setMessage(null), 5000);
        } finally {
            setDownloading(prev => ({ ...prev, [format]: false }));
        }
    };

    const buttonVariants = {
        hover: { scale: 1.05, transition: { duration: 0.2 } },
        tap: { scale: 0.95 }
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Export Buttons */}
            <div className="flex gap-2">
                <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => downloadFile('sql')}
                    disabled={downloading.sql}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                    {downloading.sql ? (
                        <FaSpinner className="animate-spin" size={14} />
                    ) : (
                        <FaDatabase size={14} />
                    )}
                    {downloading.sql ? 'Downloading...' : 'Export SQL'}
                </motion.button>

                <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => downloadFile('json')}
                    disabled={downloading.json}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                    {downloading.json ? (
                        <FaSpinner className="animate-spin" size={14} />
                    ) : (
                        <FaFileCode size={14} />
                    )}
                    {downloading.json ? 'Downloading...' : 'Export JSON'}
                </motion.button>
            </div>

            {/* Status Message */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`text-xs px-3 py-2 rounded-lg ${message.type === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                >
                    {message.text}
                </motion.div>
            )}
        </div>
    );
};

export default ExportButtons; 