// src/components/SchemaGraph.jsx
import React, { useMemo, useCallback, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

const SchemaGraph = ({ data }) => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedSchemaKey, setSelectedSchemaKey] = useState('ai_enhanced_schema'); // Allow selecting schema

    if (!data || typeof data !== 'object') {
        console.error('SchemaGraph: Received invalid data:', data);
        return <div className="text-center text-teal-400">No schema data available.</div>;
    }

    console.log('Data received in SchemaGraph:', data);

    const schema = useMemo(() => data[selectedSchemaKey] || {}, [data, selectedSchemaKey]);

    const factTables = useMemo(() => {
        return Object.keys(schema).filter(tableName => {
            const table = schema[tableName];
            return table.fk_columns && Array.isArray(table.fk_columns) && table.fk_columns.length > 1;
        });
    }, [schema]);

    console.log('Fact tables:', factTables);

    const dimensionTables = useMemo(() => {
        return Object.keys(schema).filter(tableName => !factTables.includes(tableName));
    }, [schema, factTables]);

    console.log('Dimension tables:', dimensionTables);

    const elements = useMemo(() => {
        const nodes = [];
        const edges = [];

        const totalTables = Object.keys(schema).length;
        if (totalTables === 0) return [];
        const radius = Math.max(300, totalTables * 50);
        const centerX = 500; // Fixed center to match ReactFlow's coordinate system
        const centerY = 300;

        // Create nodes for all tables
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
                    background: isFact ? '#2dd4bf' : '#1e1e1e',
                    color: isFact ? '#1e1e1e' : '#2dd4bf',
                    border: '2px solid #0f766e',
                    width: 220,
                    padding: 15,
                    fontSize: 12,
                    textAlign: 'left',
                    whiteSpace: 'pre-wrap',
                    borderRadius: '10px',
                },
            });
        });

        // Create edges based on foreign keys
        Object.keys(schema).forEach(tableName => {
            const table = schema[tableName];
            if (table.fk_columns && Array.isArray(table.fk_columns)) {
                table.fk_columns.forEach(fk => {
                    if (!fk || typeof fk !== 'string') return;
                    const baseName = fk.toLowerCase().replace('_id', '');
                    const referencedTable = Object.keys(schema).find(
                        t => t.toLowerCase() === baseName || t.toLowerCase() === baseName + 's'
                    );
                    if (referencedTable) {
                        edges.push({
                            id: `${tableName}-${fk}->${referencedTable}`,
                            source: tableName,
                            target: referencedTable,
                            animated: true,
                            label: fk,
                            style: { stroke: '#2dd4bf', strokeWidth: 2 },
                            labelStyle: { fill: '#ffffff', fontWeight: 700 },
                            labelBgStyle: { fill: '#1e1e1e', color: '#ffffff', opacity: 0.7 },
                            labelBgPadding: [4, 4],
                            labelBgBorderRadius: 4,
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
        ['ai_enhanced_schema', 'original_schema'].includes(key)
        // ['ai_enhanced_schema', 'original_schema', 'warehouse_schema'].includes(key)

    );

    return (
        <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden">
            {/* Schema Selector */}
            <div className="absolute top-4 left-4 z-10">
                <label htmlFor="schema-select" className="mr-2 text-teal-300">Select Schema:</label>
                <select
                    id="schema-select"
                    value={selectedSchemaKey}
                    onChange={handleSchemaChange}
                    className="px-3 py-1 bg-gray-800 border border-teal-300 rounded text-teal-300"
                >
                    {availableSchemas.map(schemaKey => (
                        <option key={schemaKey} value={schemaKey}>
                            {schemaKey.replace('_', ' ').toUpperCase()}
                        </option>
                    ))}
                </select>
            </div>

            {elements.length > 0 ? (
                <ReactFlow
                    nodes={elements.filter(el => !el.source)}
                    edges={elements.filter(el => el.source)}
                    onLoad={onLoad}
                    onNodeClick={onNodeClick}
                    fitView
                    attributionPosition="bottom-left"
                    className="bg-gray-900"
                >
                    <Background color="#0f766e" gap={16} size={1} />
                    <MiniMap
                        nodeStrokeColor={(n) => (factTables.includes(n.id) ? '#2dd4bf' : '#1e1e1e')}
                        nodeColor={(n) => (factTables.includes(n.id) ? '#2dd4bf' : '#1e1e1e')}
                        nodeBorderRadius={2}
                        style={{ height: 120, background: '#1e1e1e', border: '2px solid #0f766e' }}
                    />
                    <Controls />
                </ReactFlow>
            ) : (
                <div className="flex items-center justify-center h-full text-teal-400">
                    No tables to display in the selected schema.
                </div>
            )}

            {selectedNode && schema[selectedNode] && (
                <div className="absolute top-10 left-10 bg-gray-800 p-6 rounded-lg shadow-2xl text-teal-400 z-20 max-w-sm overflow-auto max-h-[80vh]">
                    <h3 className="text-2xl font-bold mb-4">{selectedNode}</h3>
                    <pre className="whitespace-pre-wrap text-sm">
                        {JSON.stringify(schema[selectedNode], null, 2)}
                    </pre>
                    <button
                        onClick={closePopup}
                        className="mt-4 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded transition"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

export default SchemaGraph;
