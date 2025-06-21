import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { protectedAPI, isAuthenticated } from '../utils/auth';
import {
    FaDatabase,
    FaEye,
    FaTrash,
    FaSearch,
    FaFilter,
    FaSort,
    FaStar,
    FaCalendar,
    FaBuilding,
    FaChevronLeft,
    FaChevronRight,
    FaPlus,
    FaEdit,
    FaArrowUp,
    FaArrowDown
} from 'react-icons/fa';

const AllSchemas = () => {
    const [schemas, setSchemas] = useState([]);
    const [filteredSchemas, setFilteredSchemas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [schemasPerPage] = useState(12);
    const [totalSchemas, setTotalSchemas] = useState(0);

    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        loadAllSchemas();
    }, [navigate]);

    useEffect(() => {
        filterAndSortSchemas();
    }, [schemas, searchTerm, selectedDomain, sortBy, sortOrder]);

    const loadAllSchemas = async () => {
        try {
            setLoading(true);
            // Load all schemas (we'll handle pagination client-side for better UX)
            const response = await protectedAPI.getUserSchemas(1, '', 100); // Get up to 100 schemas
            setSchemas(response.results || []);
            setTotalSchemas(response.total_count || 0);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortSchemas = () => {
        let filtered = [...schemas];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(schema =>
                schema.schema_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                schema.domain.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Domain filter
        if (selectedDomain) {
            filtered = filtered.filter(schema => schema.domain === selectedDomain);
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            if (sortBy === 'created_at') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            } else if (sortBy === 'warehouse_score' || sortBy === 'ai_enhanced_score') {
                aValue = a.evaluation_summary?.[sortBy] || 0;
                bValue = b.evaluation_summary?.[sortBy] || 0;
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        setFilteredSchemas(filtered);
    };

    const handleDeleteSchema = async (schemaId) => {
        if (window.confirm('Are you sure you want to delete this schema? This action cannot be undone.')) {
            try {
                await protectedAPI.deleteSchema(schemaId);
                setSchemas(schemas.filter(schema => schema.id !== schemaId));
            } catch (err) {
                alert('Failed to delete schema: ' + err.message);
            }
        }
    };

    const getUniqueDomains = () => {
        return [...new Set(schemas.map(schema => schema.domain))].sort();
    };

    // Pagination
    const indexOfLastSchema = currentPage * schemasPerPage;
    const indexOfFirstSchema = indexOfLastSchema - schemasPerPage;
    const currentSchemas = filteredSchemas.slice(indexOfFirstSchema, indexOfLastSchema);
    const totalPages = Math.ceil(filteredSchemas.length / schemasPerPage);

    const SchemaCard = ({ schema, onDelete, onView }) => (
        <motion.div
            className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 group relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            layout
        >
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full transform translate-x-16 -translate-y-16 opacity-50 group-hover:opacity-70 transition-opacity"></div>

            <div className="relative">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <div className="flex items-center mb-2">
                            <FaDatabase className="text-blue-500 mr-2" />
                            <h3 className="text-lg font-bold text-gray-800 truncate">{schema.schema_name}</h3>
                        </div>
                        <div className="flex items-center text-gray-500 mb-2">
                            <FaBuilding className="mr-1 text-sm" />
                            <p className="text-sm capitalize">{schema.domain}</p>
                        </div>
                        <div className="flex items-center text-gray-400 text-xs">
                            <FaCalendar className="mr-1" />
                            <span>Created {new Date(schema.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => onView(schema.id)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all duration-200 hover:scale-110"
                            title="View Schema"
                        >
                            <FaEye className="text-sm" />
                        </button>
                        <button
                            onClick={() => navigate(`/result/${schema.id}`)}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all duration-200 hover:scale-110"
                            title="Edit Schema"
                        >
                            <FaEdit className="text-sm" />
                        </button>
                        <button
                            onClick={() => onDelete(schema.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-200 hover:scale-110"
                            title="Delete Schema"
                        >
                            <FaTrash className="text-sm" />
                        </button>
                    </div>
                </div>

                {schema.evaluation_summary && (
                    <div className="space-y-3">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-600">Warehouse Score</span>
                                <span className="text-sm font-bold text-blue-600">{schema.evaluation_summary.warehouse_score}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${schema.evaluation_summary.warehouse_score}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-600">AI Enhanced Score</span>
                                <span className="text-sm font-bold text-purple-600">{schema.evaluation_summary.ai_enhanced_score}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${schema.evaluation_summary.ai_enhanced_score}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                            <span className="text-xs font-medium text-gray-600">Best Schema</span>
                            <div className="flex items-center">
                                <FaStar className="text-yellow-500 mr-1 text-xs" />
                                <span className="text-xs font-bold text-gray-800 capitalize">{schema.evaluation_summary.best_schema}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading schemas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Error loading schemas: {error}</p>
                    <button
                        onClick={loadAllSchemas}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
            {/* Header */}
            <div className="bg-white/70 backdrop-blur-lg shadow-lg border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center mb-2">
                                <Link
                                    to="/dashboard"
                                    className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    title="Back to Dashboard"
                                >
                                    <FaChevronLeft className="text-gray-600" />
                                </Link>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    All Schemas
                                </h1>
                            </div>
                            <p className="text-gray-600">Manage and explore all your data warehouse schemas</p>
                        </div>
                        <Link
                            to="/upload"
                            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                        >
                            <FaPlus className="mr-2" />
                            Generate New Schema
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters and Search */}
                <motion.div
                    className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search schemas..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Domain Filter */}
                        <div className="relative">
                            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 appearance-none bg-white"
                                value={selectedDomain}
                                onChange={(e) => setSelectedDomain(e.target.value)}
                            >
                                <option value="">All Domains</option>
                                {getUniqueDomains().map(domain => (
                                    <option key={domain} value={domain} className="capitalize">{domain}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sort By */}
                        <div className="relative">
                            <FaSort className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 appearance-none bg-white"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="created_at">Date Created</option>
                                <option value="schema_name">Schema Name</option>
                                <option value="domain">Domain</option>
                                <option value="warehouse_score">Warehouse Score</option>
                                <option value="ai_enhanced_score">AI Enhanced Score</option>
                            </select>
                        </div>

                        {/* Sort Order */}
                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-medium"
                        >
                            {sortOrder === 'asc' ? <FaArrowUp className="mr-2" /> : <FaArrowDown className="mr-2" />}
                            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                        </button>
                    </div>

                    {/* Results Count */}
                    <div className="mt-4 text-sm text-gray-600">
                        Showing {currentSchemas.length} of {filteredSchemas.length} schemas
                        {searchTerm || selectedDomain ? ` (filtered from ${schemas.length} total)` : ''}
                    </div>
                </motion.div>

                {/* Schemas Grid */}
                {filteredSchemas.length === 0 ? (
                    <motion.div
                        className="text-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <FaDatabase className="text-6xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">
                            {searchTerm || selectedDomain ? 'No schemas match your filters' : 'No schemas found'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {searchTerm || selectedDomain
                                ? 'Try adjusting your search or filter criteria'
                                : 'Get started by generating your first schema'
                            }
                        </p>
                        {!searchTerm && !selectedDomain && (
                            <Link
                                to="/upload"
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                            >
                                <FaPlus className="mr-2" />
                                Generate Your First Schema
                            </Link>
                        )}
                    </motion.div>
                ) : (
                    <>
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
                            layout
                        >
                            <AnimatePresence>
                                {currentSchemas.map((schema) => (
                                    <SchemaCard
                                        key={schema.id}
                                        schema={schema}
                                        onDelete={handleDeleteSchema}
                                        onView={(id) => navigate(`/result/${id}`)}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <motion.div
                                className="flex justify-center items-center space-x-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded-lg transition-all duration-200 ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
                                        }`}
                                >
                                    <FaChevronLeft />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${currentPage === page
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                                            : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 rounded-lg transition-all duration-200 ${currentPage === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md hover:shadow-lg'
                                        }`}
                                >
                                    <FaChevronRight />
                                </button>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AllSchemas; 