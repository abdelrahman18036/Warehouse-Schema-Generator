import React, { useState, useEffect } from 'react';

const EvaluationResults = ({ schemaId }) => {
    const [evaluationData, setEvaluationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAlgorithm, setSelectedAlgorithm] = useState(null);

    useEffect(() => {
        if (schemaId) {
            fetchEvaluationResults();
        }
    }, [schemaId]);

    const fetchEvaluationResults = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://127.0.0.1:8000/api/evaluation/${schemaId}/`);

            if (!response.ok) {
                throw new Error('Failed to fetch evaluation results');
            }

            const data = await response.json();
            setEvaluationData(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching evaluation results:', err);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading evaluation results...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold">Error Loading Evaluation</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button
                    onClick={fetchEvaluationResults}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!evaluationData) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-gray-600">No evaluation results available</p>
            </div>
        );
    }

    const warehouseAlgorithms = evaluationData.warehouse_schema_evaluation.algorithm_scores;
    const aiEnhancedAlgorithms = evaluationData.ai_enhanced_schema_evaluation.algorithm_scores;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-2">🔬 Schema Evaluation Results</h1>
                <p className="opacity-90">
                    Comprehensive analysis using 6 advanced algorithms for domain: <strong>{evaluationData.domain}</strong>
                </p>
                <p className="text-sm opacity-75 mt-1">
                    Generated: {new Date(evaluationData.evaluation_timestamp).toLocaleString()}
                </p>
            </div>

            {/* Schema Comparison */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">🏆 Schema Comparison & Best Recommendation</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className={`p-4 rounded-lg border-2 ${evaluationData.best_schema_recommendation.schema_type === 'warehouse'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 bg-gray-50'
                        }`}>
                        <h3 className="font-semibold text-gray-800">Warehouse Schema</h3>
                        <div className={`text-2xl font-bold ${getScoreColor(evaluationData.warehouse_schema_evaluation.overall_score)}`}>
                            {evaluationData.warehouse_schema_evaluation.overall_score}%
                        </div>
                        <p className="text-sm text-gray-600">AI-Generated Warehouse Design</p>
                    </div>

                    <div className={`p-4 rounded-lg border-2 ${evaluationData.best_schema_recommendation.schema_type === 'ai_enhanced'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 bg-gray-50'
                        }`}>
                        <h3 className="font-semibold text-gray-800">AI Enhanced Schema</h3>
                        <div className={`text-2xl font-bold ${getScoreColor(evaluationData.ai_enhanced_schema_evaluation.overall_score)}`}>
                            {evaluationData.ai_enhanced_schema_evaluation.overall_score}%
                        </div>
                        <p className="text-sm text-gray-600">Comprehensive Enterprise Design</p>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">
                        🎯 Recommended Schema: {evaluationData.best_schema_recommendation.schema_type === 'warehouse' ? 'Warehouse Schema' : 'AI Enhanced Schema'}
                    </h4>
                    <p className="text-blue-700 text-sm">
                        <strong>Score:</strong> {evaluationData.best_schema_recommendation.score}% | <strong>Reason:</strong> {evaluationData.best_schema_recommendation.reason}
                    </p>
                </div>
            </div>

            {/* Algorithm Performance Comparison */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Algorithm Performance Comparison</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {Object.keys(warehouseAlgorithms).map((algorithmKey) => {
                        const warehouse = warehouseAlgorithms[algorithmKey];
                        const aiEnhanced = aiEnhancedAlgorithms[algorithmKey];

                        return (
                            <div key={algorithmKey} className="border rounded-lg p-4">
                                <h4 className="font-semibold text-gray-800 text-sm mb-3">
                                    {evaluationData.algorithm_details[algorithmKey].name}
                                </h4>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-600">Warehouse:</span>
                                        <span className={`font-bold text-sm ${getScoreColor(warehouse.score)}`}>
                                            {warehouse.score}%
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-600">AI Enhanced:</span>
                                        <span className={`font-bold text-sm ${getScoreColor(aiEnhanced.score)}`}>
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

                                <button
                                    onClick={() => setSelectedAlgorithm(selectedAlgorithm === algorithmKey ? null : algorithmKey)}
                                    className="w-full mt-3 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 transition-colors"
                                >
                                    {selectedAlgorithm === algorithmKey ? 'Hide Details' : 'View Details'}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {selectedAlgorithm && (
                    <div className="bg-white rounded-lg shadow-md p-6 mt-4">
                        <h3 className="text-lg font-bold text-gray-800 mb-3">
                            {evaluationData.algorithm_details[selectedAlgorithm].name}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {evaluationData.algorithm_details[selectedAlgorithm].description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">Warehouse Schema</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Score:</span>
                                        <span className={`font-bold ${getScoreColor(warehouseAlgorithms[selectedAlgorithm].score)}`}>
                                            {warehouseAlgorithms[selectedAlgorithm].score}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Weight:</span>
                                        <span>{(warehouseAlgorithms[selectedAlgorithm].weight * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Weighted Score:</span>
                                        <span className="font-medium">{warehouseAlgorithms[selectedAlgorithm].weighted_score.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-gray-700 mb-2">AI Enhanced Schema</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Score:</span>
                                        <span className={`font-bold ${getScoreColor(aiEnhancedAlgorithms[selectedAlgorithm].score)}`}>
                                            {aiEnhancedAlgorithms[selectedAlgorithm].score}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Weight:</span>
                                        <span>{(aiEnhancedAlgorithms[selectedAlgorithm].weight * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Weighted Score:</span>
                                        <span className="font-medium">{aiEnhancedAlgorithms[selectedAlgorithm].weighted_score.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <h4 className="font-semibold text-gray-700 mb-2">Evaluation Metrics</h4>
                            <div className="flex flex-wrap gap-2">
                                {evaluationData.algorithm_details[selectedAlgorithm].metrics.map((metric, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                    >
                                        {metric}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Algorithm Explanations */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">🧠 Algorithm Explanations</h2>
                <div className="space-y-4">
                    {Object.entries(evaluationData.algorithm_details).map(([key, algo]) => (
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

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">💡 Recommendations</h2>
                <div className="space-y-2">
                    {evaluationData.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-2">
                            <span className="text-blue-600 font-bold text-sm">•</span>
                            <span className="text-gray-700 text-sm">{recommendation}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EvaluationResults; 