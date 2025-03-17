import React, { useState, useRef } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PreloadOverlay from '../components/PreloadOverlay';
import { FaDatabase, FaUpload, FaFileCode, FaArrowRight, FaFileUpload } from 'react-icons/fa';

const UploadSchema = () => {
    const [name, setName] = useState('');
    const [schemaFile, setSchemaFile] = useState(null);
    const [domain, setDomain] = useState('Auto-detect');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [cancelTokenSource, setCancelTokenSource] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!schemaFile) {
            setError({ message: 'Please select a schema file to upload.' });
            return;
        }

        if (!name.trim()) {
            setError({ message: 'Please enter a name for your schema.' });
            return;
        }

        setError(null);
        setIsLoading(true);
        setCurrentStep(1);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('schema_file', schemaFile);
        formData.append('domain', domain);

        const source = axios.CancelToken.source();
        setCancelTokenSource(source);

        try {
            const uploadRes = await axios.post('http://localhost:8000/api/schema/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                cancelToken: source.token,
            });
            
            setCurrentStep(4);
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setIsLoading(false);
            const { id } = uploadRes.data;
            navigate(`/result/${id}`);
        } catch (err) {
            if (axios.isCancel(err)) {
                console.log('Upload canceled by user');
            } else {
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.name.endsWith('.sql')) {
                setSchemaFile(file);
                setError(null);
            } else {
                setError({ message: 'Please upload a valid SQL file.' });
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        
        const file = e.dataTransfer.files[0];
        if (file) {
            if (file.name.endsWith('.sql')) {
                setSchemaFile(file);
                setError(null);
            } else {
                setError({ message: 'Please upload a valid SQL file.' });
            }
        }
    };

    const openFileDialog = () => {
        fileInputRef.current.click();
    };

    // Domain options with icons
    const domainOptions = [
        { value: 'Auto-detect', label: 'Auto-detect', icon: <FaDatabase /> },
        { value: 'E-commerce', label: 'E-commerce', icon: <FaDatabase /> },
        { value: 'Healthcare', label: 'Healthcare', icon: <FaDatabase /> },
        { value: 'Finance', label: 'Finance', icon: <FaDatabase /> },
        { value: 'Education', label: 'Education', icon: <FaDatabase /> },
        { value: 'Supply Chain', label: 'Supply Chain', icon: <FaDatabase /> },
        { value: 'Social Media', label: 'Social Media', icon: <FaDatabase /> },
    ];

    return (
        <Layout>
            <motion.div
                className="min-h-[75vh] flex flex-col items-center justify-center py-20 px-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Background Shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        className="absolute top-20 right-[10%] w-64 h-64 bg-blue-100 rounded-full opacity-30 blur-3xl"
                        animate={{ 
                            y: [0, 20, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{ 
                            repeat: Infinity,
                            duration: 15,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute bottom-20 left-[5%] w-96 h-96 bg-blue-200 rounded-full opacity-20 blur-3xl"
                        animate={{ 
                            y: [0, -30, 0],
                            scale: [1, 1.15, 1],
                        }}
                        transition={{ 
                            repeat: Infinity,
                            duration: 20,
                            ease: "easeInOut"
                        }}
                    />
                </div>
                
                <div className="w-full max-w-2xl relative z-10">
                    <motion.div
                        className="text-center mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <h2 className="text-4xl font-bold text-[#2B5EE8] mb-2">Upload Your Schema</h2>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Transform your database into an optimized data warehouse with our AI-powered system
                        </p>
                    </motion.div>
                    
                    <motion.div
                        className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <div className="flex items-center justify-center mb-6">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-[#2B5EE8]">
                                <FaFileCode size={24} />
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Project Name */}
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Project Name</label>
                                <motion.input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B5EE8] focus:border-transparent transition-all duration-200"
                                    placeholder="Enter a name for your project"
                                    required
                                    whileFocus={{ scale: 1.01 }}
                                />
                            </div>
                            
                            {/* File Upload */}
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">SQL Schema File</label>
                                <motion.div
                                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                                        isDragging ? 'border-[#2B5EE8] bg-blue-50' : schemaFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-[#2B5EE8] hover:bg-blue-50'
                                    }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={openFileDialog}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".sql"
                                        onChange={handleFileChange}
                                    />
                                    
                                    {schemaFile ? (
                                        <>
                                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-3">
                                                <FaFileUpload size={20} />
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 mb-1">{schemaFile.name}</p>
                                            <p className="text-xs text-gray-500 mb-2">{(schemaFile.size / 1024).toFixed(2)} KB</p>
                                            <button 
                                                type="button"
                                                className="text-xs text-[#2B5EE8] hover:underline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSchemaFile(null);
                                                }}
                                            >
                                                Change file
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-[#2B5EE8] mb-3">
                                                <FaUpload size={20} />
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 mb-1">Drag and drop your SQL file here</p>
                                            <p className="text-xs text-gray-500 mb-3">or click to browse files</p>
                                            <p className="text-xs text-gray-400">.sql files only</p>
                                        </>
                                    )}
                                </motion.div>
                            </div>
                            
                            {/* Domain Selection */}
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Domain</label>
                                <div className="relative">
                                    <motion.select
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value)}
                                        className="appearance-none w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-[#2B5EE8] focus:border-transparent transition-all duration-200"
                                        whileFocus={{ scale: 1.01 }}
                                    >
                                        {domainOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </motion.select>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">Select the domain that best matches your database schema</p>
                            </div>
                            
                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white ${isLoading ? 'bg-gray-400' : 'bg-[#2B5EE8] hover:bg-[#1E4BCB]'} transition-all duration-200`}
                                whileHover={isLoading ? {} : { scale: 1.02 }}
                                whileTap={isLoading ? {} : { scale: 0.98 }}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    'Processing...'
                                ) : (
                                    <>
                                        <span>Transform Schema</span>
                                        <FaArrowRight className="ml-2" size={14} />
                                    </>
                                )}
                            </motion.button>
                        </form>
                    </motion.div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="font-medium">There was an error with your submission</p>
                                        <p className="mt-1 text-sm">
                                            {typeof error === 'object' ? 
                                                (error.message || JSON.stringify(error, null, 2)) : 
                                                error}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <AnimatePresence>
                {isLoading && <PreloadOverlay currentStep={currentStep} onClose={handleCancel} />}
            </AnimatePresence>
        </Layout>
    );
};

export default UploadSchema;