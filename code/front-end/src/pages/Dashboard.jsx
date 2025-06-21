import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { protectedAPI, getCurrentUser, logout } from '../utils/auth';
import {
    FaDatabase,
    FaChartLine,
    FaRobot,
    FaBuilding,
    FaPlus,
    FaEye,
    FaTrash,
    FaArrowRight,
    FaStar,
    FaCalendar,
    FaCode,
    FaArrowUp
} from 'react-icons/fa';

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [userSchemas, setUserSchemas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const user = getCurrentUser();
    const navigate = useNavigate();

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [dashboardRes, schemasRes] = await Promise.all([
                protectedAPI.getDashboard(),
                protectedAPI.getUserSchemas(1, '')
            ]);

            setDashboardData(dashboardRes);
            setUserSchemas(schemasRes.results || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSchema = async (schemaId) => {
        if (window.confirm('Are you sure you want to delete this schema?')) {
            try {
                await protectedAPI.deleteSchema(schemaId);
                loadDashboardData(); // Refresh data
            } catch (err) {
                alert('Failed to delete schema: ' + err.message);
            }
        }
    };

    const StatCard = ({ title, value, description, icon: Icon, color = "blue", trend }) => (
        <motion.div
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
        >
            {/* Background gradient */}
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-${color}-100 to-${color}-200 rounded-full transform translate-x-6 -translate-y-6 opacity-50`}></div>

            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br from-${color}-500 to-${color}-600 text-white shadow-lg`}>
                        <Icon className="text-xl" />
                    </div>
                    {trend && (
                        <div className="flex items-center text-green-500 text-sm font-medium">
                            <FaArrowUp className="mr-1" />
                            {trend}
                        </div>
                    )}
                </div>

                <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
                    <p className="text-gray-400 text-xs">{description}</p>
                </div>
            </div>
        </motion.div>
    );

    const SchemaCard = ({ schema, onDelete, onView }) => (
        <motion.div
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, y: -4 }}
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
                        <div className="flex items-center text-gray-500">
                            <FaBuilding className="mr-1 text-sm" />
                            <p className="text-sm capitalize">{schema.domain}</p>
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
                            onClick={() => onDelete(schema.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all duration-200 hover:scale-110"
                            title="Delete Schema"
                        >
                            <FaTrash className="text-sm" />
                        </button>
                    </div>
                </div>

                {schema.evaluation_summary && (
                    <div className="mb-4 space-y-3">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Warehouse Score</span>
                                <div className="flex items-center">
                                    <span className="text-lg font-bold text-blue-600">{schema.evaluation_summary.warehouse_score}%</span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${schema.evaluation_summary.warehouse_score}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">AI Enhanced Score</span>
                                <div className="flex items-center">
                                    <span className="text-lg font-bold text-purple-600">{schema.evaluation_summary.ai_enhanced_score}%</span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${schema.evaluation_summary.ai_enhanced_score}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                            <span className="text-sm font-medium text-gray-600">Best Schema</span>
                            <div className="flex items-center">
                                <FaStar className="text-yellow-500 mr-1" />
                                <span className="text-sm font-bold text-gray-800 capitalize">{schema.evaluation_summary.best_schema}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center text-gray-400 text-sm">
                    <FaCalendar className="mr-2" />
                    <span>Created {new Date(schema.created_at).toLocaleDateString()}</span>
                </div>
            </div>
        </motion.div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Error loading dashboard: {error}</p>
                    <button
                        onClick={loadDashboardData}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Welcome back, {user?.first_name}! 👋
                            </h1>
                            <p className="text-gray-600 mt-1">Manage your data warehouse schemas and analytics</p>
                        </div>
                        <div className="flex space-x-3">
                            <Link
                                to="/upload"
                                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
                            >
                                <FaPlus className="mr-2" />
                                Generate New Schema
                            </Link>
                            <button
                                onClick={logout}
                                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Statistics */}
                {dashboardData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Total Schemas"
                            value={dashboardData.statistics.total_schemas}
                            description="Generated schemas"
                            icon={FaDatabase}
                            color="blue"
                            trend="+12%"
                        />
                        <StatCard
                            title="Domains"
                            value={dashboardData.statistics.total_domains}
                            description="Different domains"
                            icon={FaBuilding}
                            color="green"
                            trend="+5%"
                        />
                        <StatCard
                            title="Avg Warehouse Score"
                            value={`${dashboardData.statistics.avg_warehouse_score}%`}
                            description="Quality rating"
                            icon={FaChartLine}
                            color="yellow"
                            trend="+8%"
                        />
                        <StatCard
                            title="Avg AI Score"
                            value={`${dashboardData.statistics.avg_ai_enhanced_score}%`}
                            description="Enhanced quality"
                            icon={FaRobot}
                            color="purple"
                            trend="+15%"
                        />
                    </div>
                )}

                {/* Domain Distribution */}
                {dashboardData?.domain_distribution && Object.keys(dashboardData.domain_distribution).length > 0 && (
                    <motion.div
                        className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center mb-6">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg mr-4">
                                <FaChartLine className="text-xl" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">Domain Distribution</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Object.entries(dashboardData.domain_distribution).map(([domain, count], index) => (
                                <motion.div
                                    key={domain}
                                    className="text-center p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{count}</p>
                                    <p className="text-sm text-gray-600 capitalize font-medium">{domain}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Recent Schemas */}
                <motion.div
                    className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg mr-4">
                                <FaCode className="text-xl" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">Recent Schemas</h2>
                        </div>
                        <Link
                            to="/all-schemas"
                            className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200"
                        >
                            View All <FaArrowRight className="ml-1" />
                        </Link>
                    </div>

                    {userSchemas.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">No schemas generated yet</p>
                            <Link
                                to="/upload"
                                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Generate Your First Schema
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {userSchemas.slice(0, 6).map((schema) => (
                                <SchemaCard
                                    key={schema.id}
                                    schema={schema}
                                    onDelete={handleDeleteSchema}
                                    onView={(id) => navigate(`/result/${id}`)}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard; 