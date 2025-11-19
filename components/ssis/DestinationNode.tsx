import React, { memo } from 'react';
import { NodeProps, Node } from '@xyflow/react';
import { SSISComponent } from '@/lib/types';
import ComponentNode from './ComponentNode';

const DestinationNode = (props: NodeProps<Node<SSISComponent>>) => {
    return <ComponentNode {...props} />;
};

export default memo(DestinationNode);
