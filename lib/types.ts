export type ComponentType = 'source' | 'transformation' | 'destination' | 'control-flow-task' | 'data-movement' | 'control-flow' | 'other' | 'notebook' | 'dataSource' | 'output' | 'orchestration' | 'cluster';
export type DataType = 'structured' | 'text' | 'mixed' | 'nested';
export type Severity = 'error' | 'warning' | 'info';
export type ViewMode = 'data-flow' | 'control-flow';
export type PrecedenceConstraintType = 'success' | 'failure' | 'completion';

export interface ColumnSchema {
    name: string;
    dataType: 'int' | 'string' | 'decimal' | 'datetime' | 'boolean';
    nullable: boolean;
}

export interface ValidationResult {
    connectionId: string;
    isValid: boolean;
    severity: Severity;
    message: string;
    suggestion?: string;
    affectedComponents: string[];
}

export interface SSISComponent {
    id: string;
    type: ComponentType;
    category: string; // e.g., 'OLEDBSource', 'Lookup', 'DataFlowTask', 'ExecuteSQLTask'
    name: string;
    icon: string;
    description: string;
    useCases: string[];
    dataType: DataType;

    // Canvas properties
    position: { x: number; y: number };
    measured?: { width: number; height: number };

    // Connections
    inputs: string[]; // IDs of source components
    outputs: string[]; // IDs of target components

    // Component-specific
    properties?: Record<string, unknown>;
    outputSchema?: ColumnSchema[];

    // Validation state
    hasError: boolean;
    errorMessage?: string;

    // For specific logic
    isSorted?: boolean;
    referenceInput?: string; // For Lookup

    // Control Flow specific
    constraintType?: PrecedenceConstraintType; // For precedence constraints
    nestedDataFlow?: { // For Data Flow Task - contains nested data flow
        components: SSISComponent[];
        connections: Connection[];
    };

    [key: string]: unknown;
}

export interface Connection {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    isValid: boolean;
    validationResult?: ValidationResult;

    // Control Flow specific
    constraintType?: PrecedenceConstraintType; // For precedence constraints in Control Flow
    expression?: string; // For expression-based constraints

    [key: string]: unknown;
}

export type PlatformType = 'ssis' | 'adf' | 'databricks';

export type ADFComponentType = 'data-movement' | 'transformation' | 'control-flow' | 'other';

export interface ADFComponent extends Omit<SSISComponent, 'type' | 'category'> {
    type: ADFComponentType;
    category: string; // e.g., 'CopyData', 'MappingDataFlow', 'WebActivity'

    // ADF specific properties
    linkedService?: string;
    integrationRuntime?: string;
    policy?: {
        timeout?: string;
        retry?: number;
        retryIntervalInSeconds?: number;
        secureOutput?: boolean;
        secureInput?: boolean;
    };

    // For Control Flow
    activities?: ADFComponent[]; // For container activities like ForEach, IfCondition

    // For Switch Activity
    cases?: {
        value: string;
        activities: ADFComponent[];
    }[];
    defaultActivities?: ADFComponent[];
}

export type DatabricksComponentType = 'notebook' | 'dataSource' | 'transformation' | 'output' | 'orchestration' | 'cluster';

export interface DatabricksComponent extends Omit<SSISComponent, 'type' | 'category'> {
    type: DatabricksComponentType;
    category: string; // e.g., 'PythonNotebook', 'DeltaTableSource', 'DataFrameTransform'

    // Databricks specific properties
    clusterId?: string;
    sparkCode?: string; // Generated Spark code preview
    estimatedCost?: number; // DBU cost estimation
    runtimeVersion?: string; // Databricks Runtime version
    libraries?: Array<{
        type: 'pypi' | 'maven' | 'jar' | 'cran' | 'egg' | 'whl';
        name: string;
        version?: string;
    }>;
    catalog?: string; // Unity Catalog
    schema?: string; // Unity Catalog schema
    table?: string; // Unity Catalog table
    notebookLanguage?: 'python' | 'scala' | 'sql' | 'r' | 'markdown';
}
