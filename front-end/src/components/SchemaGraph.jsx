import React, { useMemo, useCallback, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

const SchemaGraph = ({ data }) => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedSchemaKey, setSelectedSchemaKey] = useState('ai_enhanced_schema');

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
        const radius = Math.max(300, totalTables * 50);
        const centerX = 500;
        const centerY = 300;

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
                    width: 220,
                    padding: 15,
                    fontSize: 12,
                    textAlign: 'left',
                    whiteSpace: 'pre-wrap',
                    borderRadius: '10px',
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
        ['ai_enhanced_schema', 'original_schema'].includes(key)
    );
    const schemaDisplayNames = {
        ai_enhanced_schema: 'Warehouse-Schema-Generated',
        original_schema: 'Original Schema'
    };

    return (
        <div className="relative w-full h-full bg-[#F5F8FA] rounded-lg overflow-hidden">
            <div className="absolute top-4 left-4 z-10">
                <label htmlFor="schema-select" className="mr-2 text-[#2b2b2b]">Select Schema:</label>
                <select
                    id="schema-select"
                    value={selectedSchemaKey}
                    onChange={handleSchemaChange}
                    className="px-3 py-1 bg-[#4361ee] border border-[#2b2b2b] rounded text-white"
                >
                    {availableSchemas.map(schemaKey => (
                        <option key={schemaKey} value={schemaKey}>
                            {schemaDisplayNames[schemaKey] || schemaKey.replace('_', ' ').toUpperCase()}
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
                    className="bg-[#F5F8FA]"
                >
                    <Background color="#4361ee" gap={16} size={1} />
                    <MiniMap
                        nodeStrokeColor={(n) => (factTables.includes(n.id) ? '#4361ee' : '#2b2b2b')}
                        nodeColor={(n) => (factTables.includes(n.id) ? '#4361ee' : '#F5F8FA')}
                        nodeBorderRadius={2}
                        style={{ height: 120, background: '#F5F8FA', border: '2px solid #4361ee' }}
                    />
                    <Controls />
                </ReactFlow>
            ) : (
                <div className="flex items-center justify-center h-full text-[#4361ee]">
                    No tables to display in the selected schema.
                </div>
            )}

            {selectedNode && schema[selectedNode] && (
                <div className="absolute top-10 left-10 bg-white p-6 rounded-lg shadow-2xl text-[#2b2b2b] z-20 max-w-sm overflow-auto max-h-[80vh]">
                    <h3 className="text-2xl font-bold mb-4">{selectedNode}</h3>
                    <pre className="whitespace-pre-wrap text-sm">
                        {JSON.stringify(schema[selectedNode], null, 2)}
                    </pre>
                    <button
                        onClick={closePopup}
                        className="mt-4 bg-[#4361ee] hover:bg-[#2b2b2b] text-white px-4 py-2 rounded transition"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

export default SchemaGraph;
