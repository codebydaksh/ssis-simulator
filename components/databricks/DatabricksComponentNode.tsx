import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { SSISComponent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

type DatabricksNodeProps = NodeProps<Node<SSISComponent>>;

const DatabricksComponentNode = ({ data, selected }: DatabricksNodeProps) => {
    const { name, category, icon, hasError, errorMessage, type, highlightStatus } = data;

    // Note: getTypeStyles was defined but not used - styling is handled via getIconContainerStyles

    const getIconContainerStyles = () => {
        switch (type) {
            case 'notebook': return 'bg-orange-100 text-orange-600';
            case 'dataSource': return 'bg-blue-100 text-blue-600';
            case 'transformation': return 'bg-purple-100 text-purple-600';
            case 'output': return 'bg-teal-100 text-teal-600';
            case 'orchestration': return 'bg-indigo-100 text-indigo-600';
            case 'cluster': return 'bg-amber-100 text-amber-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    // Determine if component should have input/output handles
    const hasInput = type !== 'dataSource' && type !== 'cluster';
    const hasOutput = type !== 'cluster';

    return (
        <div
            className={cn(
                'relative flex items-center min-w-[200px] px-0 py-0 rounded-lg border shadow-sm transition-all bg-white',
                selected ? 'ring-2 ring-offset-1 ring-orange-400 border-orange-400' : 'border-gray-200',
                hasError ? 'border-red-500 ring-red-200' : '',
                highlightStatus === 'upstream' ? 'ring-2 ring-orange-300 bg-orange-50' : '',
                highlightStatus === 'downstream' ? 'ring-2 ring-teal-300 bg-teal-50' : ''
            )}
        >
            {/* Input Handle - Left */}
            {hasInput && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className="w-3 h-3 !bg-gray-300 hover:!bg-orange-500 border-2 border-white"
                />
            )}

            {/* Icon Section */}
            <div className={cn("p-3 rounded-l-lg flex items-center justify-center", getIconContainerStyles())}>
                <span className="text-xl">{icon}</span>
            </div>

            {/* Content Section */}
            <div className="flex-1 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5">{category}</div>
                <div className="text-sm font-semibold text-gray-800">{name}</div>
            </div>

            {/* Status Indicator */}
            <div className="pr-3">
                {hasError ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                )}
            </div>

            {/* Output Handle - Right Side */}
            {hasOutput && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className="w-3 h-3 !bg-orange-500 hover:!bg-orange-600 border-2 border-white"
                />
            )}

            {/* Error Tooltip */}
            {hasError && errorMessage && (
                <div className="absolute -top-8 left-0 bg-red-100 text-red-800 text-xs px-2 py-1 rounded border border-red-200 whitespace-nowrap z-50">
                    {errorMessage}
                </div>
            )}
        </div>
    );
};

export default memo(DatabricksComponentNode);

