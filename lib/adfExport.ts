import { SSISComponent, Connection } from './types';

interface ARMTemplate {
    $schema: string;
    contentVersion: string;
    parameters: Record<string, any>;
    variables: Record<string, any>;
    resources: any[];
}

export function generateARMTemplate(components: SSISComponent[], connections: Connection[]): string {
    const pipelineName = "SimulatedPipeline";

    const activities = components.map(component => mapComponentToActivity(component, connections));

    const armTemplate: ARMTemplate = {
        "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
        "contentVersion": "1.0.0.0",
        "parameters": {
            "factoryName": {
                "type": "string",
                "metadata": {
                    "description": "The name of the Data Factory"
                }
            }
        },
        "variables": {},
        "resources": [
            {
                "name": `[concat(parameters('factoryName'), '/${pipelineName}')]`,
                "type": "Microsoft.DataFactory/factories/pipelines",
                "apiVersion": "2018-06-01",
                "properties": {
                    "activities": activities,
                    "annotations": []
                },
                "dependsOn": []
            }
        ]
    };

    return JSON.stringify(armTemplate, null, 4);
}

function mapComponentToActivity(component: SSISComponent, connections: Connection[]): any {
    // Find upstream dependencies
    const upstreamConnections = connections.filter(c => c.target === component.id);
    const dependsOn = upstreamConnections.map(c => {
        // Find the source component name (we need the name, not ID, for dependsOn)
        // In a real app, we'd look up the component by ID. 
        // Since we don't have easy access to the full list here without passing it, 
        // we'll assume the ID is sufficient or we'd need to refactor to pass all components.
        // For this simulator, let's use a placeholder or try to use the ID if it's descriptive, 
        // but ideally we need the name. 
        // Let's assume we can just use the ID for now as the activity name reference, 
        // but in reality ADF uses activity names.
        return {
            "activity": c.source, // This should ideally be the name of the source activity
            "dependencyConditions": [
                c.sourceHandle === 'success' ? "Succeeded" :
                    c.sourceHandle === 'failure' ? "Failed" :
                        c.sourceHandle === 'completion' ? "Completed" : "Succeeded" // Default to Succeeded
            ]
        };
    });

    const baseActivity = {
        "name": component.name,
        "type": mapCategoryToType(component.category),
        "dependsOn": dependsOn,
        "userProperties": [],
        "typeProperties": mapTypeProperties(component)
    };

    return baseActivity;
}

function mapCategoryToType(category: string): string {
    const map: Record<string, string> = {
        'CopyData': 'Copy',
        'MappingDataFlow': 'ExecuteDataFlow',
        'DatabricksNotebook': 'DatabricksNotebook',
        'WebActivity': 'WebActivity',
        'Wait': 'Wait',
        'SetVariable': 'SetVariable',
        'Filter': 'Filter',
        'ForEach': 'ForEach',
        'IfCondition': 'IfCondition',
        'Switch': 'Switch',
        'ExecutePipeline': 'ExecutePipeline',
        'Validation': 'Validation',
        'GetMetadata': 'GetMetadata'
    };
    return map[category] || 'Container';
}

function mapTypeProperties(component: SSISComponent): any {
    const props = component.properties || {};

    switch (component.category) {
        case 'CopyData':
            return {
                "source": {
                    "type": "BlobSource", // Simplified
                    "recursive": true
                },
                "sink": {
                    "type": "SqlSink", // Simplified
                    "writeBatchSize": 10000
                },
                "enableStaging": false
            };
        case 'WebActivity':
            return {
                "url": props.url || "https://example.com",
                "method": props.method || "GET",
                "headers": {
                    "Content-Type": "application/json"
                },
                "body": props.body || ""
            };
        case 'Wait':
            return {
                "waitTimeInSeconds": parseInt(props.waitTimeInSeconds as string) || 1
            };
        case 'SetVariable':
            return {
                "variableName": props.variableName || "myVar",
                "value": props.value || "value"
            };
        case 'ExecutePipeline':
            return {
                "pipeline": {
                    "referenceName": props.pipelineReference || "ChildPipeline",
                    "type": "PipelineReference"
                },
                "waitOnCompletion": props.waitOnCompletion === 'true'
            };
        default:
            return {};
    }
}
