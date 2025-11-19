import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';
import { Connection } from '@/lib/types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const ConnectionEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}: EdgeProps) => {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Cast data to Connection safely
    const connectionData = data as unknown as Connection;
    const isValid = connectionData?.isValid;
    const validationResult = connectionData?.validationResult;
    const isError = isValid === false;

    // Dynamic styles based on validation
    const edgeStyle = {
        ...(style || {}),
        stroke: isError ? '#ef4444' : '#22c55e', // Red-500 or Green-500
        strokeWidth: 2,
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />

            {/* Validation Icon Label */}
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan"
                >
                    {isError ? (
                        <div
                            className="bg-white rounded-full p-1 shadow-md border border-red-200 group relative"
                            title={validationResult?.message}
                        >
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-red-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                {validationResult?.message}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-full p-1 shadow-md border border-green-200">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </div>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
};

export default memo(ConnectionEdge);
