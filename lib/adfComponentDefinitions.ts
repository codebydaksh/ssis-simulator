import { ADFComponentType, DataType } from './types';

export interface ADFComponentDefinition {
    type: ADFComponentType;
    category: string;
    name: string;
    icon: string;
    description: string;
    useCases: string[];
    dataType: DataType;
    defaultProperties?: Record<string, unknown>;
}

export const ADF_COMPONENT_DEFINITIONS: ADFComponentDefinition[] = [
    // --- DATA MOVEMENT ---
    {
        type: 'data-movement',
        category: 'CopyData',
        name: 'Copy Data',
        icon: 'Copy',
        description: 'Copies data from a source to a sink store.',
        useCases: ['Ingest data from on-prem to cloud', 'Copy between databases', 'Archive data to blob storage'],
        dataType: 'structured',
        defaultProperties: {
            source: {},
            sink: {},
            mapping: []
        }
    },

    // --- TRANSFORMATION ---
    {
        type: 'transformation',
        category: 'MappingDataFlow',
        name: 'Data Flow',
        icon: 'Workflow',
        description: 'Visually design data transformations without writing code.',
        useCases: ['Cleanse and transform data', 'Join multiple sources', 'Aggregate data'],
        dataType: 'structured',
        defaultProperties: {
            dataFlowReference: '',
            integrationRuntime: 'AutoResolveIntegrationRuntime'
        }
    },
    {
        type: 'transformation',
        category: 'DatabricksNotebook',
        name: 'Databricks Notebook',
        icon: 'Code',
        description: 'Runs a notebook on Azure Databricks.',
        useCases: ['Complex data processing', 'Machine learning inference', 'Python/Scala transformations'],
        dataType: 'mixed'
    },

    // --- CONTROL FLOW ---
    {
        type: 'control-flow',
        category: 'ForEach',
        name: 'ForEach',
        icon: 'Repeat',
        description: 'Iterates over a collection of items.',
        useCases: ['Process list of files', 'Iterate through table names', 'Parallel execution'],
        dataType: 'structured',
        defaultProperties: {
            items: '@pipeline().parameters.items',
            isSequential: false,
            batchCount: 20
        }
    },
    {
        type: 'control-flow',
        category: 'IfCondition',
        name: 'If Condition',
        icon: 'GitBranch',
        description: 'Evaluates a boolean expression to determine execution path.',
        useCases: ['Check if file exists', 'Validate row count', 'Conditional processing'],
        dataType: 'structured',
        defaultProperties: {
            expression: '@equals(1, 1)'
        }
    },
    {
        type: 'control-flow',
        category: 'Switch',
        name: 'Switch',
        icon: 'GitMerge',
        description: 'Selects one of multiple execution paths based on expression value.',
        useCases: ['Route based on file type', 'Multi-region processing logic'],
        dataType: 'structured'
    },
    {
        type: 'control-flow',
        category: 'ExecutePipeline',
        name: 'Execute Pipeline',
        icon: 'Play',
        description: 'Invokes another pipeline.',
        useCases: ['Master-child orchestration', 'Reusing common logic', 'Modularizing pipelines'],
        dataType: 'structured'
    },
    {
        type: 'control-flow',
        category: 'WebActivity',
        name: 'Web',
        icon: 'Globe',
        description: 'Calls a custom REST endpoint.',
        useCases: ['Trigger external API', 'Send notification', 'Get authentication token'],
        dataType: 'mixed',
        defaultProperties: {
            method: 'GET',
            url: '',
            headers: {}
        }
    },
    {
        type: 'control-flow',
        category: 'Wait',
        name: 'Wait',
        icon: 'Clock',
        description: 'Waits for a specified period of time.',
        useCases: ['Delay execution', 'Polling interval'],
        dataType: 'structured',
        defaultProperties: {
            waitTimeInSeconds: 1
        }
    },
    {
        type: 'control-flow',
        category: 'SetVariable',
        name: 'Set Variable',
        icon: 'Variable',
        description: 'Sets the value of an existing variable.',
        useCases: ['Store state', 'Pass values between activities', 'Counter increment'],
        dataType: 'structured'
    },
    {
        type: 'control-flow',
        category: 'Validation',
        name: 'Validation',
        icon: 'CheckCircle',
        description: 'Ensures that a pipeline continues only if a reference dataset exists.',
        useCases: ['Check file availability', 'Wait for data arrival'],
        dataType: 'structured'
    },
    {
        type: 'control-flow',
        category: 'GetMetadata',
        name: 'Get Metadata',
        icon: 'Info',
        description: 'Retrieves metadata of data in Azure Data Factory.',
        useCases: ['Get file list', 'Check file size', 'Get last modified date'],
        dataType: 'structured'
    },
    {
        type: 'control-flow',
        category: 'Filter',
        name: 'Filter',
        icon: 'Filter',
        description: 'Filters input array based on a condition.',
        useCases: ['Select specific files', 'Filter API results'],
        dataType: 'structured'
    }
];

export const getADFComponentDefinition = (category: string) =>
    ADF_COMPONENT_DEFINITIONS.find(c => c.category === category);
