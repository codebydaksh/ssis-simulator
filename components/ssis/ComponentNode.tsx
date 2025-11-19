import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { SSISComponent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

// Define the props for our custom node
// NodeProps takes the Node type as a generic
type SSISNodeProps = NodeProps<Node<SSISComponent>>;

const BaseNode = ({ data, selected }: SSISNodeProps) => {
    const { name, category, icon, hasError, errorMessage, type, highlightStatus } = data;

    // Determine colors based on type
    const getTypeStyles = () => {
        switch (type) {
            case 'source':
                return 'bg-blue-50 border-blue-500 text-blue-900';
            case 'transformation':
                return 'bg-purple-50 border-purple-500 text-purple-900';
            case 'destination':
                return 'bg-green-50 border-green-500 text-green-900';
            case 'control-flow-task':
                return 'bg-orange-50 border-orange-500 text-orange-900';
            default:
                return 'bg-gray-50 border-gray-500 text-gray-900';
        }
    };

    return (
        <div
            className={cn(
                'relative flex items-center min-w-[180px] px-3 py-2 rounded-md border-2 shadow-sm transition-all',
                getTypeStyles(),
                selected ? 'ring-2 ring-offset-1 ring-blue-400' : '',
                hasError ? 'border-red-500 ring-red-200' : '',
                highlightStatus === 'upstream' ? 'ring-2 ring-blue-300 bg-blue-100' : '',
                highlightStatus === 'downstream' ? 'ring-2 ring-green-300 bg-green-100' : ''
            )}
        >
            {/* Input Handle (not for sources, control flow tasks have handles on all sides) */}
            {type !== 'source' && type !== 'control-flow-task' && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className="w-3 h-3 !bg-gray-400 hover:!bg-blue-500"
                />
            )}
            {/* Control Flow Tasks have handles on top and bottom */}
            {type === 'control-flow-task' && (
                <>
                    <Handle
                        type="target"
                        position={Position.Top}
                        className="w-3 h-3 !bg-orange-400 hover:!bg-orange-600"
                    />
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        className="w-3 h-3 !bg-orange-400 hover:!bg-orange-600"
                    />
                </>
            )}

            {/* Icon */}
            <div className="mr-3 text-xl">
                {icon}
            </div>

            {/* Content */}
            <div className="flex-1">
                <div className="text-xs font-bold uppercase opacity-70">{category}</div>
                <div className="text-sm font-semibold">{name}</div>
            </div>

            {/* Error Indicator */}
            {hasError && (
                <div className="absolute -top-2 -right-2 bg-white rounded-full" title={errorMessage}>
                    <AlertCircle className="w-5 h-5 text-red-500 fill-white" />
                </div>
            )}

            {/* Output Handle (not for destinations or control flow tasks) */}
            {type !== 'destination' && type !== 'control-flow-task' && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className="w-3 h-3 !bg-gray-400 hover:!bg-blue-500"
                />
            )}
            {/* Show hint for Data Flow Task */}
            {type === 'control-flow-task' && category === 'DataFlowTask' && (
                <div className="absolute -bottom-6 left-0 right-0 text-xs text-center text-gray-500 italic">
                    Double-click to edit
                </div>
            )}
        </div>
    );
};

export default memo(BaseNode);
