// src/pages/UploadSchema.jsx
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UploadSchema = () => {
    const [name, setName] = useState('');
    const [schemaFile, setSchemaFile] = useState(null);
    const [domain, setDomain] = useState('Auto-detect');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', name);
        formData.append('schema_file', schemaFile);
        formData.append('domain', domain);

        try {
            const response = await axios.post('http://localhost:8000/api/schema/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setError(null);
            const { id } = response.data;
            navigate(`/result/${id}`); // Redirect to the result page with the ID
        } catch (err) {
            setError(err.response ? err.response.data : 'Error uploading schema');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-white">
            <Navbar />
            <main className="flex-grow container mx-auto p-4">
                <h2 className="text-3xl font-bold mb-4 text-titanite">Upload Database Schema</h2>
                <form onSubmit={handleSubmit} className="max-w-md bg-surface p-6 rounded-lg shadow-lg">
                    <div className="mb-4">
                        <label className="block text-titanite-light mb-2">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-surface border border-titanite rounded text-white"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-titanite-light mb-2">Schema File</label>
                        <input
                            type="file"
                            accept=".sql"
                            onChange={(e) => setSchemaFile(e.target.files[0])}
                            className="w-full text-titanite-light"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-titanite-light mb-2">Domain</label>
                        <select
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className="w-full px-3 py-2 bg-surface border border-titanite rounded text-white"
                        >
                            <option>Auto-detect</option>
                            <option>E-commerce</option>
                            <option>Healthcare</option>
                            <option>Finance</option>
                            <option>Education</option>
                            <option>Supply Chain</option>
                            <option>Social Media</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-titanite text-white px-4 py-2 rounded hover:bg-titanite-dark transition">Upload</button>
                </form>
                {error && (
                    <div className="mt-4 p-4 bg-red-700 border border-red-500 rounded">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}

export default UploadSchema;
