import { ADFComponent, Connection, ValidationResult } from './types';

export const validateADFPipeline = (components: ADFComponent[], connections: Connection[]): ValidationResult[] => {
    const results: ValidationResult[] = [];

    components.forEach(component => {
        // 1. General Validation: Name requirements
        if (!component.name || (typeof component.name === 'string' && component.name.trim() === '')) {
            results.push({
                connectionId: component.id as string,
                isValid: false,
                severity: 'error',
                message: 'Activity name is required.',
                affectedComponents: [component.id as string]
            });
        }

        // 2. Activity Specific Validation
        switch (component.category) {
            case 'CopyData':
                validateCopyData(component, results);
                break;
            case 'WebActivity':
                validateWebActivity(component, results);
                break;
            case 'Wait':
                validateWaitActivity(component, results);
                break;
            case 'ForEach':
                validateForEachActivity(component, results);
                break;
            case 'IfCondition':
                validateIfCondition(component, results);
                break;
            case 'Switch':
                validateSwitchActivity(component, results);
                break;
            case 'ExecutePipeline':
                validateExecutePipeline(component, results);
                break;
            case 'SetVariable':
                validateSetVariable(component, results);
                break;
        }
    });

    // 3. Connection Validation
    // Ensure no isolated components (except maybe trigger-based ones, but for now warn)
    components.forEach(component => {
        const hasInput = connections.some(c => c.target === component.id);
        const hasOutput = connections.some(c => c.source === component.id);

        // Start nodes don't need input, End nodes don't need output
        // But generally, isolated nodes are suspicious
        if (!hasInput && !hasOutput && components.length > 1) {
            results.push({
                connectionId: component.id as string,
                isValid: true, // It's valid but worth a warning
                severity: 'warning',
                message: 'Activity is isolated (no inputs or outputs).',
                affectedComponents: [component.id as string]
            });
        }
    });

    return results;
};

const validateCopyData = (component: ADFComponent, results: ValidationResult[]) => {
    // In a real ADF, Source and Sink are complex objects. 
    // Here we check if they are defined in properties or if we have defaults.
    // For now, we'll check if linkedService is set (if we added that property)
    if (!component.linkedService) {
        results.push({
            connectionId: component.id as string,
            isValid: false,
            severity: 'warning', // Warning for now as UI might not support setting it yet
            message: 'Linked Service should be defined.',
            affectedComponents: [component.id as string]
        });
    }
};

const validateWebActivity = (component: ADFComponent, results: ValidationResult[]) => {
    const props = (component.properties || {}) as Record<string, unknown>;
    if (!props.url) {
        results.push({
            connectionId: component.id as string,
            isValid: false,
            severity: 'error',
            message: 'URL is required for Web Activity.',
            affectedComponents: [component.id as string]
        });
    }
    if (!props.method) {
        results.push({
            connectionId: component.id as string,
            isValid: false,
            severity: 'error',
            message: 'HTTP Method is required for Web Activity.',
            affectedComponents: [component.id as string]
        });
    }
};

const validateWaitActivity = (component: ADFComponent, results: ValidationResult[]) => {
    const props = (component.properties || {}) as Record<string, unknown>;
    const waitTime = props.waitTimeInSeconds;
    if (waitTime !== undefined && waitTime !== null && typeof waitTime === 'number' && waitTime < 0) {
        results.push({
            connectionId: component.id as string,
            isValid: false,
            severity: 'error',
            message: 'Wait time cannot be negative.',
            affectedComponents: [component.id as string]
        });
    }
};

const validateForEachActivity = (component: ADFComponent, results: ValidationResult[]) => {
    const props = (component.properties || {}) as Record<string, unknown>;
    const items = props.items;
    if (!items || (typeof items === 'string' && items.trim() === '')) {
        results.push({
            connectionId: component.id as string,
            isValid: false,
            severity: 'error',
            message: 'Items property is required for ForEach activity.',
            affectedComponents: [component.id as string]
        });
    }
};

const validateIfCondition = (component: ADFComponent, results: ValidationResult[]) => {
    const props = (component.properties || {}) as Record<string, unknown>;
    const expression = props.expression;
    if (!expression || (typeof expression === 'string' && expression.trim() === '')) {
        results.push({
            connectionId: component.id as string,
            isValid: false,
            severity: 'error',
            message: 'Expression is required for If Condition.',
            affectedComponents: [component.id as string]
        });
    }
};

const validateSwitchActivity = (component: ADFComponent, results: ValidationResult[]) => {
    const props = (component.properties || {}) as Record<string, unknown>;
    const on = props.on;
    if (!on || (typeof on === 'string' && on.trim() === '')) {
        results.push({
            connectionId: component.id as string,
            isValid: false,
            severity: 'error',
            message: 'On property (expression) is required for Switch activity.',
            affectedComponents: [component.id as string]
        });
    }
};

const validateExecutePipeline = (component: ADFComponent, results: ValidationResult[]) => {
    const props = (component.properties || {}) as Record<string, unknown>;
    const pipelineRef = props.pipelineReference;
    if (!pipelineRef || (typeof pipelineRef === 'string' && pipelineRef.trim() === '')) {
        results.push({
            connectionId: component.id as string,
            isValid: false,
            severity: 'warning',
            message: 'Pipeline Reference is required for Execute Pipeline activity.',
            affectedComponents: [component.id as string]
        });
    }
};

const validateSetVariable = (component: ADFComponent, results: ValidationResult[]) => {
    const props = (component.properties || {}) as Record<string, unknown>;
    if (!props.variableName) {
        results.push({
            connectionId: component.id as string,
            isValid: false,
            severity: 'warning',
            message: 'Variable Name is required.',
            affectedComponents: [component.id as string]
        });
    }
};
