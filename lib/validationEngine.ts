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

    // NEW RULE 20: Performance warning for Sort on large datasets
    if (component.category === 'Sort') {
        results.push({
            connectionId: component.id,
            isValid: true,
            severity: 'info',
            message: 'Sort operations are memory-intensive. For large datasets, ensure adequate buffer memory or consider pre-sorted sources.',
            affectedComponents: [component.id]
        });
    }

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

    // NEW RULE 25: Recommend error output configuration
    const supportsErrorOutput = ['DataConversion', 'Lookup', 'OLEDBDestination', 'FlatFileDestination'];
    if (supportsErrorOutput.includes(component.category) && outputs.length === 1) {
        results.push({
            connectionId: component.id,
            isValid: true,
            severity: 'info',
            message: `${component.category} supports error output redirection. Consider adding error handling path for robustness.`,
            suggestion: 'Configure error output to handle failures gracefully',
            affectedComponents: [component.id]
        });
    }

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

    return allResults;
}
