import { SSISComponent, Connection, ValidationResult } from './types';

// --- Helper: Check for Circular Dependency ---
function hasCircularDependency(componentId: string, components: SSISComponent[], connections: Connection[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    function dfs(currentId: string): boolean {
        visited.add(currentId);
        recursionStack.add(currentId);

        // Find all downstream components
        const outgoingConnections = connections.filter(c => c.source === currentId);
        for (const conn of outgoingConnections) {
            const neighborId = conn.target;
            if (!visited.has(neighborId)) {
                if (dfs(neighborId)) return true;
            } else if (recursionStack.has(neighborId)) {
                return true;
            }
        }

        recursionStack.delete(currentId);
        return false;
    }

    return dfs(componentId);
}

// --- Helper: Get Component by ID ---
const getComponent = (id: string, components: SSISComponent[]) => components.find(c => c.id === id);

// --- Helper: Get Flow Highlights ---
export function getFlowHighlights(
    selectedId: string,
    components: SSISComponent[],
    connections: Connection[]
) {
    const upstream = new Set<string>();
    const downstream = new Set<string>();

    // Upstream: Traverse backwards (target -> source)
    const queueUp = [selectedId];
    const visitedUp = new Set<string>();
    while (queueUp.length > 0) {
        const curr = queueUp.shift()!;
        if (visitedUp.has(curr)) continue;
        visitedUp.add(curr);
        if (curr !== selectedId) upstream.add(curr);

        const incoming = connections.filter(c => c.target === curr);
        incoming.forEach(c => queueUp.push(c.source));
    }

    // Downstream: Traverse forwards (source -> target)
    const queueDown = [selectedId];
    const visitedDown = new Set<string>();
    while (queueDown.length > 0) {
        const curr = queueDown.shift()!;
        if (visitedDown.has(curr)) continue;
        visitedDown.add(curr);
        if (curr !== selectedId) downstream.add(curr);

        const outgoing = connections.filter(c => c.source === curr);
        outgoing.forEach(c => queueDown.push(c.target));
    }

    return { upstream: Array.from(upstream), downstream: Array.from(downstream) };
}

export function validateConnection(
    connection: Connection,
    components: SSISComponent[],
    connections: Connection[]
): ValidationResult {
    const sourceComp = getComponent(connection.source, components);
    const targetComp = getComponent(connection.target, components);

    if (!sourceComp || !targetComp) {
        return {
            connectionId: connection.id,
            isValid: false,
            severity: 'error',
            message: 'Invalid component references',
            affectedComponents: []
        };
    }

    // 2. Data Type Compatibility Rules
    // FlatFileSource -> OLEDBDestination
    if (sourceComp.category === 'FlatFileSource' && targetComp.category === 'OLEDBDestination') {
        return {
            connectionId: connection.id,
            isValid: false,
            severity: 'error',
            message: 'Cannot connect CSV directly to OLEDB Destination. CSV outputs text data, but OLEDB expects typed columns.',
            suggestion: 'ADD: Data Conversion transformation between them.',
            affectedComponents: [sourceComp.id, targetComp.id]
        };
    }

    // OLEDBSource -> ExcelDestination
    if (sourceComp.category === 'OLEDBSource' && targetComp.category === 'ExcelDestination') {
        return {
            connectionId: connection.id,
            isValid: true, // It is valid but warns
            severity: 'warning',
            message: 'Warning: Excel has a 65,536 row limit. This may truncate your data.',
            suggestion: 'Consider using CSV Destination instead.',
            affectedComponents: [sourceComp.id, targetComp.id]
        };
    }

    // ExcelSource -> OLEDBDestination
    if (sourceComp.category === 'ExcelSource' && targetComp.category === 'OLEDBDestination') {
        return {
            connectionId: connection.id,
            isValid: false,
            severity: 'error',
            message: 'Excel columns may have mixed types.',
            suggestion: 'ADD: Data Conversion to ensure type consistency.',
            affectedComponents: [sourceComp.id, targetComp.id]
        };
    }

    // JSONSource -> OLEDBDestination
    if (sourceComp.category === 'JSONSource' && targetComp.category === 'OLEDBDestination') {
        return {
            connectionId: connection.id,
            isValid: false,
            severity: 'error',
            message: 'JSON has nested structures.',
            suggestion: 'ADD: Derived Column to flatten data first.',
            affectedComponents: [sourceComp.id, targetComp.id]
        };
    }

    // Circular Dependency Check
    if (hasCircularDependency(sourceComp.id, components, connections)) {
        return {
            connectionId: connection.id,
            isValid: false,
            severity: 'error',
            message: 'Circular dependency detected. Data flow must be acyclic.',
            affectedComponents: [sourceComp.id, targetComp.id]
        };
    }

    return {
        connectionId: connection.id,
        isValid: true,
        severity: 'info',
        message: 'Connection is valid',
        affectedComponents: []
    };
}

export function validateComponent(
    component: SSISComponent,
    components: SSISComponent[],
    connections: Connection[]
): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Skip validation for Control Flow tasks - they have different rules
    if (component.type === 'control-flow-task') {
        return results; // Control Flow tasks don't need data flow validation
    }

    const inputs = connections.filter(c => c.target === component.id);
    const outputs = connections.filter(c => c.source === component.id);

    // 1. Component Type Rules
    // Sources cannot have inputs
    if (component.type === 'source' && inputs.length > 0) {
        results.push({
            connectionId: component.id, // Associate with component
            isValid: false,
            severity: 'error',
            message: 'Source components cannot receive input connections',
            affectedComponents: [component.id]
        });
    }

    // Destinations cannot have outputs
    if (component.type === 'destination' && outputs.length > 0) {
        results.push({
            connectionId: component.id,
            isValid: false,
            severity: 'error',
            message: 'Destination components cannot send output connections',
            affectedComponents: [component.id]
        });
    }

    // Transformations need both
    if (component.type === 'transformation') {
        if (inputs.length === 0) {
            results.push({
                connectionId: component.id,
                isValid: false,
                severity: 'error',
                message: 'Transformation needs at least one input',
                affectedComponents: [component.id]
            });
        }
        if (outputs.length === 0) {
            results.push({
                connectionId: component.id,
                isValid: true, // Warning
                severity: 'warning',
                message: 'Transformation should have at least one output',
                affectedComponents: [component.id]
            });
        }
    }

    // 3. Component-Specific Rules

    // Lookup requires reference connection
    if (component.category === 'Lookup' && !component.referenceInput) {
        results.push({
            connectionId: component.id,
            isValid: false,
            severity: 'error',
            message: 'Lookup requires a reference input (right-click to configure)',
            affectedComponents: [component.id]
        });
    }

    // Merge Join requires exactly 2 sorted inputs
    if (component.category === 'MergeJoin') {
        if (inputs.length !== 2) {
            results.push({
                connectionId: component.id,
                isValid: false,
                severity: 'error',
                message: 'Merge Join requires exactly 2 input connections',
                affectedComponents: [component.id]
            });
        } else {
            // Check if inputs are sorted
            const inputsSorted = inputs.every(conn => {
                const source = getComponent(conn.source, components);
                return source && (source.category === 'Sort' || source.isSorted === true);
            });

            if (!inputsSorted) {
                results.push({
                    connectionId: component.id,
                    isValid: false,
                    severity: 'error',
                    message: 'Merge Join inputs must be sorted. ADD: Sort transformation before each input.',
                    suggestion: 'Add Sort transformation',
                    affectedComponents: [component.id]
                });
            }
        }
    }

    // Union All requires matching schemas (Simulated)
    if (component.category === 'UnionAll' && inputs.length > 1) {
        // Check if all inputs come from same type of source or have same dataType
        const inputTypes = inputs.map(conn => {
            const source = getComponent(conn.source, components);
            return source ? source.dataType : null;
        });

        const allMatch = inputTypes.every(t => t === inputTypes[0]);
        if (!allMatch) {
            results.push({
                connectionId: component.id,
                isValid: false,
                severity: 'error',
                message: 'Union All requires all inputs to have the same column structure (data type)',
                affectedComponents: [component.id]
            });
        }
    }

    // Conditional Split can have multiple outputs
    if (component.category === 'ConditionalSplit' && outputs.length === 0) {
        results.push({
            connectionId: component.id,
            isValid: true,
            severity: 'warning',
            message: 'Conditional Split should have at least one output condition',
            affectedComponents: [component.id]
        });
    }

    // NEW RULE 13: Sort component should mark output as sorted
    if (component.category === 'Sort' && !component.isSorted) {
        results.push({
            connectionId: component.id,
            isValid: true,
            severity: 'info',
            message: 'Sort component output is now marked as sorted for downstream Merge Join',
            affectedComponents: [component.id]
        });
        component.isSorted = true;
    }

    // NEW RULE 14: Most transformations should have exactly 1 output (except Multicast and ConditionalSplit)
    if (component.type === 'transformation' &&
        component.category !== 'Multicast' &&
        component.category !== 'ConditionalSplit' &&
        outputs.length > 1) {
        results.push({
            connectionId: component.id,
            isValid: false,
            severity: 'error',
            message: `${component.category} can only have one output connection. Use Multicast if you need to send data to multiple destinations.`,
            affectedComponents: [component.id]
        });
    }

    // NEW RULE 15: Orphaned components (no path to any destination)
    if (component.type !== 'destination') {
        const hasPathToDestination = checkPathToDestination(component.id, components, connections, new Set());
        if (!hasPathToDestination) {
            results.push({
                connectionId: component.id,
                isValid: true,
                severity: 'warning',
                message: 'This component has no path to a destination. Data will not be loaded anywhere.',
                affectedComponents: [component.id]
            });
        }
    }

    // NEW RULE 16: Source components should have descriptive names
    if (component.type === 'source' && component.name.includes('Source')) {
        const isGeneric = component.name === 'OLE DB Source' ||
            component.name === 'Flat File Source' ||
            component.name === 'Excel Source' ||
            component.name === 'JSON Source' ||
            component.name === 'XML Source';
        if (isGeneric) {
            results.push({
                connectionId: component.id,
                isValid: true,
                severity: 'info',
                message: 'Consider renaming to describe the data source (e.g., "Customer Master Table" instead of "OLE DB Source")',
                affectedComponents: [component.id]
            });
        }
    }

    // NEW RULE 17: Multicast broadcasts to all outputs - performance consideration
    if (component.category === 'Multicast' && outputs.length > 3) {
        results.push({
            connectionId: component.id,
            isValid: true,
            severity: 'warning',
            message: `Multicast is sending data to ${outputs.length} destinations. This multiplies data in memory. Consider if all outputs are necessary.`,
            suggestion: 'Review if all multicast outputs are required for performance',
            affectedComponents: [component.id]
        });
    }

    // NEW RULE 18: Aggregate should have GROUP BY columns
    if (component.category === 'Aggregate' && outputs.length > 0) {
        results.push({
            connectionId: component.id,
            isValid: true,
            severity: 'info',
            message: 'Remember to configure GROUP BY columns in Aggregate component properties',
            affectedComponents: [component.id]
        });
    }

    // NEW RULE 19: Multiple inputs to non-Union component
    if (component.type === 'transformation' &&
        component.category !== 'UnionAll' &&
        component.category !== 'MergeJoin' &&
        component.category !== 'Lookup' &&
        inputs.length > 1) {
        results.push({
            connectionId: component.id,
            isValid: false,
            severity: 'error',
            message: `${component.category} cannot accept multiple inputs. Only Union All, Merge Join, and Lookup support multiple inputs.`,
            affectedComponents: [component.id]
        });
    }

    // Rule 20 removed - consolidated with Rules 26 and 30 to avoid duplicates

    // NEW RULE 21: Data Conversion should specify target types
    if (component.category === 'DataConversion' && outputs.length > 0) {
        results.push({
            connectionId: component.id,
            isValid: true,
            severity: 'info',
            message: 'Configure target data types in Data Conversion to match destination schema',
            affectedComponents: [component.id]
        });
    }

    // NEW RULE 22: Derived Column usage recommendation
    if (component.category === 'DerivedColumn' && outputs.length > 0) {
        results.push({
            connectionId: component.id,
            isValid: true,
            severity: 'info',
            message: 'Use Derived Column for simple calculations. For complex transformations, consider Script Component.',
            affectedComponents: [component.id]
        });
    }

    // NEW RULE 23: Row Count should be used for auditing
    if (component.category === 'RowCount') {
        results.push({
            connectionId: component.id,
            isValid: true,
            severity: 'info',
            message: 'Row Count stores the count in a variable. Ensure you log this variable for audit purposes.',
            affectedComponents: [component.id]
        });
    }

    // NEW RULE 24: Destinations should not be at the start
    if (component.type === 'destination' && inputs.length === 0) {
        results.push({
            connectionId: component.id,
            isValid: false,
            severity: 'error',
            message: 'Destination component must have at least one input connection',
            affectedComponents: [component.id]
        });
    }

    // Rule 25 removed - handled by Rule 40 in validateGlobalBestPractices to avoid duplicates

    // Rule 26 moved to validateGlobalBestPractices to consolidate Sort warnings

    // NEW RULE 27: Performance - Multiple lookups in sequence
    if (component.category === 'Lookup') {
        const upstreamLookups = inputs.filter(conn => {
            const source = getComponent(conn.source, components);
            return source && source.category === 'Lookup';
        });
        if (upstreamLookups.length > 0) {
            results.push({
                connectionId: component.id,
                isValid: true,
                severity: 'warning',
                message: 'Multiple lookups in sequence detected. Consider using Merge Join for better performance when joining large datasets.',
                suggestion: 'Replace sequential lookups with Merge Join if both inputs are large',
                affectedComponents: [component.id]
            });
        }
    }

    // NEW RULE 28: Performance - Aggregate without GROUP BY optimization hint
    if (component.category === 'Aggregate') {
        const hasUpstreamSort = inputs.some(conn => {
            const source = getComponent(conn.source, components);
            return source && (source.category === 'Sort' || source.isSorted === true);
        });
        if (!hasUpstreamSort && inputs.length > 0) {
            results.push({
                connectionId: component.id,
                isValid: true,
                severity: 'info',
                message: 'Aggregate performance can be improved by sorting input data by GROUP BY columns first.',
                suggestion: 'Add Sort transformation before Aggregate, sorted by GROUP BY columns',
                affectedComponents: [component.id]
            });
        }
    }

    // NEW RULE 29: Performance - Unnecessary data type conversions
    if (component.category === 'DataConversion') {
        const sourceComp = inputs.length > 0 ? getComponent(inputs[0].source, components) : null;
        const targetComp = outputs.length > 0 ? getComponent(outputs[0].target, components) : null;
        if (sourceComp && targetComp && sourceComp.dataType === targetComp.dataType) {
            results.push({
                connectionId: component.id,
                isValid: true,
                severity: 'warning',
                message: 'Data Conversion may be unnecessary if source and destination already have compatible data types.',
                suggestion: 'Verify if Data Conversion is required for this transformation',
                affectedComponents: [component.id]
            });
        }
    }

    // Rule 30 moved to validateGlobalBestPractices to consolidate memory warnings

    // Rule 31 moved to validateGlobalBestPractices to avoid duplicates

    // NEW RULE 32: Best Practice - Hardcoded connection strings (check properties)
    if ((component.type === 'source' || component.type === 'destination') && 
        component.properties?.connectionString && 
        component.properties.connectionString.includes('Data Source=')) {
        results.push({
            connectionId: component.id,
            isValid: true,
            severity: 'warning',
            message: 'Connection string appears to be hardcoded. Consider using connection managers or configuration files for better maintainability.',
            suggestion: 'Use SSIS Connection Managers or configuration files instead of hardcoded strings',
            affectedComponents: [component.id]
        });
    }

    // Rule 33 moved to validateGlobalBestPractices to avoid duplicates

    // Rule 34 moved to validateGlobalBestPractices to avoid duplicates

    // NEW RULE 35: Data Quality - Potential null value issues
    if (component.category === 'DerivedColumn' && component.properties?.expression) {
        const expr = component.properties.expression.toLowerCase();
        if (!expr.includes('isnull') && !expr.includes('coalesce') && !expr.includes('??')) {
            // Check if expression might produce nulls
            if (expr.includes('+') || expr.includes('/') || expr.includes('*')) {
                results.push({
                    connectionId: component.id,
                    isValid: true,
                    severity: 'warning',
                    message: 'Derived Column expression may produce NULL values. Consider using ISNULL or COALESCE to handle nulls.',
                    suggestion: 'Add null handling: ISNULL([Column], defaultValue) or COALESCE([Col1], [Col2], defaultValue)',
                    affectedComponents: [component.id]
                });
            }
        }
    }

    // NEW RULE 36: Data Quality - Data type precision warnings
    if (component.category === 'DataConversion') {
        results.push({
            connectionId: component.id,
            isValid: true,
            severity: 'info',
            message: 'Ensure target data types have sufficient precision and scale to avoid data truncation (e.g., DECIMAL(18,2) vs DECIMAL(10,2)).',
            suggestion: 'Verify precision and scale match source data requirements',
            affectedComponents: [component.id]
        });
    }

    // Rule 37 moved to validateGlobalBestPractices to avoid duplicates

    // Rule 38 moved to validateGlobalBestPractices to avoid duplicates

    // NEW RULE 39: Data Quality - Date format inconsistencies
    if (component.category === 'DerivedColumn' && component.properties?.expression) {
        const expr = component.properties.expression.toLowerCase();
        if (expr.includes('date') || expr.includes('datetime') || expr.includes('convert')) {
            results.push({
                connectionId: component.id,
                isValid: true,
                severity: 'info',
                message: 'Date format conversions detected. Ensure consistent date formats across all sources to avoid parsing errors.',
                suggestion: 'Standardize date formats using CONVERT or FORMAT functions consistently',
                affectedComponents: [component.id]
            });
        }
    }

    // Rule 40 moved to validateGlobalBestPractices to avoid duplicates

    return results;
}

// Helper function for orphaned component detection
function checkPathToDestination(
    componentId: string,
    components: SSISComponent[],
    connections: Connection[],
    visited: Set<string>
): boolean {
    if (visited.has(componentId)) return false;
    visited.add(componentId);

    const component = components.find(c => c.id === componentId);
    if (!component) return false;
    if (component.type === 'destination') return true;

    const outgoing = connections.filter(c => c.source === componentId);
    for (const conn of outgoing) {
        if (checkPathToDestination(conn.target, components, connections, visited)) {
            return true;
        }
    }

    return false;
}

// Global best practices validation - runs once per validation cycle
function validateGlobalBestPractices(
    components: SSISComponent[],
    connections: Connection[]
): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Filter to only data flow components (exclude control flow tasks)
    const dataFlowComponents = components.filter(c => 
        c.type === 'source' || 
        c.type === 'transformation' || 
        c.type === 'destination'
    );
    
    // Don't show suggestions for empty canvas or very small pipelines
    if (dataFlowComponents.length < 3) {
        return results;
    }

    // RULE 31: Best Practice - No logging/auditing components
    const hasRowCount = dataFlowComponents.some(c => c.category === 'RowCount');
    if (!hasRowCount) {
        results.push({
            connectionId: 'global-rule-31',
            isValid: true,
            severity: 'info',
            message: 'Consider adding Row Count component for auditing and tracking record counts through the pipeline.',
            suggestion: 'Add Row Count component to track data flow metrics',
            affectedComponents: []
        });
    }

    // RULE 33: Best Practice - Missing data validation
    const hasValidation = dataFlowComponents.some(c => 
        c.category === 'ConditionalSplit' || 
        (c.category === 'DerivedColumn' && c.properties?.expression?.includes('ISNULL')) ||
        c.category === 'Lookup'
    );
    if (!hasValidation) {
        results.push({
            connectionId: 'global-rule-33',
            isValid: true,
            severity: 'info',
            message: 'Consider adding data validation steps (Conditional Split, Lookup, or Derived Column with validation logic) to ensure data quality.',
            suggestion: 'Add validation transformations to check data quality before loading',
            affectedComponents: []
        });
    }

    // RULE 34: Best Practice - No incremental load strategy
    const hasIncrementalPattern = dataFlowComponents.some(c => 
        (c.category === 'Lookup' && c.referenceInput?.includes('last-load')) ||
        c.properties?.incrementalLoad === true
    );
    if (!hasIncrementalPattern) {
        const hasDateFilter = dataFlowComponents.some(c => 
            c.properties?.query?.includes('WHERE') && 
            (c.properties.query.includes('Date') || c.properties.query.includes('Modified'))
        );
        if (!hasDateFilter) {
            results.push({
                connectionId: 'global-rule-34',
                isValid: true,
                severity: 'info',
                message: 'For large datasets, consider implementing incremental load strategy using date filters or change detection.',
                suggestion: 'Add date-based filtering or CDC pattern for incremental loads',
                affectedComponents: []
            });
        }
    }

    // RULE 37: Data Quality - Missing data cleansing steps
    const hasCleansing = dataFlowComponents.some(c => 
        c.category === 'DerivedColumn' && (
            c.properties?.expression?.toLowerCase().includes('trim') ||
            c.properties?.expression?.toLowerCase().includes('ltrim') ||
            c.properties?.expression?.toLowerCase().includes('rtrim') ||
            c.properties?.expression?.toLowerCase().includes('upper') ||
            c.properties?.expression?.toLowerCase().includes('lower') ||
            c.properties?.expression?.toLowerCase().includes('replace')
        )
    );
    if (!hasCleansing && dataFlowComponents.some(c => c.type === 'source' && c.category === 'FlatFileSource')) {
        results.push({
            connectionId: 'global-rule-37',
            isValid: true,
            severity: 'info',
            message: 'Flat File sources may contain inconsistent data. Consider adding data cleansing steps (TRIM, UPPER, LOWER) in Derived Column.',
            suggestion: 'Add Derived Column with TRIM, UPPER, or data standardization expressions',
            affectedComponents: []
        });
    }

    // RULE 38: Data Quality - No duplicate detection
    const hasDeduplication = dataFlowComponents.some(c => 
        c.category === 'Sort' && 
        dataFlowComponents.some(comp => 
            comp.category === 'Aggregate' && 
            connections.some(conn => conn.source === c.id && conn.target === comp.id)
        )
    );
    if (!hasDeduplication) {
        results.push({
            connectionId: 'global-rule-38',
            isValid: true,
            severity: 'info',
            message: 'Consider adding duplicate detection logic (Sort + Aggregate) if source data may contain duplicates.',
            suggestion: 'Add Sort followed by Aggregate to remove duplicates based on business key',
            affectedComponents: []
        });
    }

    // RULE 26: Performance - Sort optimization (consolidated)
    const sortComponents = dataFlowComponents.filter(c => c.category === 'Sort');
    if (sortComponents.length > 0) {
        const sortsWithoutFilter = sortComponents.filter(sortComp => {
            const sortInputs = connections.filter(c => c.target === sortComp.id);
            const hasUpstreamFilter = sortInputs.some(conn => {
                const source = getComponent(conn.source, dataFlowComponents);
                return source && source.category === 'ConditionalSplit';
            });
            return !hasUpstreamFilter && sortInputs.length > 0;
        });
        
        if (sortsWithoutFilter.length > 0) {
            results.push({
                connectionId: 'global-rule-26',
                isValid: true,
                severity: 'warning',
                message: `Some Sort components (${sortsWithoutFilter.length} total) are operating on large datasets without pre-filtering. Consider filtering data before sorting to reduce memory usage.`,
                suggestion: 'Add Conditional Split or filter in source query before Sort',
                affectedComponents: sortsWithoutFilter.map(c => c.id)
            });
        }
    }

    // RULE 30: Performance - Memory-intensive operations (consolidated)
    const memoryIntensiveOps = ['Aggregate', 'MergeJoin'];
    const memoryIntensiveComponents = dataFlowComponents.filter(c => 
        memoryIntensiveOps.includes(c.category)
    );
    
    if (memoryIntensiveComponents.length > 0) {
        const componentsWithMultipleInputs = memoryIntensiveComponents.filter(comp => {
            const compInputs = connections.filter(c => c.target === comp.id);
            return compInputs.length > 1;
        });
        
        if (componentsWithMultipleInputs.length > 0) {
            results.push({
                connectionId: 'global-rule-30',
                isValid: true,
                severity: 'warning',
                message: `Some components (${componentsWithMultipleInputs.length} total: ${componentsWithMultipleInputs.map(c => c.category).join(', ')}) are memory-intensive. Monitor buffer memory usage, especially with large datasets.`,
                suggestion: 'Consider increasing buffer memory or processing data in smaller batches',
                affectedComponents: componentsWithMultipleInputs.map(c => c.id)
            });
        }
    }

    // RULE 40: Best Practice - Missing error output configuration (only show once, not per component)
    const supportsErrorOutput = ['Lookup', 'OLEDBSource', 'OLEDBDestination', 'FlatFileSource', 'FlatFileDestination'];
    const componentsNeedingErrorOutput = dataFlowComponents.filter(c => 
        supportsErrorOutput.includes(c.category)
    );
    
    if (componentsNeedingErrorOutput.length > 0) {
        const componentsWithoutErrorOutput = componentsNeedingErrorOutput.filter(comp => {
            const outputs = connections.filter(c => c.source === comp.id);
            return outputs.length <= 1; // No error output configured
        });
        
        if (componentsWithoutErrorOutput.length > 0) {
            // Only show one warning, not one per component
            const firstComponent = componentsWithoutErrorOutput[0];
            results.push({
                connectionId: 'global-rule-40',
                isValid: true,
                severity: 'warning',
                message: `Some components (${componentsWithoutErrorOutput.length} total) support error output but it's not configured. Configure error output to handle data quality issues and connection failures gracefully.`,
                suggestion: 'Configure error output path to log or handle failed rows separately',
                affectedComponents: componentsWithoutErrorOutput.map(c => c.id)
            });
        }
    }

    return results;
}

export function validateGraph(
    components: SSISComponent[],
    connections: Connection[]
): ValidationResult[] {
    let allResults: ValidationResult[] = [];

    // Validate all connections
    connections.forEach(conn => {
        const result = validateConnection(conn, components, connections);
        if (!result.isValid || result.severity !== 'info') {
            allResults.push(result);
        }
    });

    // Validate all components
    components.forEach(comp => {
        const compResults = validateComponent(comp, components, connections);
        allResults = [...allResults, ...compResults];
    });

    // Add global best practices (only once, not per component)
    const globalResults = validateGlobalBestPractices(components, connections);
    allResults = [...allResults, ...globalResults];

    return allResults;
}
