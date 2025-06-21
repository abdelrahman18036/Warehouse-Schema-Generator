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
    Handle,
    Position,
    MarkerType,
    BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';

// ---------- Custom Node Component ---------- //
const DBNode = ({ data, selected }) => {
    const { tableName, columns, isFact } = data;
    const cols = Array.isArray(columns) ? columns : [];

    return (
        <div className={`relative bg-white/90 backdrop-blur-lg rounded-2xl border transition-all duration-500 hover:scale-105 ${selected ? 'ring-2 ring-blue-400/50 shadow-2xl' : 'shadow-lg'
            } ${isFact ? 'border-blue-200/60' : 'border-slate-200/60'} w-[280px]`}>

            {/* Subtle gradient overlay */}
            <div className={`absolute inset-0 rounded-2xl opacity-5 ${isFact ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-slate-400 to-slate-600'
                }`}></div>

            {/* Header */}
            <div className="relative px-4 py-3 border-b border-slate-100/80">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">

                        <div className={`w-2 h-2 rounded-full ${isFact
                            ? 'bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse'
                            : 'bg-slate-400'
                            }`}></div>
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm tracking-wide">{tableName}</h3>
                    <div className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${isFact
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}>
                        {isFact ? 'FACT ⚡' : 'DIM 📊'}
                    </div>
                </div>
            </div>

            {/* Column List */}
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {cols.length > 0 ? (
                    cols.map((col, idx) => {
                        const isPrimaryKey = col.constraints?.some(c =>
                            typeof c === 'string' && c.toUpperCase().includes('PRIMARY KEY')
                        );
                        const isForeignKey = col.constraints?.some(c =>
                            typeof c === 'string' && (c.toUpperCase().includes('FOREIGN KEY') || c.toUpperCase().includes('REFERENCES'))
                        );

                        return (
                            <div key={idx} className="group hover:bg-slate-50/50 rounded-lg p-2 transition-colors duration-200">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                                        {col.name}
                                    </span>
                                    <div className="flex gap-1">
                                        {isPrimaryKey && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                        )}
                                        {isForeignKey && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 font-mono">
                                    {col.type}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-6 text-slate-400">
                        <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center">
                            <span className="text-slate-400 text-sm">∅</span>
                        </div>
                        <span className="text-xs">No columns</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-100/80 bg-slate-50/30">
                <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{cols.length} field{cols.length !== 1 ? 's' : ''}</span>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-amber-400"></div>
                            <span>PK</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                            <span>FK</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Connection Handles */}
            <Handle
                type="target"
                position={Position.Left}
                id="left"
                className="!w-3 !h-3 !border-2 !border-white !shadow-md"
                style={{
                    background: isFact ? '#3b82f6' : '#64748b',
                }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="right"
                className="!w-3 !h-3 !border-2 !border-white !shadow-md"
                style={{
                    background: isFact ? '#3b82f6' : '#64748b',
                }}
            />
        </div>
    );
};

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
            const isFactByName = lowerName.includes('fact_');



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

            return isFactByName;
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
                if (columnName.endsWith('_id') || columnName.endsWith('_key')) {
                    const baseName = columnName.replace(/_id$|_key$/, '');
                    referencedTable = Object.keys(schema).find(t => {
                        const tLower = t.toLowerCase();
                        const tStripped = tLower.replace(/^dim_|^fact_/, '');
                        return tLower === baseName ||
                            tStripped === baseName ||
                            tLower === baseName + 's' ||
                            tStripped === baseName + 's' ||
                            baseName === tLower.slice(0, -1) ||
                            baseName === tStripped.slice(0, -1);
                    });
                }

                if (referencedTable && referencedTable !== tableName) {
                    connections.push({
                        id: `${tableName}-${col.name}->${referencedTable}`,
                        source: tableName,
                        target: referencedTable,
                        label: col.name,
                        animated: true
                    });
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
                    type: 'dbNode',
                    data: {
                        tableName,
                        columns: table.columns || [],
                        isFact
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
            const edges = connections.map((conn, index) => {
                // Check if the source is a fact table to make connection blue
                const isFactConnection = factTables.includes(conn.source);

                // Find the primary key for the connection label
                const sourceTable = schema[conn.source];
                let pkColumn = null;
                if (sourceTable && sourceTable.columns && Array.isArray(sourceTable.columns)) {
                    pkColumn = sourceTable.columns.find(col =>
                        col.constraints &&
                        Array.isArray(col.constraints) &&
                        col.constraints.some(c =>
                            typeof c === 'string' && c.toUpperCase().includes('PRIMARY KEY')
                        )
                    );
                }

                // Create the label - show PK if found, otherwise show the connecting column
                const label = pkColumn ? `PK: ${pkColumn.name}` : conn.label;

                return {
                    id: `edge-${index}`,
                    source: conn.source,
                    target: conn.target,
                    sourceHandle: 'right',
                    targetHandle: 'left',
                    type: 'smoothstep',
                    animated: false,
                    label: label,
                    labelStyle: {
                        fontSize: '12px',
                        fontWeight: '600',
                        color: isFactConnection ? '#3b82f6' : '#64748b',
                        backgroundColor: 'white',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        border: isFactConnection ? '1px solid #3b82f6' : '1px solid #94a3b8',
                    },
                    style: {
                        stroke: isFactConnection ? '#3b82f6' : '#94a3b8',
                        strokeWidth: isFactConnection ? 2.5 : 1.5,
                        strokeDasharray: isFactConnection ? 'none' : '5,5',
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 16,
                        height: 16,
                        color: isFactConnection ? '#3b82f6' : '#94a3b8',
                    },
                };
            });

            console.log(`Generated ${nodesArray.length} nodes and ${edges.length} edges for ${selectedSchemaKey}`);
            return { nodes: nodesArray, edges };
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

    const nodeTypes = useMemo(() => ({
        dbNode: DBNode
    }), []);

    return (
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'} w-full h-full`}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                <div className="flex items-center space-x-4">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Schema Visualization
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
            <div className="w-full h-full bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden"
                ref={reactFlowWrapper}
                style={{ height: isFullscreen ? 'calc(100vh - 80px)' : '600px' }}>
                {/* Subtle background pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.15)_1px,transparent_0)] bg-[length:24px_24px]"></div>

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
                    fitViewOptions={{ padding: 0.2 }}
                    defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                    minZoom={0.3}
                    maxZoom={1.5}
                    nodeTypes={nodeTypes}
                    className="bg-transparent"
                    proOptions={{ hideAttribution: true }}
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={20}
                        size={1}
                        color="rgba(148, 163, 184, 0.2)"
                    />
                    <Controls
                        className="!bg-white/80 !backdrop-blur-sm !border !border-slate-200 !rounded-xl !shadow-lg"
                        showInteractive={false}
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