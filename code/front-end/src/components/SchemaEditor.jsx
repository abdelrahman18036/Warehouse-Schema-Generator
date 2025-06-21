import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEdit, FaSave, FaTimes, FaPlus, FaTrash, FaDatabase, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import { tokenManager } from '../utils/auth';

const SchemaEditor = ({ schemaData, schemaType, schemaId, onSchemaUpdate }) => {
    const [editingSchema, setEditingSchema] = useState({});
    const [editingCell, setEditingCell] = useState(null);
    const [tempValue, setTempValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // Initialize editing schema from props
    useEffect(() => {
        if (schemaData) {
            const cleanedSchema = JSON.parse(JSON.stringify(schemaData));

            // Ensure all columns have required fields
            Object.keys(cleanedSchema).forEach(tableKey => {
                if (cleanedSchema[tableKey].columns) {
                    cleanedSchema[tableKey].columns.forEach(column => {
                        // Ensure constraints field exists
                        if (!column.constraints) {
                            column.constraints = [];
                        }
                        // Ensure name and type exist
                        if (!column.name) {
                            column.name = 'unnamed_column';
                        }
                        if (!column.type) {
                            column.type = 'VARCHAR(255)';
                        }
                    });
                }
            });

            setEditingSchema(cleanedSchema);
        }
    }, [schemaData]);

    // Common data types for dropdown
    const commonDataTypes = [
        'VARCHAR(255)', 'INT', 'BIGINT', 'DECIMAL(10,2)', 'BOOLEAN', 'DATE', 'DATETIME',
        'TIMESTAMP', 'TEXT', 'CHAR(10)', 'FLOAT', 'DOUBLE', 'JSON', 'UUID'
    ];

    // Common constraints
    const commonConstraints = [
        'PRIMARY KEY', 'FOREIGN KEY', 'NOT NULL', 'UNIQUE', 'AUTO_INCREMENT', 'DEFAULT'
    ];

    const handleCellEdit = (tableKey, columnIndex, field, value) => {
        const newSchema = { ...editingSchema };
        if (field === 'constraints') {
            // Handle constraints as array
            const constraintsArray = value.split(',').map(c => c.trim()).filter(c => c);
            newSchema[tableKey].columns[columnIndex][field] = constraintsArray;
        } else {
            newSchema[tableKey].columns[columnIndex][field] = value;
        }

        // Ensure constraints field always exists
        if (!newSchema[tableKey].columns[columnIndex].constraints) {
            newSchema[tableKey].columns[columnIndex].constraints = [];
        }

        setEditingSchema(newSchema);
    };

    const addColumn = (tableKey) => {
        const newSchema = { ...editingSchema };
        const newColumn = {
            name: 'new_column',
            type: 'VARCHAR(255)',
            constraints: []
        };
        newSchema[tableKey].columns.push(newColumn);
        setEditingSchema(newSchema);
    };

    const removeColumn = (tableKey, columnIndex) => {
        const newSchema = { ...editingSchema };
        newSchema[tableKey].columns.splice(columnIndex, 1);
        setEditingSchema(newSchema);
    };

    const addTable = () => {
        const tableName = prompt('Enter table name:');
        if (tableName && !editingSchema[tableName]) {
            const newSchema = { ...editingSchema };
            newSchema[tableName] = {
                columns: [{
                    name: 'id',
                    type: 'INT',
                    constraints: ['PRIMARY KEY', 'AUTO_INCREMENT']
                }]
            };
            setEditingSchema(newSchema);
        }
    };

    const removeTable = (tableKey) => {
        if (window.confirm(`Are you sure you want to remove table "${tableKey}"?`)) {
            const newSchema = { ...editingSchema };
            delete newSchema[tableKey];
            setEditingSchema(newSchema);
        }
    };

    const saveSchema = async () => {
        setSaving(true);
        setMessage(null);

        try {
            // Ensure all columns have required fields before saving
            const cleanedSchema = { ...editingSchema };
            Object.keys(cleanedSchema).forEach(tableKey => {
                if (cleanedSchema[tableKey].columns) {
                    cleanedSchema[tableKey].columns.forEach(column => {
                        // Ensure constraints field exists
                        if (!column.constraints) {
                            column.constraints = [];
                        }
                        // Ensure name and type exist
                        if (!column.name) {
                            column.name = 'unnamed_column';
                        }
                        if (!column.type) {
                            column.type = 'VARCHAR(255)';
                        }
                    });
                }
            });

            const endpoint = schemaType === 'warehouse'
                ? `http://localhost:8000/api/schema/warehouse_schema/${schemaId}/`
                : `http://localhost:8000/api/schema/ai_enhanced_schema/${schemaId}/`;

            // Create headers with authentication
            const headers = {
                'Authorization': `Bearer ${tokenManager.getAccessToken()}`,
                'Content-Type': 'application/json'
            };

            const response = await axios.put(endpoint, {
                schema: cleanedSchema
            }, { headers });

            setMessage({ type: 'success', text: 'Schema saved successfully!' });

            // Call the callback to update parent component
            if (onSchemaUpdate) {
                onSchemaUpdate(cleanedSchema);
            }

            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Error saving schema:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Failed to save schema'
            });
            setTimeout(() => setMessage(null), 5000);
        } finally {
            setSaving(false);
        }
    };

    const resetSchema = () => {
        if (window.confirm('Are you sure you want to reset all changes?')) {
            setEditingSchema(JSON.parse(JSON.stringify(schemaData)));
            setMessage({ type: 'info', text: 'Changes reset successfully' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const EditableCell = ({ value, onSave, type = 'text', options = null }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [editValue, setEditValue] = useState(value);

        const handleSave = () => {
            onSave(editValue);
            setIsEditing(false);
        };

        const handleCancel = () => {
            setEditValue(value);
            setIsEditing(false);
        };

        if (isEditing) {
            return (
                <div className="flex items-center gap-2 min-w-0">
                    {options ? (
                        <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 min-w-0 px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        >
                            {options.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type={type}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 min-w-0 px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') handleCancel();
                            }}
                        />
                    )}
                    <button
                        onClick={handleSave}
                        className="p-1 text-green-600 hover:text-green-800 transition-colors"
                    >
                        <FaCheck size={10} />
                    </button>
                    <button
                        onClick={handleCancel}
                        className="p-1 text-red-600 hover:text-red-800 transition-colors"
                    >
                        <FaTimes size={10} />
                    </button>
                </div>
            );
        }

        return (
            <div
                onClick={() => setIsEditing(true)}
                className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors min-h-[24px] flex items-center"
                title="Click to edit"
            >
                <span className="text-xs truncate">{value || 'Click to edit'}</span>
            </div>
        );
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-lg border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FaDatabase className="text-blue-600" />
                        <h3 className="text-lg font-semibold text-slate-800">
                            Edit {schemaType === 'warehouse' ? 'Warehouse' : 'AI Enhanced'} Schema
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={addTable}
                            className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center gap-1"
                        >
                            <FaPlus size={12} />
                            Add Table
                        </button>
                        <button
                            onClick={resetSchema}
                            className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                        >
                            Reset
                        </button>
                        <button
                            onClick={saveSchema}
                            disabled={saving}
                            className="px-4 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
                        >
                            <FaSave size={12} />
                            {saving ? 'Saving...' : 'Save Schema'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Success/Error Message */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`px-6 py-3 border-b ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                            message.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                                'bg-blue-50 border-blue-200 text-blue-800'
                            }`}
                    >
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Schema Tables */}
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
                {Object.entries(editingSchema).map(([tableKey, tableData]) => (
                    <motion.div
                        key={tableKey}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-slate-200 rounded-lg overflow-hidden"
                    >
                        {/* Table Header */}
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                {tableKey}
                            </h4>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => addColumn(tableKey)}
                                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors flex items-center gap-1"
                                >
                                    <FaPlus size={10} />
                                    Column
                                </button>
                                <button
                                    onClick={() => removeTable(tableKey)}
                                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                                >
                                    <FaTrash size={10} />
                                </button>
                            </div>
                        </div>

                        {/* Columns Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Column Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Data Type</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Constraints</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.columns?.map((column, columnIndex) => (
                                        <tr key={columnIndex} className="border-t border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-2">
                                                <EditableCell
                                                    value={column.name}
                                                    onSave={(value) => handleCellEdit(tableKey, columnIndex, 'name', value)}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <EditableCell
                                                    value={column.type}
                                                    onSave={(value) => handleCellEdit(tableKey, columnIndex, 'type', value)}
                                                    options={commonDataTypes}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <EditableCell
                                                    value={Array.isArray(column.constraints) ? column.constraints.join(', ') : column.constraints}
                                                    onSave={(value) => handleCellEdit(tableKey, columnIndex, 'constraints', value)}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <button
                                                    onClick={() => removeColumn(tableKey, columnIndex)}
                                                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                                                    title="Remove column"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                ))}
            </div>

            {Object.keys(editingSchema).length === 0 && (
                <div className="p-12 text-center text-slate-500">
                    <FaDatabase size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">No schema data available</p>
                    <p className="text-sm">Upload a schema file to start editing</p>
                </div>
            )}
        </div>
    );
};

export default SchemaEditor; 