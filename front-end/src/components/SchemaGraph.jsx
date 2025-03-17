import React, { useMemo, useCallback, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

const SchemaGraph = ({ data }) => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedSchemaKey, setSelectedSchemaKey] = useState('original_schema');

    if (!data || typeof data !== 'object') {
        console.error('SchemaGraph: Received invalid data:', data);
        return <div className="text-center text-[#4361ee]">No schema data available.</div>;
    }

    const schema = useMemo(() => data[selectedSchemaKey] || {}, [data, selectedSchemaKey]);

    const factTables = useMemo(() => {
        return Object.keys(schema).filter(tableName => {
            const table = schema[tableName];
            return table.fk_columns && Array.isArray(table.fk_columns) && table.fk_columns.length > 1;
        });
    }, [schema]);

    const dimensionTables = useMemo(() => {
        return Object.keys(schema).filter(tableName => !factTables.includes(tableName));
    }, [schema, factTables]);

    const elements = useMemo(() => {
        const nodes = [];
        const edges = [];

        const totalTables = Object.keys(schema).length;
        if (totalTables === 0) return [];
        const radius = Math.max(350, totalTables * 60); // Increased radius for better spacing
        const centerX = 600; // Increased center position
        const centerY = 400; // Increased center position

        Object.keys(schema).forEach((tableName, index) => {
            const table = schema[tableName];
            const angle = (2 * Math.PI / totalTables) * index;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            const isFact = factTables.includes(tableName);

            const columns = Array.isArray(table.columns) ? table.columns.map(col => {
                if (!col.name || !col.type) return '';
                let type = col.type;
                if (Array.isArray(col.constraints) && col.constraints.length > 0) {
                    type += ` (${col.constraints.join(', ')})`;
                } else if (typeof col.constraints === 'string' && col.constraints.trim() !== '') {
                    type += ` (${col.constraints})`;
                }
                return `${col.name}: ${type}`;
            }).filter(Boolean).join('\n') : 'No columns available';

            nodes.push({
                id: tableName,
                type: 'default',
                data: { label: `${isFact ? 'Fact: ' : 'Dim: '}${tableName}\n${columns}` },
                position: { x, y },
                style: {
                    background: isFact ? '#4361ee' : '#F5F8FA',
                    color: isFact ? '#F5F8FA' : '#2b2b2b',
                    border: '2px solid #4361ee',
                    width: 240, // Increased width
                    padding: 15,
                    fontSize: 12,
                    textAlign: 'left',
                    whiteSpace: 'pre-wrap',
                    borderRadius: '10px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Added shadow
                },
            });
        });

        Object.keys(schema).forEach(tableName => {
            const table = schema[tableName];
            if (Array.isArray(table.columns)) {
                table.columns.forEach(col => {
                    if (col.constraints && Array.isArray(col.constraints)) {
                        col.constraints.forEach(constraint => {
                            if (typeof constraint === 'string' && constraint.toUpperCase().includes("REFERENCES")) {
                                const regex = /REFERENCES\s+(\w+)/i;
                                const match = constraint.match(regex);
                                if (match && match[1]) {
                                    const referencedTable = Object.keys(schema).find(
                                        t =>
                                            t.toLowerCase() === match[1].toLowerCase() ||
                                            t.toLowerCase() === match[1].toLowerCase() + 's'
                                    );
                                    if (referencedTable) {
                                        edges.push({
                                            id: `${tableName}-${col.name}->${referencedTable}`,
                                            source: tableName,
                                            target: referencedTable,
                                            animated: true,
                                            label: col.name,
                                            style: { stroke: '#4361ee', strokeWidth: 2 },
                                            labelStyle: { fill: '#2b2b2b', fontWeight: 700 },
                                            labelBgStyle: { fill: '#F5F8FA', color: '#2b2b2b', opacity: 0.9 },
                                            labelBgPadding: [4, 4],
                                            labelBgBorderRadius: 4,
                                        });
                                    }
                                }
                            }
                        });
                    }
                });
            }
        });

        return [...nodes, ...edges];
    }, [schema, factTables]);

    const onLoad = useCallback((reactFlowInstance) => {
        console.log('Graph loaded');
        reactFlowInstance.fitView();
    }, []);

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node.id);
    }, []);

    const closePopup = () => {
        setSelectedNode(null);
    };

    const handleSchemaChange = (e) => {
        setSelectedSchemaKey(e.target.value);
        setSelectedNode(null);
    };

    const availableSchemas = Object.keys(data).filter(key =>
        ['original_schema', 'ai_enhanced_schema'].includes(key)
    );
    const schemaDisplayNames = {
        original_schema: 'Original Schema',
        ai_enhanced_schema: 'Warehouse-Schema-Generated',

    };

    return (
        <div className="relative w-full h-[800px] bg-[#F5F8FA] rounded-lg overflow-hidden">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
                <div className="flex items-center">
                    <label htmlFor="schema-select" className="mr-2 text-[#2b2b2b] font-medium">Select Schema:</label>
                    <select
                        id="schema-select"
                        value={selectedSchemaKey}
                        onChange={handleSchemaChange}
                        className="px-3 py-2 bg-[#2b2b2b] border border-[#2b2b2b] rounded text-white cursor-pointer"
                    >
                        {availableSchemas.map(schemaKey => (
                            <option key={schemaKey} value={schemaKey}>
                                {schemaDisplayNames[schemaKey] || schemaKey.replace('_', ' ').toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-[#4361ee]"></div>
                        <span className="text-sm font-medium">Fact Tables</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-[#F5F8FA] border border-[#4361ee]"></div>
                        <span className="text-sm font-medium">Dimension Tables</span>
                    </span>
                </div>
            </div>

            {elements.length > 0 ? (
                <ReactFlow
                    nodes={elements.filter(el => !el.source)}
                    edges={elements.filter(el => el.source)}
                    onLoad={onLoad}
                    onNodeClick={onNodeClick}
                    fitView
                    attributionPosition="bottom-left"
                    className="bg-[#F5F8FA]"
                >
                    <Background color="#4361ee" gap={16} size={1} />
                    <MiniMap
                        nodeStrokeColor={(n) => (factTables.includes(n.id) ? '#4361ee' : '#2b2b2b')}
                        nodeColor={(n) => (factTables.includes(n.id) ? '#4361ee' : '#F5F8FA')}
                        nodeBorderRadius={2}
                        style={{ height: 140, background: '#F5F8FA', border: '2px solid #4361ee' }}
                    />
                    <Controls />
                </ReactFlow>
            ) : (
                <div className="flex items-center justify-center h-full text-[#4361ee]">
                    No tables to display in the selected schema.
                </div>
            )}

            {/* Improved Selected Node Display */}
            {selectedNode && schema[selectedNode] && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h3 className="text-2xl font-bold text-[#4361ee]">
                                {factTables.includes(selectedNode) ? "Fact Table: " : "Dimension Table: "}
                                {selectedNode}
                            </h3>
                            <button
                                onClick={closePopup}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {schema[selectedNode].columns && schema[selectedNode].columns.length > 0 ? (
                            <div className="mb-6">
                                <h4 className="font-semibold text-lg mb-3">Columns</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Constraints</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {schema[selectedNode].columns.map((column, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 text-sm">{column.name}</td>
                                                    <td className="px-4 py-2 text-sm">{column.type}</td>
                                                    <td className="px-4 py-2 text-sm">
                                                        {Array.isArray(column.constraints) && column.constraints.length > 0 ? (
                                                            <span className="text-sm">
                                                                {column.constraints.join(', ')}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-6">
                                <p className="text-gray-500">No columns defined for this table.</p>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={closePopup}
                                className="bg-[#4361ee] hover:bg-[#3252d3] text-white px-5 py-2 rounded-md transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchemaGraph;