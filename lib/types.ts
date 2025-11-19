export type ComponentType = 'source' | 'transformation' | 'destination';
export type DataType = 'structured' | 'text' | 'mixed' | 'nested';
export type Severity = 'error' | 'warning' | 'info';

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
    category: string; // e.g., 'OLEDBSource', 'Lookup'
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
    properties?: Record<string, any>;
    outputSchema?: ColumnSchema[];

    // Validation state
    hasError: boolean;
    errorMessage?: string;

    // For specific logic
    isSorted?: boolean;
    referenceInput?: string; // For Lookup

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

    [key: string]: unknown;
}
