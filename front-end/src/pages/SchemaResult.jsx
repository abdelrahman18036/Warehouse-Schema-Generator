import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SchemaGraph from '../components/SchemaGraph';
import axios from 'axios';
import { ErrorBoundary } from 'react-error-boundary';

const SchemaResult = () => {
    const { id } = useParams();
    const [aiEnhancedSchema, setAiEnhancedSchema] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const aiEnhancedRes = await axios.get(`http://localhost:8000/api/schema/ai_enhanced_schema/${id}/`);
                setAiEnhancedSchema(aiEnhancedRes.data);
                setLoading(false);
                console.log('SchemaResult: Fetched AI enhanced schema', aiEnhancedRes.data);
            } catch (err) {
                console.error('Error fetching schema result:', err);
                setError(err.response ? err.response.data : 'Error fetching data');
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    return (
        <div className="flex flex-col min-h-screen bg-background text-white">
            <Navbar />
            <main className="flex-grow container mx-auto p-4">
                <h2 className="text-3xl font-bold mb-4 text-titanite">Schema Result</h2>
                {loading && <p>Loading...</p>}
                {error && <p className="text-red-500">Error loading schema: {JSON.stringify(error)}</p>}
                {aiEnhancedSchema && (
                    <ErrorBoundary fallback={<div>Error rendering schema graph</div>}>
                        <div className="w-full h-[600px]">
                            <SchemaGraph data={aiEnhancedSchema} />
                        </div>
                    </ErrorBoundary>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default SchemaResult;