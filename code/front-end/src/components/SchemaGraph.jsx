import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
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
        return (
            <div className="flex items-center justify-center h-64 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border border-slate-200">
                <div className="text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <div className="text-xl font-semibold text-slate-600">No schema data available</div>
                </div>
            </div>
        );
    }

    const schema = useMemo(() => data[selectedSchemaKey] || {}, [data, selectedSchemaKey]);

    const factTables = useMemo(() => {
        // For original schema, no fact tables (all should be white)
        if (selectedSchemaKey === 'original_schema') {
            return [];
        }

        return Object.keys(schema).filter(tableName => {
            const table = schema[tableName];
            // Enhanced fact table detection for warehouse and AI schemas only
            const lowerName = tableName.toLowerCase();
            const isFactByName = lowerName.includes('fact') ||
                lowerName.includes('sales') ||
                lowerName.includes('transaction') ||
                lowerName.includes('order') ||
                lowerName.includes('event');

            // Count foreign keys
            let fkCount = 0;
            if (table.columns && Array.isArray(table.columns)) {
                fkCount = table.columns.filter(col => {
                    if (!col.constraints) return false;
                    const constraints = Array.isArray(col.constraints) ? col.constraints : [col.constraints];
                    return constraints.some(constraint =>
                        typeof constraint === 'string' &&
                        (constraint.toUpperCase().includes('FOREIGN KEY') ||
                            constraint.toUpperCase().includes('REFERENCES'))
                    ) || col.name.toLowerCase().endsWith('_id') || col.name.toLowerCase().endsWith('_key');
                }).length;
            }

            return isFactByName || fkCount > 2;
        });
    }, [schema, selectedSchemaKey]);

    const dimensionTables = useMemo(() => {
        return Object.keys(schema).filter(tableName => !factTables.includes(tableName));
    }, [schema, factTables]);

    // Enhanced connection detection function
    const detectConnections = useCallback((schema) => {
        const connections = [];

        Object.keys(schema).forEach(tableName => {
            const table = schema[tableName];
            if (!table.columns || !Array.isArray(table.columns)) return;

            table.columns.forEach(col => {
                if (!col.name) return;

                const columnName = col.name.toLowerCase();
                let referencedTable = null;

                // Method 1: Check type field for foreign key format like "customers(customer_id)"
                if (col.type && typeof col.type === 'string') {
                    const typeMatch = col.type.match(/^(\w+)\(/);
                    if (typeMatch) {
                        const refTableName = typeMatch[1];
                        referencedTable = Object.keys(schema).find(t =>
                            t.toLowerCase() === refTableName.toLowerCase()
                        );
                        if (referencedTable && referencedTable !== tableName) {
                            connections.push({
                                id: `${tableName}-${col.name}->${referencedTable}`,
                                source: tableName,
                                target: referencedTable,
                                label: col.name,
                                animated: true
                            });
                            return; // Found connection, skip other methods
                        }
                    }
                }

                // Method 2: Check constraints for explicit REFERENCES
                if (col.constraints) {
                    const constraints = Array.isArray(col.constraints) ? col.constraints : [col.constraints];

                    for (const constraint of constraints) {
                        if (typeof constraint === 'string') {
                            // Handle "FOREIGN KEY REFERENCES table_name" format
                            const referencesMatch = constraint.match(/FOREIGN\s+KEY\s+REFERENCES\s+(\w+)/i) ||
                                constraint.match(/REFERENCES\s+(\w+)/i);
                            if (referencesMatch) {
                                const refTableName = referencesMatch[1];
                                referencedTable = Object.keys(schema).find(t =>
                                    t.toLowerCase() === refTableName.toLowerCase()
                                );
                                if (referencedTable && referencedTable !== tableName) {
                                    connections.push({
                                        id: `${tableName}-${col.name}->${referencedTable}`,
                                        source: tableName,
                                        target: referencedTable,
                                        label: col.name,
                                        animated: true
                                    });
                                    return; // Found connection, skip other methods
                                }
                            }

                            // Handle "FOREIGN KEY" constraint with column name inference
                            if (constraint.toUpperCase().includes('FOREIGN KEY')) {
                                if (columnName.endsWith('_id')) {
                                    const baseName = columnName.replace(/_id$/, '');
                                    referencedTable = Object.keys(schema).find(t => {
                                        const tLower = t.toLowerCase();
                                        return tLower === baseName ||
                                            tLower === baseName + 's' ||
                                            baseName === tLower.slice(0, -1);
                                    });
                                    if (referencedTable && referencedTable !== tableName) {
                                        connections.push({
                                            id: `${tableName}-${col.name}->${referencedTable}`,
                                            source: tableName,
                                            target: referencedTable,
                                            label: col.name,
                                            animated: true
                                        });
                                        return; // Found connection, skip other methods
                                    }
                                }
                            }
                        }
                    }
                }

                // Method 3: Infer from column naming patterns (only if no explicit reference found)
                if (columnName.endsWith('_id')) {
                    const baseName = columnName.replace(/_id$/, '');
                    referencedTable = Object.keys(schema).find(t => {
                        const tLower = t.toLowerCase();
                        return tLower === baseName ||
                            tLower === baseName + 's' ||
                            baseName === tLower.slice(0, -1);
                    });

                    if (referencedTable && referencedTable !== tableName) {
                        connections.push({
                            id: `${tableName}-${col.name}->${referencedTable}`,
                            source: tableName,
                            target: referencedTable,
                            label: col.name,
                            animated: true
                        });
                    }
                }
            });
        });

        // Remove duplicate connections
        const uniqueConnections = connections.filter((conn, index, self) =>
            index === self.findIndex(c => c.id === conn.id)
        );

        return uniqueConnections;
    }, []);

    // Generate nodes and edges whenever schema changes
    useEffect(() => {
        const generateElements = () => {
            const nodesArray = [];
            const edgesArray = [];

            const tableNames = Object.keys(schema);
            const totalTables = tableNames.length;

            if (totalTables === 0) return { nodes: [], edges: [] };

            // Improved positioning algorithm
            const centerX = 600;
            const centerY = 400;
            const baseRadius = Math.max(350, totalTables * 45);

            tableNames.forEach((tableName, index) => {
                const table = schema[tableName];
                const isFact = factTables.includes(tableName);

                let x, y;

                // Consistent positioning for all nodes
                if (totalTables === 1) {
                    // Single table in center
                    x = centerX;
                    y = centerY;
                } else if (isFact && factTables.length > 0) {
                    // Place fact tables in inner circle or center
                    const factIndex = factTables.indexOf(tableName);
                    if (factTables.length === 1) {
                        x = centerX;
                        y = centerY;
                    } else {
                        const factRadius = Math.min(200, baseRadius * 0.4);
                        const angle = (2 * Math.PI / factTables.length) * factIndex;
                        x = centerX + factRadius * Math.cos(angle);
                        y = centerY + factRadius * Math.sin(angle);
                    }
                } else {
                    // Place dimension tables in outer circle
                    const dimIndex = dimensionTables.indexOf(tableName);
                    const totalDimensions = dimensionTables.length;
                    if (totalDimensions > 0) {
                        const angle = (2 * Math.PI / totalDimensions) * dimIndex;
                        const radius = baseRadius;
                        x = centerX + radius * Math.cos(angle);
                        y = centerY + radius * Math.sin(angle);
                    } else {
                        // Fallback positioning
                        const angle = (2 * Math.PI / totalTables) * index;
                        x = centerX + baseRadius * Math.cos(angle);
                        y = centerY + baseRadius * Math.sin(angle);
                    }
                }

                // Format columns for display
                const columns = Array.isArray(table.columns) ? table.columns.map(col => {
                    if (!col.name || !col.type) return '';
                    let display = `• ${col.name}: ${col.type}`;
                    if (col.constraints && Array.isArray(col.constraints) && col.constraints.length > 0) {
                        const constraintStr = col.constraints.filter(c => c && c.trim()).join(', ');
                        if (constraintStr) display += ` (${constraintStr})`;
                    }
                    return display;
                }).filter(Boolean).join('\n') : 'No columns';

                const displayText = columns.length > 400 ?
                    columns.substring(0, 400) + '...' : columns;

                // Consistent node configuration for all tables
                nodesArray.push({
                    id: tableName,
                    type: 'default',
                    data: {
                        label: `${isFact ? '🎯 ' : '📋 '}${tableName}\n\n${displayText}`
                    },
                    position: { x: Math.round(x), y: Math.round(y) },
                    draggable: true,
                    selectable: true,
                    deletable: false,
                    connectable: false,
                    sourcePosition: 'right',
                    targetPosition: 'left',
                    style: {
                        background: isFact
                            ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)'
                            : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
                        color: isFact ? '#ffffff' : '#1e293b',
                        border: isFact
                            ? '3px solid #2563eb'
                            : '3px solid #94a3b8',
                        borderRadius: '18px',
                        width: 300,
                        minHeight: 140,
                        padding: '20px',
                        fontSize: '13px',
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        fontWeight: '500',
                        lineHeight: '1.45',
                        textAlign: 'left',
                        whiteSpace: 'pre-wrap',
                        boxShadow: isFact
                            ? '0 20px 40px -12px rgba(59, 130, 246, 0.35)'
                            : '0 8px 20px -8px rgba(0, 0, 0, 0.12)',
                        cursor: 'grab',
                        userSelect: 'none',
                    },
                });
            });

            // Generate edges using improved detection
            const connections = detectConnections(schema);
            connections.forEach(conn => {
                edgesArray.push({
                    id: conn.id,
                    source: conn.source,
                    target: conn.target,
                    sourceHandle: 'right',
                    targetHandle: 'left',
                    animated: true,
                    label: conn.label,
                    type: 'step',
                    style: {
                        stroke: '#6366f1',
                        strokeWidth: 3,
                        strokeDasharray: '4 4'
                    },
                    labelStyle: {
                        fill: '#334155',
                        fontWeight: 600,
                        fontSize: '12px',
                        fontFamily: "'Inter', sans-serif",
                    },
                    labelBgStyle: {
                        fill: 'rgba(255, 255, 255, 0.9)',
                        stroke: '#cbd5e1',
                        strokeWidth: 1,
                        opacity: 0.9,
                        rx: 8,
                        ry: 8,
                    },
                    labelBgPadding: [8, 4],
                    labelBgBorderRadius: 8,
                });
            });

            console.log(`Generated ${nodesArray.length} nodes and ${edgesArray.length} edges for ${selectedSchemaKey}`);
            return { nodes: nodesArray, edges: edgesArray };
        };

        const { nodes: newNodes, edges: newEdges } = generateElements();
        setNodes(newNodes);
        setEdges(newEdges);

        // Auto-fit view after elements are set
        if (reactFlowInstance) {
            setTimeout(() => {
                reactFlowInstance.fitView({ padding: 0.1, duration: 500 });
            }, 100);
        }
    }, [schema, factTables, dimensionTables, selectedSchemaKey, setNodes, setEdges, reactFlowInstance, detectConnections]);

    // Fixed node changes handler that preserves positions
    const onNodesChange = useCallback((changes) => {
        setNodes((nds) => {
            return applyNodeChanges(changes, nds);
        });
    }, [setNodes]);

    // Fixed edge changes handler
    const onEdgesChange = useCallback((changes) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));
    }, [setEdges]);

    // Remove the drag start and drag stop handlers - let ReactFlow handle it naturally
    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node.id);
    }, []);

    const onInit = useCallback((instance) => {
        setReactFlowInstance(instance);
        setTimeout(() => {
            instance.fitView({ padding: 0.1, duration: 500 });
        }, 100);
    }, []);

    const closePopup = () => {
        setSelectedNode(null);
    };

    const handleSchemaChange = (e) => {
        setSelectedSchemaKey(e.target.value);
        setSelectedNode(null);
    };

    const toggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => !prev);
    }, []);

    // Handle fullscreen effect
    useEffect(() => {
        if (isFullscreen) {
            document.body.style.overflow = 'hidden';
            const timer = setTimeout(() => {
                if (reactFlowInstance) {
                    reactFlowInstance.fitView({ padding: 0.05, duration: 600 });
                }
            }, 200);
            return () => {
                clearTimeout(timer);
                document.body.style.overflow = '';
            };
        } else {
            document.body.style.overflow = '';
            const timer = setTimeout(() => {
                if (reactFlowInstance) {
                    reactFlowInstance.fitView({ padding: 0.1, duration: 600 });
                }
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isFullscreen, reactFlowInstance]);

    const availableSchemas = Object.keys(data).filter(key =>
        ['original_schema', 'warehouse_schema', 'ai_enhanced_schema'].includes(key)
    ).filter(key => data[key] && Object.keys(data[key]).length > 0);

    const getSchemaDisplayName = (key) => {
        const names = {
            'original_schema': 'Original Schema',
            'warehouse_schema': 'Warehouse Schema',
            'ai_enhanced_schema': 'AI Enhanced Data Warehouse'
        };
        return names[key] || key;
    };

    const selectedTable = selectedNode ? schema[selectedNode] : null;

    return (
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'} w-full h-full`}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                <div className="flex items-center space-x-4">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Database Schema Visualization
                    </h2>
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                            {Object.keys(schema).length} Tables
                        </span>
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                            {edges.length} Connections
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <select
                        value={selectedSchemaKey}
                        onChange={handleSchemaChange}
                        className="px-4 py-2 border border-slate-300 rounded-xl bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                        {availableSchemas.map(key => (
                            <option key={key} value={key}>
                                {getSchemaDisplayName(key)}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={toggleFullscreen}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                    >
                        {isFullscreen ? '↙ Exit Fullscreen' : '↗ Fullscreen'}
                    </button>
                </div>
            </div>

            {/* ReactFlow Container */}
            <div className="w-full h-full" ref={reactFlowWrapper} style={{ height: isFullscreen ? 'calc(100vh - 80px)' : '600px' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    onInit={onInit}
                    nodesDraggable={true}
                    nodesConnectable={false}
                    elementsSelectable={true}
                    selectNodesOnDrag={false}
                    panOnDrag={[1, 2]}
                    zoomOnScroll={true}
                    zoomOnPinch={true}
                    zoomOnDoubleClick={false}
                    preventScrolling={false}
                    fitView
                    fitViewOptions={{ padding: 0.1 }}
                    attributionPosition="bottom-left"
                    defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                    minZoom={0.2}
                    maxZoom={2}
                >
                    <Background
                        color="#e2e8f0"
                        gap={20}
                        size={1}
                        style={{ backgroundColor: '#f8fafc' }}
                    />
                    <Controls
                        position="top-right"
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            backdropFilter: 'blur(8px)',
                        }}
                    />
                    <MiniMap
                        nodeColor={(node) => {
                            const isFact = factTables.includes(node.id);
                            return isFact ? '#3b82f6' : '#cbd5e1';
                        }}
                        nodeStrokeColor={(node) => {
                            const isFact = factTables.includes(node.id);
                            return isFact ? '#2563eb' : '#94a3b8';
                        }}
                        position="bottom-right"
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid #e2e8f0',
                            borderRadius: '12px',
                            backdropFilter: 'blur(8px)',
                        }}
                    />
                </ReactFlow>
            </div>

            {/* Table Details Modal */}
            {selectedNode && selectedTable && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closePopup}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
                            <h3 className="text-2xl font-bold">{selectedNode}</h3>
                            <p className="text-blue-100 mt-1">
                                {factTables.includes(selectedNode) ? 'Fact Table' : 'Dimension Table'}
                            </p>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-96">
                            <h4 className="text-lg font-semibold text-slate-800 mb-4">Columns</h4>
                            <div className="space-y-3">
                                {selectedTable.columns && Array.isArray(selectedTable.columns) ?
                                    selectedTable.columns.map((col, idx) => (
                                        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="font-semibold text-slate-800">{col.name}</div>
                                            <div className="text-slate-600 text-sm mt-1">{col.type}</div>
                                            {col.constraints && Array.isArray(col.constraints) && col.constraints.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {col.constraints.map((constraint, cidx) => (
                                                        <span
                                                            key={cidx}
                                                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-lg font-medium"
                                                        >
                                                            {constraint}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )) :
                                    <p className="text-slate-500 italic">No columns available</p>
                                }
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-200">
                            <button
                                onClick={closePopup}
                                className="w-full px-4 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl font-medium hover:from-slate-700 hover:to-slate-800 transition-all"
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