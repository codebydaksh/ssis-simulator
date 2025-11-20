import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { SSISComponent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

type ADFNodeProps = NodeProps<Node<SSISComponent>>;

const ADFComponentNode = ({ data, selected }: ADFNodeProps) => {
    const { name, category, icon, hasError, errorMessage, type, highlightStatus } = data;

    // Determine colors based on type (ADF Style)
    const getTypeStyles = () => {
        switch (type) {
            case 'data-movement': // Copy Data
                return 'bg-teal-50 border-teal-500 text-teal-900';
            case 'transformation': // Data Flow
                return 'bg-blue-50 border-blue-500 text-blue-900';
            case 'control-flow': // Web, Wait, etc.
                return 'bg-slate-50 border-slate-500 text-slate-900';
            default:
                return 'bg-gray-50 border-gray-500 text-gray-900';
        }
    };

    const getIconContainerStyles = () => {
        switch (type) {
            case 'data-movement': return 'bg-teal-100 text-teal-600';
            case 'transformation': return 'bg-blue-100 text-blue-600';
            case 'control-flow': return 'bg-slate-100 text-slate-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div
            className={cn(
                'relative flex items-center min-w-[200px] px-0 py-0 rounded-lg border shadow-sm transition-all bg-white',
                selected ? 'ring-2 ring-offset-1 ring-blue-400 border-blue-400' : 'border-gray-200',
                hasError ? 'border-red-500 ring-red-200' : '',
                highlightStatus === 'upstream' ? 'ring-2 ring-blue-300 bg-blue-50' : '',
                highlightStatus === 'downstream' ? 'ring-2 ring-green-300 bg-green-50' : ''
            )}
        >
            {/* Input Handle - Left */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 !bg-gray-300 hover:!bg-blue-500 border-2 border-white"
            />

            {/* Icon Section */}
            <div className={cn("p-3 rounded-l-lg flex items-center justify-center", getIconContainerStyles())}>
                <span className="text-xl">{icon}</span>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5">{category}</div>
                <div className="text-sm font-semibold text-gray-800">{name}</div>
            </div>

            {/* Status Indicator (Mock) */}
            <div className="pr-3">
                {hasError ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                )}
            </div>

            {/* Output Handles - Right Side */}

            {/* Success Path (Green) */}
            <Handle
                type="source"
                position={Position.Right}
                id="success"
                style={{ top: '25%' }}
                className="w-3 h-3 !bg-green-500 hover:!bg-green-600 border-2 border-white"
                title="On Success"
            />

            {/* Completion Path (Blue) */}
            <Handle
                type="source"
                position={Position.Right}
                id="completion"
                style={{ top: '50%' }}
                className="w-3 h-3 !bg-blue-500 hover:!bg-blue-600 border-2 border-white"
                title="On Completion"
            />

            {/* Failure Path (Red) */}
            <Handle
                type="source"
                position={Position.Right}
                id="failure"
                style={{ top: '75%' }}
                className="w-3 h-3 !bg-red-500 hover:!bg-red-600 border-2 border-white"
                title="On Failure"
            />

            {/* Error Tooltip */}
            {hasError && errorMessage && (
                <div className="absolute -top-8 left-0 bg-red-100 text-red-800 text-xs px-2 py-1 rounded border border-red-200 whitespace-nowrap z-50">
                    {errorMessage}
                </div>
            )}

            {/* Hint for Data Flow */}
            {category === 'MappingDataFlow' && (
                <div className="absolute -bottom-5 left-0 right-0 text-[10px] text-center text-gray-400">
                    Double-click to edit flow
                </div>
            )}
        </div>
    );
};

export default memo(ADFComponentNode);
