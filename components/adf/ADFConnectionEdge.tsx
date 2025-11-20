import React, { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';
import { Connection } from '@/lib/types';
import { AlertCircle, CheckCircle2, XCircle, ArrowRightCircle } from 'lucide-react';

const ADFConnectionEdge = ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    sourceHandleId,
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

    // Determine color based on source handle ID
    let strokeColor = '#9ca3af'; // Default Gray
    let Icon = ArrowRightCircle;

    if (sourceHandleId === 'success') {
        strokeColor = '#22c55e'; // Green
        Icon = CheckCircle2;
    } else if (sourceHandleId === 'failure') {
        strokeColor = '#ef4444'; // Red
        Icon = XCircle;
    } else if (sourceHandleId === 'completion') {
        strokeColor = '#3b82f6'; // Blue
        Icon = ArrowRightCircle;
    }

    // Override if there's a validation error
    if (isError) {
        strokeColor = '#ef4444'; // Red for error
    }

    // Dynamic styles
    const edgeStyle = {
        ...(style || {}),
        stroke: strokeColor,
        strokeWidth: 2,
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />

            {/* Label Renderer */}
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
                        <div className={`bg-white rounded-full p-1 shadow-md border border-gray-200`} style={{ color: strokeColor }}>
                            <Icon className="w-4 h-4" />
                        </div>
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
};

export default memo(ADFConnectionEdge);
