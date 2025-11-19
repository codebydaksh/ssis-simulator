'use client';

import React, { useCallback, useMemo, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Connection as FlowConnection,
    Edge,
    Node,
    OnConnect,
    OnNodesChange,
    OnEdgesChange,
    NodeChange,
    EdgeChange,
    ReactFlowProvider,
    NodeTypes,
    EdgeTypes,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCanvasStore } from '@/store/canvasStore';
import SourceNode from '@/components/ssis/SourceNode';
import TransformNode from '@/components/ssis/TransformNode';
import DestinationNode from '@/components/ssis/DestinationNode';
import ConnectionEdge from '@/components/ssis/ConnectionEdge';
import { SSISComponent, Connection } from '@/lib/types';
import { getComponentDefinition } from '@/lib/componentDefinitions';
import { getFlowHighlights } from '@/lib/validationEngine';
import { v4 as uuidv4 } from 'uuid';

const nodeTypes: NodeTypes = {
    source: SourceNode,
    transformation: TransformNode,
    destination: DestinationNode,
};

const edgeTypes: EdgeTypes = {
    default: ConnectionEdge,
};

const CanvasContent = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();
    const {
        components,
        connections,
        selectedComponent,
        addComponent,
        updateComponent,
        removeComponent,
        addConnection,
        removeConnection,
        selectComponent,
    } = useCanvasStore();

    const highlights = useMemo(() => {
        if (!selectedComponent) return { upstream: [], downstream: [] };
        return getFlowHighlights(selectedComponent, components, connections);
    }, [selectedComponent, components, connections]);

    const nodes: Node<SSISComponent>[] = useMemo(() => components.map((c) => {
        let highlightStatus: 'none' | 'upstream' | 'downstream' | 'selected' = 'none';
        if (selectedComponent && c.id === selectedComponent) {
            highlightStatus = 'selected';
        } else if (highlights.upstream.includes(c.id)) {
            highlightStatus = 'upstream';
        } else if (highlights.downstream.includes(c.id)) {
            highlightStatus = 'downstream';
        }

        return {
            id: c.id,
            type: c.type,
            position: c.position,
            measured: c.measured,
            data: { ...c, highlightStatus },
        };
    }), [components, highlights, selectedComponent]);

    const edges: Edge<Connection>[] = useMemo(() => connections.map((c) => ({
        id: c.id,
        source: c.source,
        target: c.target,
        sourceHandle: c.sourceHandle,
        targetHandle: c.targetHandle,
        type: 'default',
        data: c,
        animated: !c.isValid,
    })), [connections]);

    const onNodesChange: OnNodesChange = useCallback(
        (changes: NodeChange[]) => {
            changes.forEach((change) => {
                if (change.type === 'position' && change.position) {
                    updateComponent(change.id, { position: change.position });
                } else if (change.type === 'remove') {
                    removeComponent(change.id);
                } else if (change.type === 'select') {
                    selectComponent(change.selected ? change.id : null);
                } else if (change.type === 'dimensions' && change.dimensions) {
                    updateComponent(change.id, { measured: change.dimensions });
                }
            });
        },
        [updateComponent, removeComponent, selectComponent]
    );

    const onEdgesChange: OnEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            changes.forEach((change) => {
                if (change.type === 'remove') {
                    removeConnection(change.id);
                }
            });
        },
        [removeConnection]
    );

    const onConnect: OnConnect = useCallback(
        (params: FlowConnection) => {
            if (!params.source || !params.target) return;

            const newConnection: Connection = {
                id: `e-${params.source}-${params.target}-${Date.now()}`,
                source: params.source,
                target: params.target,
                sourceHandle: params.sourceHandle || undefined,
                targetHandle: params.targetHandle || undefined,
                isValid: true,
            };

            addConnection(newConnection);
        },
        [addConnection]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const category = event.dataTransfer.getData('application/ssis-category');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const definition = getComponentDefinition(category);

            const newComponent: SSISComponent = {
                id: uuidv4(),
                type: type as 'source' | 'transformation' | 'destination',
                category: category,
                name: definition?.name || category,
                icon: definition?.icon || '📦',
                description: definition?.description || '',
                useCases: definition?.useCases || [],
                dataType: definition?.dataType || 'structured',
                position,
                inputs: [],
                outputs: [],
                hasError: false,
            };

            addComponent(newComponent);
        },
        [addComponent, screenToFlowPosition]
    );

    return (
        <div className="w-full h-full" ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDragOver={onDragOver}
                onDrop={onDrop}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                snapToGrid
                className="bg-gray-50"
            >
                <Background color="#E0E0E0" gap={20} />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
};

export default function Canvas() {
    return (
        <ReactFlowProvider>
            <CanvasContent />
        </ReactFlowProvider>
    );
}
