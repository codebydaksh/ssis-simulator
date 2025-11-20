import { SSISComponent, Connection } from './types';
import { generateDatabricksCode } from './databricksCodeGenerator';

export interface ExportOptions {
    format: 'ipynb' | 'py' | 'dlt' | 'job' | 'terraform' | 'arm' | 'cli';
    includeComments?: boolean;
    clusterConfig?: Record<string, unknown>;
}

export function exportDatabricksPipeline(
    components: SSISComponent[],
    connections: Connection[],
    options: ExportOptions
): string {
    switch (options.format) {
        case 'ipynb':
            return exportToNotebook(components, connections, options);
        case 'py':
            return exportToPython(components, connections, options);
        case 'dlt':
            return exportToDLT(components, connections, options);
        case 'job':
            return exportToJobJSON(components, connections, options);
        case 'terraform':
            return exportToTerraform(components, connections, options);
        case 'arm':
            return exportToARM(components, connections, options);
        case 'cli':
            return exportToCLI(components, connections, options);
        default:
            throw new Error(`Unsupported export format: ${options.format}`);
    }
}

function exportToNotebook(
    components: SSISComponent[],
    connections: Connection[],
    options: ExportOptions
): string {
    const { pyspark } = generateDatabricksCode(components, connections);
    const codeLines = pyspark.split('\n');
    
    const cells = codeLines.map(line => ({
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [line + '\n']
    }));

    const notebook = {
        cells: cells,
        metadata: {
            kernelspec: {
                display_name: 'Python 3',
                language: 'python',
                name: 'python3'
            },
            language_info: {
                name: 'python',
                version: '3.8.0'
            }
        },
        nbformat: 4,
        nbformat_minor: 4
    };

    return JSON.stringify(notebook, null, 2);
}

function exportToPython(
    components: SSISComponent[],
    connections: Connection[],
    options: ExportOptions
): string {
    const { pyspark } = generateDatabricksCode(components, connections);
    const header = options.includeComments
        ? `# Databricks Pipeline Export
# Generated: ${new Date().toISOString()}
# Components: ${components.length}
# Connections: ${connections.length}

`
        : '';
    return header + pyspark;
}

function exportToDLT(
    components: SSISComponent[],
    connections: Connection[],
    options: ExportOptions
): string {
    const dltComponents = components.filter(c => c.category === 'DeltaLiveTables');
    
    if (dltComponents.length === 0) {
        return JSON.stringify({
            error: 'No Delta Live Tables components found in pipeline'
        }, null, 2);
    }

    const dltPipeline = {
        name: 'exported_dlt_pipeline',
        target: 'main.default',
        storage: '/pipelines/storage',
        libraries: [],
        clusters: [],
        notebooks: dltComponents.map(comp => ({
            path: comp.properties?.notebookPath as string || '/path/to/notebook',
            parameters: comp.properties?.parameters as Record<string, string> || {}
        }))
    };

    return JSON.stringify(dltPipeline, null, 2);
}

function exportToJobJSON(
    components: SSISComponent[],
    connections: Connection[],
    options: ExportOptions
): string {
    const jobComponents = components.filter(c => c.type === 'orchestration');
    const notebookComponents = components.filter(c => c.type === 'notebook');

    const tasks = jobComponents.map(comp => {
        const props = comp.properties || {};
        if (comp.category === 'NotebookTask') {
            return {
                task_key: comp.name.toLowerCase().replace(/\s+/g, '_'),
                notebook_task: {
                    notebook_path: props.notebookPath as string || '/path/to/notebook',
                    base_parameters: props.parameters as Record<string, string> || {}
                }
            };
        } else if (comp.category === 'JARTask') {
            return {
                task_key: comp.name.toLowerCase().replace(/\s+/g, '_'),
                spark_jar_task: {
                    main_class_name: props.mainClassName as string || 'Main',
                    parameters: props.parameters as string[] || []
                }
            };
        } else if (comp.category === 'PythonWheelTask') {
            return {
                task_key: comp.name.toLowerCase().replace(/\s+/g, '_'),
                python_wheel_task: {
                    package_name: props.packagePath as string || 'package',
                    entry_point: props.entryPoint as string || 'main',
                    parameters: props.parameters as Record<string, string> || {}
                }
            };
        }
        return null;
    }).filter(t => t !== null);

    const jobDef = {
        name: 'exported_databricks_job',
        tasks: tasks,
        timeout_seconds: 3600,
        max_concurrent_runs: 1,
        schedule: {
            quartz_cron_expression: '0 0 0 * * ?',
            timezone_id: 'UTC'
        },
        email_notifications: {
            on_success: [],
            on_failure: []
        }
    };

    return JSON.stringify(jobDef, null, 2);
}

function exportToTerraform(
    components: SSISComponent[],
    connections: Connection[],
    options: ExportOptions
): string {
    const clusters = components.filter(c => c.type === 'cluster');
    const jobs = components.filter(c => c.type === 'orchestration');

    const terraformConfig = {
        terraform: {
            required_providers: {
                databricks: {
                    source: 'databricks/databricks',
                    version: '~> 1.0'
                }
            }
        },
        provider: {
            databricks: {
                host: '${var.databricks_host}',
                token: '${var.databricks_token}'
            }
        },
        resource: {
            databricks_cluster: clusters.map((cluster, idx) => {
                const props = cluster.properties || {};
                return {
                    [`cluster_${idx}`]: {
                        cluster_name: cluster.name,
                        spark_version: props.runtimeVersion as string || '13.3.x-scala2.12',
                        node_type_id: props.nodeType as string || 'Standard_DS3_v2',
                        num_workers: props.numWorkers as number || 2,
                        autotermination_minutes: props.autoterminationMinutes as number || 30,
                        autoscale: {
                            min_workers: props.minWorkers as number || 1,
                            max_workers: props.maxWorkers as number || 8
                        }
                    }
                };
            }).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
            databricks_job: jobs.map((job, idx) => {
                return {
                    [`job_${idx}`]: {
                        name: job.name,
                        timeout_seconds: job.properties?.timeout as number || 3600,
                        max_concurrent_runs: 1
                    }
                };
            }).reduce((acc, curr) => ({ ...acc, ...curr }), {})
        }
    };

    return JSON.stringify(terraformConfig, null, 2);
}

function exportToARM(
    components: SSISComponent[],
    connections: Connection[],
    options: ExportOptions
): string {
    const armTemplate = {
        $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
        contentVersion: '1.0.0.0',
        parameters: {
            workspaceName: {
                type: 'string',
                metadata: {
                    description: 'Name of the Databricks workspace'
                }
            }
        },
        resources: [
            {
                type: 'Microsoft.Databricks/workspaces',
                name: '[parameters("workspaceName")]',
                location: '[resourceGroup().location]',
                apiVersion: '2018-04-01',
                sku: {
                    name: 'standard'
                },
                properties: {
                    managedResourceGroupId: '[concat(subscription().id, "/resourceGroups/", parameters("workspaceName"), "-managed")]'
                }
            }
        ]
    };

    return JSON.stringify(armTemplate, null, 2);
}

function exportToCLI(
    components: SSISComponent[],
    connections: Connection[],
    options: ExportOptions
): string {
    const lines: string[] = [];
    
    lines.push('# Databricks CLI Commands');
    lines.push('# Generated: ' + new Date().toISOString());
    lines.push('');
    lines.push('# Set workspace URL');
    lines.push('export DATABRICKS_HOST="https://your-workspace.cloud.databricks.com"');
    lines.push('export DATABRICKS_TOKEN="your-token"');
    lines.push('');

    const clusters = components.filter(c => c.type === 'cluster');
    clusters.forEach((cluster, idx) => {
        const props = cluster.properties || {};
        lines.push(`# Create cluster: ${cluster.name}`);
        lines.push(`databricks clusters create --json '{
  "cluster_name": "${cluster.name}",
  "spark_version": "${props.runtimeVersion || '13.3.x-scala2.12'}",
  "node_type_id": "${props.nodeType || 'Standard_DS3_v2'}",
  "num_workers": ${props.numWorkers || 2},
  "autotermination_minutes": ${props.autoterminationMinutes || 30}
}'`);
        lines.push('');
    });

    const jobs = components.filter(c => c.type === 'orchestration');
    jobs.forEach((job, idx) => {
        lines.push(`# Create job: ${job.name}`);
        lines.push(`databricks jobs create --json '{
  "name": "${job.name}",
  "timeout_seconds": ${job.properties?.timeout || 3600},
  "max_concurrent_runs": 1
}'`);
        lines.push('');
    });

    return lines.join('\n');
}

export function downloadExport(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

