import { SSISComponent, Connection } from './types';

export interface PipelineTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    components: SSISComponent[];
    connections: Connection[];
}

export const ADF_TEMPLATES: PipelineTemplate[] = [
    {
        id: 'adf-copy-blob-sql',
        name: 'Copy Blob to SQL',
        description: 'Basic pipeline to copy data from Azure Blob Storage to Azure SQL Database.',
        category: 'Data Movement',
        components: [
            {
                id: 'source-blob',
                type: 'data-movement',
                category: 'CopyData',
                name: 'Copy Blob to SQL',
                icon: 'Copy',
                description: 'Copies data from a source to a sink store.',
                useCases: ['Ingest data from on-prem to cloud'],
                dataType: 'structured',
                position: { x: 100, y: 100 },
                inputs: [],
                outputs: [],
                hasError: false,
                linkedService: 'AzureBlobStorage',
                integrationRuntime: 'AutoResolveIntegrationRuntime',
                policy: { retry: 0, timeout: '7.00:00:00' }
            }
        ],
        connections: []
    },
    {
        id: 'adf-wait-web',
        name: 'Wait and Call Web API',
        description: 'Demonstrates control flow with Wait and Web activities.',
        category: 'Control Flow',
        components: [
            {
                id: 'wait-activity',
                type: 'control-flow',
                category: 'Wait',
                name: 'Wait 5 Seconds',
                icon: 'Clock',
                description: 'Waits for a specified period of time.',
                useCases: ['Delay execution'],
                dataType: 'structured',
                position: { x: 100, y: 100 },
                inputs: [],
                outputs: ['web-activity'],
                hasError: false,
                properties: { waitTimeInSeconds: 5 }
            },
            {
                id: 'web-activity',
                type: 'control-flow',
                category: 'WebActivity',
                name: 'Call API',
                icon: 'Globe',
                description: 'Calls a custom REST endpoint.',
                useCases: ['Trigger external API'],
                dataType: 'mixed',
                position: { x: 400, y: 100 },
                inputs: ['wait-activity'],
                outputs: [],
                hasError: false,
                properties: { method: 'GET', url: 'https://api.example.com' }
            }
        ],
        connections: [
            {
                id: 'conn-wait-web',
                source: 'wait-activity',
                target: 'web-activity',
                isValid: true,
                constraintType: 'success'
            }
        ]
    },
    {
        id: 'adf-foreach-copy',
        name: 'ForEach File Copy',
        description: 'Iterates over a list of files and copies them.',
        category: 'Orchestration',
        components: [
            {
                id: 'get-metadata',
                type: 'control-flow',
                category: 'GetMetadata',
                name: 'Get File List',
                icon: 'Info',
                description: 'Retrieves metadata of data in Azure Data Factory.',
                useCases: ['Get file list'],
                dataType: 'structured',
                position: { x: 100, y: 100 },
                inputs: [],
                outputs: ['foreach-loop'],
                hasError: false
            },
            {
                id: 'foreach-loop',
                type: 'control-flow',
                category: 'ForEach',
                name: 'ForEach File',
                icon: 'Repeat',
                description: 'Iterates over a collection of items.',
                useCases: ['Process list of files'],
                dataType: 'structured',
                position: { x: 400, y: 100 },
                inputs: ['get-metadata'],
                outputs: [],
                hasError: false,
                properties: { items: '@activity(\'Get File List\').output.childItems' }
            }
        ],
        connections: [
            {
                id: 'conn-meta-foreach',
                source: 'get-metadata',
                target: 'foreach-loop',
                isValid: true,
                constraintType: 'success'
            }
        ]
    },
    {
        id: 'adf-if-condition',
        name: 'Conditional Processing',
        description: 'Checks a condition and executes different paths.',
        category: 'Control Flow',
        components: [
            {
                id: 'check-condition',
                type: 'control-flow',
                category: 'IfCondition',
                name: 'Check Flag',
                icon: 'GitBranch',
                description: 'Evaluates a boolean expression.',
                useCases: ['Conditional processing'],
                dataType: 'structured',
                position: { x: 100, y: 100 },
                inputs: [],
                outputs: [],
                hasError: false,
                properties: { expression: '@equals(pipeline().parameters.flag, true)' }
            }
        ],
        connections: []
    },
    {
        id: 'adf-dataflow-transform',
        name: 'Data Flow Transformation',
        description: 'Orchestrates a Mapping Data Flow for complex transformations.',
        category: 'Transformation',
        components: [
            {
                id: 'data-flow',
                type: 'transformation',
                category: 'MappingDataFlow',
                name: 'Cleanse Data',
                icon: 'Workflow',
                description: 'Visually design data transformations.',
                useCases: ['Cleanse and transform data'],
                dataType: 'structured',
                position: { x: 100, y: 100 },
                inputs: [],
                outputs: [],
                hasError: false
            }
        ],
        connections: []
    }
];
