import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

const SchemaGraph = ({ data }) => {
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedSchemaKey, setSelectedSchemaKey] = useState('original_schema');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const reactFlowWrapper = useRef(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

    // Use nodes and edges state from ReactFlow
    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);

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

    // Generate nodes and edges whenever schema changes
    useEffect(() => {
        const generateElements = () => {
            const nodesArray = [];
            const edgesArray = [];

            const totalTables = Object.keys(schema).length;
            if (totalTables === 0) return { nodes: [], edges: [] };
            const radius = Math.max(350, totalTables * 60);
            const centerX = 600;
            const centerY = 400;

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

                nodesArray.push({
                    id: tableName,
                    type: 'default',
                    data: { label: `${isFact ? 'Fact: ' : 'Dim: '}${tableName}\n${columns}` },
                    position: { x, y },
                    draggable: true,
                    style: {
                        background: isFact ? '#4361ee' : '#F5F8FA',
                        color: isFact ? '#F5F8FA' : '#2b2b2b',
                        border: '2px solid #4361ee',
                        width: 240,
                        padding: 15,
                        fontSize: 12,
                        textAlign: 'left',
                        whiteSpace: 'pre-wrap',
                        borderRadius: '10px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        cursor: 'move',
                        transition: 'background 0.3s, box-shadow 0.3s', // Add smooth transitions
                    },
                });
            });

            // Create edges
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
                                            edgesArray.push({
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

            return { nodes: nodesArray, edges: edgesArray };
        };

        const { nodes: newNodes, edges: newEdges } = generateElements();
        setNodes(newNodes);
        setEdges(newEdges);

        // Reset ReactFlow instance when schema changes
        if (reactFlowInstance) {
            setTimeout(() => {
                reactFlowInstance.fitView({ padding: 0.2 });
            }, 50);
        }
    }, [schema, factTables, setNodes, setEdges, reactFlowInstance]);

    // Handle node drag with smooth transitions
    const onNodeDrag = useCallback((_, node) => {
        // Update node during drag for smoother appearance
        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === node.id) {
                    return {
                        ...n,
                        position: node.position,
                        style: {
                            ...n.style,
                            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)', // Enhanced shadow during drag
                        }
                    };
                }
                return n;
            })
        );
    }, [setNodes]);

    // When drag stops, reset shadow but keep position
    const onNodeDragStop = useCallback((_, node) => {
        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === node.id) {
                    return {
                        ...n,
                        position: node.position,
                        style: {
                            ...n.style,
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Return to normal shadow
                        }
                    };
                }
                return n;
            })
        );
    }, [setNodes]);

    // Use onInit for newer versions of ReactFlow
    const onInit = useCallback((instance) => {
        setReactFlowInstance(instance);
        setTimeout(() => {
            instance.fitView({ padding: 0.2 });
        }, 50);
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

    // Improved fullscreen toggle with proper document handling
    const toggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => !prev);
    }, []);

    // Handle fullscreen effect separately
    useEffect(() => {
        if (isFullscreen) {
            // Apply styles to prevent body scrolling
            document.body.style.overflow = 'hidden';

            // Give a small delay for the DOM to update before refitting the flow
            const timer = setTimeout(() => {
                if (reactFlowInstance) {
                    reactFlowInstance.fitView({ padding: 0.2 });
                }
            }, 200);

            return () => {
                clearTimeout(timer);
                document.body.style.overflow = '';
            };
        } else {
            document.body.style.overflow = '';

            // Also refit when exiting fullscreen
            const timer = setTimeout(() => {
                if (reactFlowInstance) {
                    reactFlowInstance.fitView({ padding: 0.2 });
                }
            }, 200);

            return () => clearTimeout(timer);
        }
    }, [isFullscreen, reactFlowInstance]);

    const availableSchemas = Object.keys(data).filter(key =>
        ['original_schema', 'ai_enhanced_schema'].includes(key)
    );

    const schemaDisplayNames = {
        original_schema: 'Original Schema',
        ai_enhanced_schema: 'Warehouse-Schema-Generated',
    };

    return (
        <div
            ref={reactFlowWrapper}
            className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative w-full h-[800px]'} bg-[#F5F8FA] rounded-lg overflow-hidden transition-all duration-300`}
        >
            <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-4">
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

                {/* Fullscreen toggle button */}
                <button
                    onClick={toggleFullscreen}
                    className="px-3 py-2 bg-[#2b2b2b] text-white rounded-md flex items-center gap-1 hover:bg-gray-800 transition-colors"
                >
                    {isFullscreen ? (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Exit Fullscreen
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                            </svg>
                            Fullscreen
                        </>
                    )}
                </button>
            </div>

            {nodes.length > 0 ? (
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodeDrag={onNodeDrag}
                    onNodeDragStop={onNodeDragStop}
                    onInit={onInit}
                    onNodeClick={onNodeClick}
                    fitView
                    attributionPosition="bottom-left"
                    className="bg-[#F5F8FA]"
                    zoomOnScroll={true}
                    panOnScroll={true}
                    nodesDraggable={true}
                    elementsSelectable={true}
                    minZoom={0.2}
                    maxZoom={4}
                    defaultViewport={{ x: 0, y: 0, zoom: 1 }}
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
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[60]">
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