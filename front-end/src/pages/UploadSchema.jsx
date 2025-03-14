// src/pages/UploadSchema.jsx
import React, { useState } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PreloadOverlay from '../components/PreloadOverlay';

const UploadSchema = () => {
    const [name, setName] = useState('');
    const [schemaFile, setSchemaFile] = useState(null);
    const [domain, setDomain] = useState('Auto-detect');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [cancelTokenSource, setCancelTokenSource] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!schemaFile) {
            setError({ message: 'Please select a schema file to upload.' });
            return;
        }

        setIsLoading(true);
        setCurrentStep(1); // Start with 'Uploading'

        const formData = new FormData();
        formData.append('name', name);
        formData.append('schema_file', schemaFile);
        formData.append('domain', domain);

        const source = axios.CancelToken.source();
        setCancelTokenSource(source);

        try {
            // Step 1: Uploading
            const uploadRes = await axios.post('http://localhost:8000/api/schema/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                cancelToken: source.token,
                onUploadProgress: (progressEvent) => {
                    // Optional: Implement progress tracking
                },
            });
            setCurrentStep(2); // Move to 'Analyzing'

            // Simulate Analysis Delay
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setCurrentStep(3); // Move to 'Enhancing'

            // Simulate Enhancing Delay
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setCurrentStep(4); // Move to 'Upgrading'

            // Simulate Upgrading Delay
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setIsLoading(false);
            const { id } = uploadRes.data;
            navigate(`/result/${id}`); // Redirect to the result page with the ID
        } catch (err) {
            if (axios.isCancel(err)) {
                console.log('Upload canceled by user');
            } else {
                console.error('Error uploading schema:', err);
                setError(err.response ? err.response.data : { message: 'Error uploading schema' });
            }
            setIsLoading(false);
            setCurrentStep(0);
        }
    };

    const handleCancel = () => {
        if (cancelTokenSource) {
            cancelTokenSource.cancel('User canceled the upload.');
            setIsLoading(false);
            setCurrentStep(0);
        }
    };

    return (
        <Layout>
            <motion.div
                className="flex flex-col items-center justify-center py-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="text-4xl font-bold mb-8 text-titanite">Upload Database Schema</h2>
                <motion.form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md bg-surface p-8 rounded-lg shadow-lg"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="mb-4">
                        <label className="block text-titanite-light mb-2">Name</label>
                        <motion.input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-surface border border-titanite rounded text-white focus:outline-none focus:ring-2 focus:ring-titanite"
                            required
                            whileFocus={{ scale: 1.02 }}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-titanite-light mb-2">Schema File</label>
                        <motion.input
                            type="file"
                            accept=".sql"
                            onChange={(e) => setSchemaFile(e.target.files[0])}
                            className="w-full text-titanite-light"
                            required
                            whileHover={{ scale: 1.02 }}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-titanite-light mb-2">Domain</label>
                        <motion.select
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className="w-full px-3 py-2 bg-surface border border-titanite rounded text-white focus:outline-none focus:ring-2 focus:ring-titanite"
                            whileHover={{ scale: 1.02 }}
                        >
                            <option>Auto-detect</option>
                            <option>E-commerce</option>
                            <option>Healthcare</option>
                            <option>Finance</option>
                            <option>Education</option>
                            <option>Supply Chain</option>
                            <option>Social Media</option>
                        </motion.select>
                    </div>
                    <motion.button
                        type="submit"
                        className="w-full bg-titanite text-white px-4 py-2 rounded hover:bg-titanite-dark transition"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={isLoading}
                    >
                        Upload
                    </motion.button>
                </motion.form>
                {error && (
                    <motion.div
                        className="mt-4 p-4 bg-red-700 border border-red-500 rounded w-full max-w-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <pre className="whitespace-pre-wrap text-white">{JSON.stringify(error, null, 2)}</pre>
                    </motion.div>
                )}
            </motion.div>

            {/* Preload Overlay */}
            <AnimatePresence>
                {isLoading && <PreloadOverlay currentStep={currentStep} onClose={handleCancel} />}
            </AnimatePresence>
        </Layout>
    );
};

export default UploadSchema;
