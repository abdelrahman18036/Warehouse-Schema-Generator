import React, { useMemo, useCallback, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

const SchemaGraph = ({ data }) => {
    const [selectedNode, setSelectedNode] = useState(null);

    if (!data || typeof data !== 'object') {
        console.error('SchemaGraph: Received invalid data:', data);
        return <div className="text-center text-titanite">No schema data available.</div>;
    }

    console.log('Data received in SchemaGraph:', data);

    const schema = useMemo(() => data, [data]);

    const factTables = useMemo(() => {
        return Object.keys(schema).filter(tableName => {
            const table = schema[tableName];
            return table.fk_columns && table.fk_columns.length > 1;
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
        const radius = Math.max(300, totalTables * 50);
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Create nodes for all tables
        Object.keys(schema).forEach((tableName, index) => {
            const table = schema[tableName];
            const angle = (2 * Math.PI / totalTables) * index;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);

            const isFact = factTables.includes(tableName);

            const columns = table.columns.map(col => {
                let type = col.type;
                if (Array.isArray(col.constraints) && col.constraints.length > 0) {
                    type += ` (${col.constraints.join(', ')})`;
                } else if (typeof col.constraints === 'string' && col.constraints.trim() !== '') {
                    type += ` (${col.constraints})`;
                }
                return `${col.name}: ${type}`;
            }).join('\n');

            nodes.push({
                id: tableName,
                type: 'default',
                data: { label: `${isFact ? 'Fact: ' : 'Dim: '}${tableName}\n${columns}` },
                position: { x, y },
                style: {
                    background: isFact ? '#2dd4bf' : '#1e1e1e',
                    color: isFact ? '#1e1e1e' : '#2dd4bf',
                    border: '1px solid #0f766e',
                    width: 200,
                    padding: 10,
                    fontSize: 12,
                    textAlign: 'left',
                    whiteSpace: 'pre-wrap',
                },
            });
        });

        // Create edges based on foreign keys
        Object.keys(schema).forEach(tableName => {
            const table = schema[tableName];
            if (table.fk_columns && Array.isArray(table.fk_columns)) {
                table.fk_columns.forEach(fk => {
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
                            style: { stroke: '#2dd4bf' },
                            labelBgPadding: [8, 4],
                            labelBgBorderRadius: 4,
                            labelStyle: { fill: '#ffffff', fontWeight: 700 },
                            labelBgStyle: { fill: '#1e1e1e', color: '#ffffff', opacity: 0.7 },
                        });
                    }
                });
            }
        });

        return [...nodes, ...edges];
    }, [schema, factTables, dimensionTables]);

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

    return (
        <div className="relative w-full h-full bg-background">
            <ReactFlow
                nodes={elements.filter(el => !el.source)}
                edges={elements.filter(el => el.source)}
                onLoad={onLoad}
                onNodeClick={onNodeClick}
                fitView
                attributionPosition="bottom-left"
            >
                <Background color="#0f766e" gap={16} size={1} />
                <MiniMap
                    nodeStrokeColor={(n) => (factTables.includes(n.id) ? '#2dd4bf' : '#2dd4bf')}
                    nodeColor={(n) => (factTables.includes(n.id) ? '#2dd4bf' : '#1e1e1e')}
                    nodeBorderRadius={2}
                />
                <Controls />
            </ReactFlow>
            {selectedNode && (
                <div className="absolute top-10 left-10 bg-surface p-4 rounded-lg shadow-2xl text-titanite z-10 max-w-xs overflow-auto max-h-[80vh]">
                    <h3 className="text-xl font-bold mb-2">{selectedNode}</h3>
                    <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(schema[selectedNode], null, 2)}</pre>
                    <button onClick={closePopup} className="mt-2 bg-titanite text-background px-3 py-1 rounded">
                        Close
                    </button>
                </div>
            )}
        </div>
    );
};

export default SchemaGraph;