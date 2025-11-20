import { SSISComponent, Connection, ValidationResult } from './types';

export function validateDatabricksPipeline(
    components: SSISComponent[],
    connections: Connection[]
): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Filter to only Databricks components
    const databricksComponents = components.filter(c =>
        ['notebook', 'dataSource', 'transformation', 'output', 'orchestration', 'cluster'].includes(c.type)
    );

    if (databricksComponents.length === 0) {
        return results;
    }

    // Configuration Rules (20 rules)
    validateConfigurationRules(databricksComponents, connections, results);

    // Performance Rules (12 rules)
    validatePerformanceRules(databricksComponents, connections, results);

    // Data Quality Rules (18 rules)
    validateDataQualityRules(databricksComponents, connections, results);

    // Best Practices Rules (20 rules)
    validateBestPracticesRules(databricksComponents, connections, results);

    return results;
}

function validateConfigurationRules(
    components: SSISComponent[],
    connections: Connection[],
    results: ValidationResult[]
): void {
    // Rule 1: Check cluster configuration is defined
    const componentsNeedingCluster = components.filter(c =>
        ['notebook', 'dataSource', 'transformation', 'output'].includes(c.type) &&
        !c.properties?.clusterId
    );
    if (componentsNeedingCluster.length > 0) {
        results.push({
            connectionId: 'config-cluster',
            isValid: false,
            severity: 'error',
            message: `${componentsNeedingCluster.length} component(s) need cluster configuration. Configure a cluster for execution.`,
            affectedComponents: componentsNeedingCluster.map(c => c.id)
        });
    }

    // Rule 2: Validate runtime version compatibility
    const clusters = components.filter(c => c.type === 'cluster');
    clusters.forEach(cluster => {
        const runtimeVersion = cluster.properties?.runtimeVersion as string;
        if (runtimeVersion && !runtimeVersion.includes('LTS') && !runtimeVersion.includes('13.3') && !runtimeVersion.includes('14.3')) {
            results.push({
                connectionId: cluster.id,
                isValid: true,
                severity: 'warning',
                message: 'Non-LTS runtime version detected. Consider using LTS versions (13.3 LTS, 14.3 LTS) for production workloads.',
                affectedComponents: [cluster.id]
            });
        }
    });

    // Rule 3: Ensure libraries are specified for custom requirements
    const notebooksWithCustomLibs = components.filter(c =>
        c.type === 'notebook' &&
        c.properties?.notebookLanguage === 'python' &&
        !c.properties?.libraries
    );
    if (notebooksWithCustomLibs.length > 0) {
        results.push({
            connectionId: 'config-libraries',
            isValid: true,
            severity: 'info',
            message: 'Consider specifying libraries if your notebook requires custom packages.',
            affectedComponents: notebooksWithCustomLibs.map(c => c.id)
        });
    }

    // Rule 4: Check Delta Lake catalog/schema/table naming conventions
    const deltaComponents = components.filter(c =>
        ['DeltaTableSource', 'DeltaTableSink'].includes(c.category)
    );
    deltaComponents.forEach(comp => {
        const catalog = comp.properties?.catalog as string;
        const schema = comp.properties?.schema as string;
        const table = comp.properties?.table as string;
        if (!catalog || !schema || !table) {
            results.push({
                connectionId: comp.id,
                isValid: false,
                severity: 'error',
                message: 'Delta table components must specify catalog, schema, and table name.',
                affectedComponents: [comp.id]
            });
        }
    });

    // Rule 5: Validate notebook language matches cluster setup
    const notebooks = components.filter(c => c.type === 'notebook');
    notebooks.forEach(notebook => {
        const language = notebook.properties?.notebookLanguage as string;
        if (!language || !['python', 'scala', 'sql', 'r', 'markdown'].includes(language)) {
            results.push({
                connectionId: notebook.id,
                isValid: false,
                severity: 'error',
                message: 'Notebook must specify a valid language (python, scala, sql, r, or markdown).',
                affectedComponents: [notebook.id]
            });
        }
    });

    // Rule 6: Ensure Unity Catalog permissions (simulated check)
    const unityCatalogComponents = components.filter(c =>
        c.properties?.catalog && c.properties?.catalog !== 'main'
    );
    if (unityCatalogComponents.length > 0) {
        results.push({
            connectionId: 'config-unity-catalog',
            isValid: true,
            severity: 'info',
            message: 'Ensure proper Unity Catalog permissions are configured for non-main catalogs.',
            affectedComponents: unityCatalogComponents.map(c => c.id)
        });
    }

    // Rule 7: Check secret scope references
    const componentsWithSecrets = components.filter(c => {
        const props = c.properties || {};
        const propsStr = JSON.stringify(props);
        return propsStr.includes('secret(') || propsStr.includes('dbutils.secrets');
    });
    if (componentsWithSecrets.length > 0) {
        results.push({
            connectionId: 'config-secrets',
            isValid: true,
            severity: 'info',
            message: 'Ensure secret scopes are properly configured in Databricks workspace.',
            affectedComponents: componentsWithSecrets.map(c => c.id)
        });
    }

    // Rule 8: Validate mount points for cloud storage
    const storageComponents = components.filter(c =>
        ['AzureBlobStorage', 'ADLSGen2'].includes(c.category)
    );
    storageComponents.forEach(comp => {
        const path = comp.properties?.path as string;
        if (path && path.startsWith('/mnt/') && !comp.properties?.mountPoint) {
            results.push({
                connectionId: comp.id,
                isValid: true,
                severity: 'warning',
                message: 'Mount point detected. Ensure mount is configured before execution.',
                affectedComponents: [comp.id]
            });
        }
    });

    // Rule 9: Ensure Spark config is optimized
    const clustersWithoutConfig = components.filter(c =>
        c.type === 'cluster' &&
        !c.properties?.sparkConfig
    );
    if (clustersWithoutConfig.length > 0) {
        results.push({
            connectionId: 'config-spark',
            isValid: true,
            severity: 'info',
            message: 'Consider optimizing Spark configuration for your workload (e.g., spark.sql.shuffle.partitions).',
            affectedComponents: clustersWithoutConfig.map(c => c.id)
        });
    }

    // Rule 10: Check for deprecated APIs
    const notebooksWithCode = components.filter(c =>
        c.type === 'notebook' &&
        c.properties?.code &&
        typeof c.properties.code === 'string'
    );
    notebooksWithCode.forEach(notebook => {
        const code = notebook.properties?.code as string;
        if (code && code.includes('dbutils.fs.ls') && !code.includes('dbutils.fs.list')) {
            results.push({
                connectionId: notebook.id,
                isValid: true,
                severity: 'warning',
                message: 'Consider using newer Databricks utilities API if available.',
                affectedComponents: [notebook.id]
            });
        }
    });

    // Rule 11: Validate Databricks Runtime (DBR) version is Long-Term Support (LTS)
    clusters.forEach(cluster => {
        const runtimeVersion = cluster.properties?.runtimeVersion as string;
        if (runtimeVersion && !runtimeVersion.match(/1[3-4]\.\d+.*LTS/)) {
            results.push({
                connectionId: cluster.id,
                isValid: true,
                severity: 'warning',
                message: 'Production workloads should use LTS versions (e.g., 13.3 LTS, 14.3 LTS).',
                affectedComponents: [cluster.id]
            });
        }
    });

    // Rule 12: Check for proper init scripts configuration
    const clustersWithInitScripts = components.filter(c =>
        c.type === 'cluster' &&
        c.properties?.initScripts &&
        Array.isArray(c.properties.initScripts) &&
        Array.isArray(c.properties.initScripts) && c.properties.initScripts.length > 0
    );
    if (clustersWithInitScripts.length > 0) {
        results.push({
            connectionId: 'config-init-scripts',
            isValid: true,
            severity: 'info',
            message: 'Ensure init scripts are stored in DBFS or workspace and execution order is correct.',
            affectedComponents: clustersWithInitScripts.map(c => c.id)
        });
    }

    // Rule 13: Validate instance pool configuration
    const clustersWithPool = components.filter(c =>
        c.type === 'cluster' &&
        c.properties?.instancePoolId
    );
    if (clustersWithPool.length === 0 && clusters.length > 0) {
        results.push({
            connectionId: 'config-instance-pool',
            isValid: true,
            severity: 'info',
            message: 'Consider using instance pools for faster cluster startup times.',
            affectedComponents: clusters.map(c => c.id)
        });
    }

    // Rule 14: Ensure workspace-to-workspace token authentication
    const crossWorkspaceComponents = components.filter(c => {
        const props = c.properties || {};
        return props.workspaceUrl && props.workspaceUrl !== '';
    });
    if (crossWorkspaceComponents.length > 0) {
        results.push({
            connectionId: 'config-workspace-auth',
            isValid: true,
            severity: 'info',
            message: 'Ensure service principal or PAT tokens are configured for cross-workspace access.',
            affectedComponents: crossWorkspaceComponents.map(c => c.id)
        });
    }

    // Rule 15: Check for proper logging and monitoring configuration
    const jobs = components.filter(c => c.type === 'orchestration');
    if (jobs.length > 0) {
        results.push({
            connectionId: 'config-logging',
            isValid: true,
            severity: 'info',
            message: 'Ensure cluster logs are sent to Azure Log Analytics and diagnostic settings are enabled.',
            affectedComponents: jobs.map(c => c.id)
        });
    }

    // Rule 16: Validate network security configuration
    const clustersWithoutVNet = components.filter(c =>
        c.type === 'cluster' &&
        !c.properties?.vnetInjection
    );
    if (clustersWithoutVNet.length > 0 && clusters.length > 1) {
        results.push({
            connectionId: 'config-network',
            isValid: true,
            severity: 'info',
            message: 'For enterprise scenarios, consider VNet injection and private endpoints.',
            affectedComponents: clustersWithoutVNet.map(c => c.id)
        });
    }

    // Rule 17: Check for workspace access control settings
    results.push({
        connectionId: 'config-rbac',
        isValid: true,
        severity: 'info',
        message: 'Ensure proper RBAC assignments and SCIM integration with Azure AD.',
        affectedComponents: []
    });

    // Rule 18: Validate cluster policy enforcement
    const clustersWithoutPolicy = components.filter(c =>
        c.type === 'cluster' &&
        !c.properties?.policyId
    );
    if (clustersWithoutPolicy.length > 0) {
        results.push({
            connectionId: 'config-cluster-policy',
            isValid: true,
            severity: 'info',
            message: 'Consider using cluster policies for cost control and standardization.',
            affectedComponents: clustersWithoutPolicy.map(c => c.id)
        });
    }

    // Rule 19: Check for proper Databricks Repos integration
    const notebooksInRepos = components.filter(c =>
        c.type === 'notebook' &&
        c.properties?.repoPath
    );
    if (notebooksInRepos.length === 0 && notebooks.length > 0) {
        results.push({
            connectionId: 'config-repos',
            isValid: true,
            severity: 'info',
            message: 'Consider using Databricks Repos for version control and CI/CD integration.',
            affectedComponents: notebooks.map(c => c.id)
        });
    }

    // Rule 20: Validate serverless SQL warehouse configuration
    const sqlWarehouses = components.filter(c => c.category === 'SQLWarehouse');
    sqlWarehouses.forEach(warehouse => {
        if (!warehouse.properties?.enablePhoton) {
            results.push({
                connectionId: warehouse.id,
                isValid: true,
                severity: 'warning',
                message: 'Enable Photon for better SQL query performance (2-3x improvement).',
                affectedComponents: [warehouse.id]
            });
        }
    });
}

function validatePerformanceRules(
    components: SSISComponent[],
    connections: Connection[],
    results: ValidationResult[]
): void {
    // Rule 1: Warn about missing shuffle partition tuning
    const clusters = components.filter(c => c.type === 'cluster');
    clusters.forEach(cluster => {
        const sparkConfig = cluster.properties?.sparkConfig as Record<string, string> | undefined;
        if (!sparkConfig || !sparkConfig['spark.sql.shuffle.partitions']) {
            results.push({
                connectionId: cluster.id,
                isValid: true,
                severity: 'warning',
                message: 'Consider tuning spark.sql.shuffle.partitions based on data size (default 200 may be suboptimal).',
                affectedComponents: [cluster.id]
            });
        }
    });

    // Rule 2: Suggest broadcast joins for small tables
    const joinTransforms = components.filter(c =>
        c.category === 'DataFrameTransform' &&
        c.properties?.joinType
    );
    joinTransforms.forEach(transform => {
        if (transform.properties?.joinType !== 'broadcast') {
            results.push({
                connectionId: transform.id,
                isValid: true,
                severity: 'info',
                message: 'For small lookup tables (< 2GB), consider using broadcast joins for better performance.',
                affectedComponents: [transform.id]
            });
        }
    });

    // Rule 3: Flag missing Z-ordering on Delta tables
    const deltaSinks = components.filter(c => c.category === 'DeltaTableSink');
    deltaSinks.forEach(sink => {
        const zOrderCols = sink.properties?.zOrderColumns;
        if (!zOrderCols || !Array.isArray(zOrderCols) || zOrderCols.length === 0) {
            results.push({
                connectionId: sink.id,
                isValid: true,
                severity: 'info',
                message: 'Consider Z-ordering Delta tables on frequently filtered columns for better query performance.',
                affectedComponents: [sink.id]
            });
        }
    });

    // Rule 4: Recommend caching for reused DataFrames
    const transforms = components.filter(c => c.type === 'transformation');
    if (transforms.length > 3) {
        results.push({
            connectionId: 'perf-caching',
            isValid: true,
            severity: 'info',
            message: 'Consider caching DataFrames that are reused multiple times in your pipeline.',
            affectedComponents: transforms.map(c => c.id)
        });
    }

    // Rule 5: Suggest partitioning strategy
    const deltaSinksWithoutPartition = components.filter(c =>
        c.category === 'DeltaTableSink' &&
        (!c.properties?.partitionBy || !Array.isArray(c.properties.partitionBy) || c.properties.partitionBy.length === 0)
    );
    if (deltaSinksWithoutPartition.length > 0) {
        results.push({
            connectionId: 'perf-partitioning',
            isValid: true,
            severity: 'info',
            message: 'Consider partitioning Delta tables on columns used in WHERE clauses for better query performance.',
            affectedComponents: deltaSinksWithoutPartition.map(c => c.id)
        });
    }

    // Rule 6: Warn about Cartesian joins
    const cartesianJoins = components.filter(c =>
        c.category === 'DataFrameTransform' &&
        c.properties?.joinType === 'cross'
    );
    if (cartesianJoins.length > 0) {
        results.push({
            connectionId: 'perf-cartesian',
            isValid: false,
            severity: 'error',
            message: 'Cartesian joins detected. These can cause performance issues. Use explicit join conditions.',
            affectedComponents: cartesianJoins.map(c => c.id)
        });
    }

    // Rule 7: Flag missing predicate pushdown
    const sourcesWithoutPredicate = components.filter(c =>
        c.type === 'dataSource' &&
        !c.properties?.filterCondition
    );
    if (sourcesWithoutPredicate.length > 0) {
        results.push({
            connectionId: 'perf-predicate',
            isValid: true,
            severity: 'info',
            message: 'Consider pushing filters to the source for better performance (predicate pushdown).',
            affectedComponents: sourcesWithoutPredicate.map(c => c.id)
        });
    }

    // Rule 8: Suggest Photon acceleration
    const sqlWarehouses = components.filter(c => c.category === 'SQLWarehouse');
    sqlWarehouses.forEach(warehouse => {
        if (!warehouse.properties?.enablePhoton) {
            results.push({
                connectionId: warehouse.id,
                isValid: true,
                severity: 'warning',
                message: 'Enable Photon engine for SQL workloads to get 2-3x performance improvement.',
                affectedComponents: [warehouse.id]
            });
        }
    });

    // Rule 9: Recommend cluster autoscaling settings
    const clustersWithoutAutoscaling = components.filter(c =>
        c.type === 'cluster' &&
        c.category !== 'JobCluster' &&
        (!c.properties?.autoscaling || c.properties.autoscaling === false)
    );
    if (clustersWithoutAutoscaling.length > 0) {
        results.push({
            connectionId: 'perf-autoscaling',
            isValid: true,
            severity: 'info',
            message: 'Enable autoscaling for variable workloads to optimize costs and performance.',
            affectedComponents: clustersWithoutAutoscaling.map(c => c.id)
        });
    }

    // Rule 10: Flag inefficient UDFs
    const notebooksWithUDFs = components.filter(c =>
        c.type === 'notebook' &&
        c.properties?.code &&
        typeof c.properties.code === 'string' &&
        (c.properties.code.includes('udf') || c.properties.code.includes('@udf'))
    );
    if (notebooksWithUDFs.length > 0) {
        results.push({
            connectionId: 'perf-udf',
            isValid: true,
            severity: 'warning',
            message: 'UDFs can be inefficient. Consider using built-in Spark functions or pandas UDFs for better performance.',
            affectedComponents: notebooksWithUDFs.map(c => c.id)
        });
    }

    // Rule 11: Suggest columnar storage formats
    const sinksWithRowFormat = components.filter(c =>
        c.type === 'output' &&
        c.properties?.format === 'csv'
    );
    if (sinksWithRowFormat.length > 0) {
        results.push({
            connectionId: 'perf-format',
            isValid: true,
            severity: 'warning',
            message: 'CSV is row-based. Consider using Parquet or Delta for better performance and compression.',
            affectedComponents: sinksWithRowFormat.map(c => c.id)
        });
    }

    // Rule 12: Warn about skewed data
    const groupByTransforms = components.filter(c =>
        c.category === 'DataFrameTransform' &&
        c.properties?.groupByColumns &&
        Array.isArray(c.properties.groupByColumns) && c.properties.groupByColumns.length > 0
    );
    if (groupByTransforms.length > 0) {
        results.push({
            connectionId: 'perf-skew',
            isValid: true,
            severity: 'info',
            message: 'Monitor for data skew in groupBy operations. Consider salting keys if skew is detected.',
            affectedComponents: groupByTransforms.map(c => c.id)
        });
    }

    // Rule 13: Flag missing Adaptive Query Execution (AQE) utilization
    clusters.forEach(cluster => {
        const sparkConfig = cluster.properties?.sparkConfig as Record<string, string> | undefined;
        const runtimeVersion = cluster.properties?.runtimeVersion as string;
        if (runtimeVersion && runtimeVersion.includes('13.') && (!sparkConfig || sparkConfig['spark.sql.adaptive.enabled'] !== 'true')) {
            results.push({
                connectionId: cluster.id,
                isValid: true,
                severity: 'warning',
                message: 'Enable Adaptive Query Execution (AQE) for Spark 3.0+ to improve query performance. Set spark.sql.adaptive.enabled=true.',
                affectedComponents: [cluster.id]
            });
        }
    });

    // Rule 14: Warn about missing file compaction for Delta tables
    deltaSinks.forEach(sink => {
        if (!sink.properties?.autoOptimize && !sink.properties?.autoCompact) {
            results.push({
                connectionId: sink.id,
                isValid: true,
                severity: 'warning',
                message: 'Enable Auto Optimize for Delta tables to automatically compact small files (< 128MB) and improve query performance.',
                affectedComponents: [sink.id]
            });
        }
    });

    // Rule 15: Flag inefficient window functions
    const notebooksWithWindow = components.filter(c =>
        c.type === 'notebook' &&
        c.properties?.code &&
        typeof c.properties.code === 'string' &&
        (c.properties.code.includes('window') || c.properties.code.includes('over('))
    );
    if (notebooksWithWindow.length > 0) {
        results.push({
            connectionId: 'perf-window',
            isValid: true,
            severity: 'info',
            message: 'Ensure window functions use proper partitioning. Consider RANGE BETWEEN instead of ROWS BETWEEN where applicable.',
            affectedComponents: notebooksWithWindow.map(c => c.id)
        });
    }

    // Rule 16: Recommend Photon engine for SQL workloads
    const sqlWarehousesWithoutPhoton = sqlWarehouses.filter(w => !w.properties?.enablePhoton);
    if (sqlWarehousesWithoutPhoton.length > 0) {
        results.push({
            connectionId: 'perf-photon-sql',
            isValid: true,
            severity: 'warning',
            message: 'Enable Photon for SQL-heavy workloads. Requires runtime 11.3 LTS+. Provides 2-3x performance improvement.',
            affectedComponents: sqlWarehousesWithoutPhoton.map(c => c.id)
        });
    }

    // Rule 17: Warn about missing Delta table statistics
    deltaSinks.forEach(sink => {
        if (!sink.properties?.analyzeTable) {
            results.push({
                connectionId: sink.id,
                isValid: true,
                severity: 'info',
                message: 'Run ANALYZE TABLE to collect statistics for large Delta tables. This improves join optimization and query planning.',
                affectedComponents: [sink.id]
            });
        }
    });

    // Rule 18: Flag excessive shuffle operations
    const transformsWithMultipleShuffles = components.filter(c => {
        const code = c.properties?.code as string;
        if (!code) return false;
        const shuffleCount = (code.match(/groupBy|join|orderBy|distinct/gi) || []).length;
        return shuffleCount > 3;
    });
    if (transformsWithMultipleShuffles.length > 0) {
        results.push({
            connectionId: 'perf-shuffle',
            isValid: true,
            severity: 'warning',
            message: 'Multiple shuffle operations detected. Consider reducing joins and groupBy operations. Use bucketing for frequently joined tables.',
            affectedComponents: transformsWithMultipleShuffles.map(c => c.id)
        });
    }

    // Rule 19: Warn about suboptimal parallelism settings
    clusters.forEach(cluster => {
        const sparkConfig = cluster.properties?.sparkConfig as Record<string, string> | undefined;
        const shufflePartitions = sparkConfig?.['spark.sql.shuffle.partitions'];
        if (!shufflePartitions || shufflePartitions === '200') {
            results.push({
                connectionId: cluster.id,
                isValid: true,
                severity: 'info',
                message: 'Tune spark.sql.shuffle.partitions to match cluster cores (typically 2-3x core count). Default 200 may be suboptimal for large datasets.',
                affectedComponents: [cluster.id]
            });
        }
    });

    // Rule 20: Flag missing vacuum operations on Delta tables
    deltaSinks.forEach(sink => {
        if (!sink.properties?.vacuumSchedule) {
            results.push({
                connectionId: sink.id,
                isValid: true,
                severity: 'info',
                message: 'Schedule VACUUM operations for Delta tables to remove old versions (default 7-day retention). Reduces storage costs.',
                affectedComponents: [sink.id]
            });
        }
    });

    // Rule 21: Recommend connection pooling for JDBC sources
    const jdbcSources = components.filter(c =>
        c.category === 'AzureSQLDatabase' || c.category === 'SnowflakeConnector'
    );
    jdbcSources.forEach(source => {
        if (!source.properties?.numPartitions) {
            results.push({
                connectionId: source.id,
                isValid: true,
                severity: 'info',
                message: 'Configure numPartitions for JDBC sources to enable parallel reads. Select appropriate partition column for even distribution.',
                affectedComponents: [source.id]
            });
        }
    });

    // Rule 22: Flag missing bloom filters on Delta tables
    deltaSinks.forEach(sink => {
        if (!sink.properties?.bloomFilters) {
            results.push({
                connectionId: sink.id,
                isValid: true,
                severity: 'info',
                message: 'Consider adding bloom filters for high-cardinality lookup columns. Improves point lookup queries on large tables.',
                affectedComponents: [sink.id]
            });
        }
    });
}

function validateDataQualityRules(
    components: SSISComponent[],
    connections: Connection[],
    results: ValidationResult[]
): void {
    // Rule 1: Check for null handling in critical columns
    const transforms = components.filter(c => c.type === 'transformation');
    transforms.forEach(transform => {
        const code = transform.properties?.code as string;
        if (code && !code.includes('isNull') && !code.includes('isnull') && !code.includes('coalesce')) {
            results.push({
                connectionId: transform.id,
                isValid: true,
                severity: 'info',
                message: 'Consider handling NULL values in critical columns to ensure data quality.',
                affectedComponents: [transform.id]
            });
        }
    });

    // Rule 2: Validate schema enforcement on Delta tables
    const deltaSinks = components.filter(c => c.category === 'DeltaTableSink');
    deltaSinks.forEach(sink => {
        if (!sink.properties?.schemaEnforcement) {
            results.push({
                connectionId: sink.id,
                isValid: true,
                severity: 'warning',
                message: 'Enable schema enforcement on Delta tables to prevent data quality issues.',
                affectedComponents: [sink.id]
            });
        }
    });

    // Rule 3: Ensure data quality expectations in DLT
    const dltPipelines = components.filter(c => c.category === 'DeltaLiveTables');
    dltPipelines.forEach(dlt => {
        const expectations = Array.isArray(dlt.properties?.expectations) ? dlt.properties.expectations : undefined;
        if (!expectations || expectations.length === 0) {
            results.push({
                connectionId: dlt.id,
                isValid: true,
                severity: 'warning',
                message: 'Delta Live Tables pipelines should include data quality expectations.',
                affectedComponents: [dlt.id]
            });
        }
    });

    // Rule 4: Check for duplicate handling
    const transformsWithoutDedupe = components.filter(c =>
        c.type === 'transformation' &&
        c.category !== 'DataFrameTransform' &&
        !c.properties?.deduplication
    );
    if (transformsWithoutDedupe.length > 0) {
        results.push({
            connectionId: 'dq-duplicates',
            isValid: true,
            severity: 'info',
            message: 'Consider adding duplicate detection and handling logic in your pipeline.',
            affectedComponents: transformsWithoutDedupe.map(c => c.id)
        });
    }

    // Rule 5: Validate data type conversions
    const typeConversions = components.filter(c =>
        c.category === 'DataFrameTransform' &&
        c.properties?.operations &&
        Array.isArray(c.properties.operations) && c.properties.operations.includes('cast')
    );
    if (typeConversions.length > 0) {
        results.push({
            connectionId: 'dq-types',
            isValid: true,
            severity: 'info',
            message: 'Ensure data type conversions handle potential errors (e.g., invalid dates, overflow).',
            affectedComponents: typeConversions.map(c => c.id)
        });
    }

    // Rule 6: Ensure timestamp handling (timezone)
    const timestampComponents = components.filter(c => {
        const code = c.properties?.code as string;
        return code && (code.includes('timestamp') || code.includes('datetime'));
    });
    if (timestampComponents.length > 0) {
        results.push({
            connectionId: 'dq-timestamp',
            isValid: true,
            severity: 'info',
            message: 'Ensure proper timezone handling for timestamp columns to avoid data quality issues.',
            affectedComponents: timestampComponents.map(c => c.id)
        });
    }

    // Rule 7: Check for outlier detection
    results.push({
        connectionId: 'dq-outliers',
        isValid: true,
        severity: 'info',
        message: 'Consider adding outlier detection logic for numerical columns.',
        affectedComponents: []
    });

    // Rule 8: Validate referential integrity
    const joins = components.filter(c =>
        c.category === 'DataFrameTransform' &&
        c.properties?.joinType
    );
    if (joins.length > 0) {
        results.push({
            connectionId: 'dq-referential',
            isValid: true,
            severity: 'info',
            message: 'Consider validating referential integrity in join operations.',
            affectedComponents: joins.map(c => c.id)
        });
    }

    // Rule 9: Validate Delta Lake constraints (CHECK, NOT NULL)
    deltaSinks.forEach(sink => {
        const constraints = Array.isArray(sink.properties?.constraints) ? sink.properties.constraints : undefined;
        if (!constraints || constraints.length === 0) {
            results.push({
                connectionId: sink.id,
                isValid: true,
                severity: 'info',
                message: 'Consider adding NOT NULL constraints on critical columns and CHECK constraints for business rules.',
                affectedComponents: [sink.id]
            });
        }
    });

    // Rule 10: Check for proper data masking and PII handling
    const componentsWithPII = components.filter(c => {
        const props = c.properties || {};
        const propsStr = JSON.stringify(props).toLowerCase();
        return propsStr.includes('email') || propsStr.includes('ssn') || propsStr.includes('phone') || propsStr.includes('credit');
    });
    if (componentsWithPII.length > 0) {
        results.push({
            connectionId: 'dq-pii',
            isValid: true,
            severity: 'warning',
            message: 'PII data detected. Consider using dynamic data masking in Unity Catalog and ensure GDPR/CCPA compliance.',
            affectedComponents: componentsWithPII.map(c => c.id)
        });
    }

    // Rule 11: Validate Change Data Feed (CDF) for audit trails
    deltaSinks.forEach(sink => {
        if (!sink.properties?.changeDataFeed) {
            results.push({
                connectionId: sink.id,
                isValid: true,
                severity: 'info',
                message: 'Enable Change Data Feed (CDF) for critical tables to track changes for audit trails and CDC patterns.',
                affectedComponents: [sink.id]
            });
        }
    });

    // Rule 12: Check for orphaned files in Delta tables
    deltaSinks.forEach(sink => {
        if (!sink.properties?.fsckRepair) {
            results.push({
                connectionId: sink.id,
                isValid: true,
                severity: 'info',
                message: 'Periodically run FSCK REPAIR TABLE to detect and fix orphaned files in Delta tables. Reduces storage costs.',
                affectedComponents: [sink.id]
            });
        }
    });

    // Rule 13: Ensure proper handling of nested JSON/struct data
    const componentsWithNested = components.filter(c => {
        const code = c.properties?.code as string;
        return code && (code.includes('struct') || code.includes('nested') || code.includes('json'));
    });
    if (componentsWithNested.length > 0) {
        results.push({
            connectionId: 'dq-nested',
            isValid: true,
            severity: 'info',
            message: 'Ensure proper schema definition for nested JSON/struct data. Consider flattening strategies for better query performance.',
            affectedComponents: componentsWithNested.map(c => c.id)
        });
    }

    // Rule 14: Check for data profiling before ingestion
    const sourcesWithoutProfiling = components.filter(c =>
        c.type === 'dataSource' &&
        !c.properties?.dataProfiling
    );
    if (sourcesWithoutProfiling.length > 0) {
        results.push({
            connectionId: 'dq-profiling',
            isValid: true,
            severity: 'info',
            message: 'Consider running data profiling before ingestion to identify outliers, distributions, and data quality issues.',
            affectedComponents: sourcesWithoutProfiling.map(c => c.id)
        });
    }

    // Rule 15: Validate partition evolution handling
    deltaSinks.forEach(sink => {
        if (!sink.properties?.partitionEvolution) {
            results.push({
                connectionId: sink.id,
                isValid: true,
                severity: 'info',
                message: 'Ensure queries handle partition evolution if partition columns may change over time. Maintain backward compatibility.',
                affectedComponents: [sink.id]
            });
        }
    });

    // Rule 16: Check for proper transaction isolation in Delta Lake
    const mergeOperations = components.filter(c => c.category === 'DeltaLakeMerge');
    mergeOperations.forEach(merge => {
        if (!merge.properties?.isolationLevel) {
            results.push({
                connectionId: merge.id,
                isValid: true,
                severity: 'info',
                message: 'Configure appropriate transaction isolation level for concurrent writes. Use optimistic concurrency for most cases.',
                affectedComponents: [merge.id]
            });
        }
    });

    // Rule 17: Ensure data freshness monitoring
    const sinksWithoutFreshness = deltaSinks.filter(s => !s.properties?.freshnessMonitoring);
    if (sinksWithoutFreshness.length > 0) {
        results.push({
            connectionId: 'dq-freshness',
            isValid: true,
            severity: 'info',
            message: 'Implement data freshness monitoring to track data latency and ensure SLAs are met. Set up alerts for stale data.',
            affectedComponents: sinksWithoutFreshness.map(c => c.id)
        });
    }

    // Rule 18: Validate idempotency for data pipelines
    const pipelinesWithoutIdempotency = components.filter(c =>
        (c.category === 'DeltaLakeMerge' || c.category === 'DeltaTableSink') &&
        !c.properties?.idempotent
    );
    if (pipelinesWithoutIdempotency.length > 0) {
        results.push({
            connectionId: 'dq-idempotency',
            isValid: true,
            severity: 'warning',
            message: 'Ensure pipelines are idempotent (can be safely re-run). Use MERGE operations with proper keys and configure streaming checkpoints.',
            affectedComponents: pipelinesWithoutIdempotency.map(c => c.id)
        });
    }
}

function validateBestPracticesRules(
    components: SSISComponent[],
    connections: Connection[],
    results: ValidationResult[]
): void {
    // Get commonly used component types
    const clusters = components.filter(c => c.type === 'cluster');
    const deltaSinks = components.filter(c => c.category === 'DeltaTableSink');
    const jobs = components.filter(c => c.type === 'orchestration');
    const sqlWarehouses = components.filter(c => c.category === 'SQLWarehouse');

    // Rule 1: Use Delta Lake for all production tables
    const nonDeltaSinks = components.filter(c =>
        c.type === 'output' &&
        c.category !== 'DeltaTableSink' &&
        c.category !== 'MLflowModelRegistry'
    );
    if (nonDeltaSinks.length > 0) {
        results.push({
            connectionId: 'bp-delta',
            isValid: true,
            severity: 'info',
            message: 'Consider using Delta Lake for production tables to get ACID transactions and time travel.',
            affectedComponents: nonDeltaSinks.map(c => c.id)
        });
    }

    // Rule 2: Implement checkpointing for streaming
    const streamingComponents = components.filter(c =>
        c.category === 'KafkaStream' ||
        c.category === 'AutoLoader' ||
        (c.properties?.streaming === true)
    );
    streamingComponents.forEach(comp => {
        if (!comp.properties?.checkpointLocation) {
            results.push({
                connectionId: comp.id,
                isValid: false,
                severity: 'error',
                message: 'Streaming components must specify checkpoint location for fault tolerance.',
                affectedComponents: [comp.id]
            });
        }
    });

    // Rule 3: Use job clusters for production (not all-purpose)
    const allPurposeClusters = components.filter(c =>
        c.category === 'AllPurposeCluster'
    );
    if (allPurposeClusters.length > 0) {
        results.push({
            connectionId: 'bp-cluster-type',
            isValid: true,
            severity: 'warning',
            message: 'Use Job Clusters for production workloads instead of All-Purpose clusters for better cost control.',
            affectedComponents: allPurposeClusters.map(c => c.id)
        });
    }

    // Rule 4: Enable Auto Optimize and Auto Compaction
    deltaSinks.forEach(sink => {
        if (!sink.properties?.autoOptimize) {
            results.push({
                connectionId: sink.id,
                isValid: true,
                severity: 'info',
                message: 'Enable Auto Optimize and Auto Compaction for Delta tables to maintain performance.',
                affectedComponents: [sink.id]
            });
        }
    });

    // Rule 5: Use Unity Catalog for governance
    const nonUnityCatalogTables = components.filter(c =>
        (c.category === 'DeltaTableSource' || c.category === 'DeltaTableSink') &&
        c.properties?.catalog === 'main'
    );
    if (nonUnityCatalogTables.length > 0) {
        results.push({
            connectionId: 'bp-unity-catalog',
            isValid: true,
            severity: 'info',
            message: 'Consider using Unity Catalog (non-main catalog) for better governance and access control.',
            affectedComponents: nonUnityCatalogTables.map(c => c.id)
        });
    }

    // Rule 6: Implement proper error handling and retries
    jobs.forEach(job => {
        if (!job.properties?.retries || (job.properties.retries as number) === 0) {
            results.push({
                connectionId: job.id,
                isValid: true,
                severity: 'warning',
                message: 'Configure retry logic for job tasks to handle transient failures.',
                affectedComponents: [job.id]
            });
        }
    });

    // Rule 7: Use Delta Live Tables for complex pipelines
    const complexPipelines = components.filter(c =>
        c.type === 'transformation' &&
        connections.filter(conn => conn.target === c.id || conn.source === c.id).length > 3
    );
    if (complexPipelines.length > 0) {
        results.push({
            connectionId: 'bp-dlt',
            isValid: true,
            severity: 'info',
            message: 'Consider using Delta Live Tables for complex multi-hop pipelines with built-in data quality.',
            affectedComponents: complexPipelines.map(c => c.id)
        });
    }

    // Rule 8: Version control notebooks with Repos
    const notebookComponents = components.filter(c => c.type === 'notebook');
    if (notebookComponents.length > 0) {
        results.push({
            connectionId: 'bp-repos',
            isValid: true,
            severity: 'info',
            message: 'Use Databricks Repos for version control and CI/CD integration.',
            affectedComponents: notebookComponents.map(c => c.id)
        });
    }

    // Rule 9: Monitor with query profiling
    results.push({
        connectionId: 'bp-monitoring',
        isValid: true,
        severity: 'info',
        message: 'Enable query profiling and monitoring to track performance and costs.',
        affectedComponents: []
    });

    // Rule 10: Use secrets for credentials
    const componentsWithCredentials = components.filter(c => {
        const props = c.properties || {};
        return props.password || props.connectionString || props.apiKey;
    });
    if (componentsWithCredentials.length > 0) {
        results.push({
            connectionId: 'bp-secrets',
            isValid: false,
            severity: 'error',
            message: 'Never hardcode credentials. Use Databricks Secrets for sensitive information.',
            affectedComponents: componentsWithCredentials.map(c => c.id)
        });
    }

    // Rule 11: Use Databricks Asset Bundles (DABs) for deployment
    const jobsWithoutDAB = components.filter(c =>
        c.type === 'orchestration' &&
        !c.properties?.assetBundle
    );
    if (jobsWithoutDAB.length > 0) {
        results.push({
            connectionId: 'bp-dabs',
            isValid: true,
            severity: 'info',
            message: 'Consider using Databricks Asset Bundles (DABs) for infrastructure-as-code and CI/CD workflows.',
            affectedComponents: jobsWithoutDAB.map(c => c.id)
        });
    }

    // Rule 12: Implement proper cost allocation with tags
    clusters.forEach(cluster => {
        const tags = cluster.properties?.tags as Record<string, string> | undefined;
        if (!tags || Object.keys(tags).length === 0) {
            results.push({
                connectionId: cluster.id,
                isValid: true,
                severity: 'info',
                message: 'Add cost center tags to clusters for showback/chargeback reporting. Tag by project/team/environment.',
                affectedComponents: [cluster.id]
            });
        }
    });

    // Rule 13: Use Unity Catalog external locations for separation
    const deltaComponentsWithoutExternalLocation = components.filter(c =>
        (c.category === 'DeltaTableSource' || c.category === 'DeltaTableSink') &&
        c.properties?.catalog === 'main'
    );
    if (deltaComponentsWithoutExternalLocation.length > 0) {
        results.push({
            connectionId: 'bp-external-locations',
            isValid: true,
            severity: 'info',
            message: 'Use Unity Catalog external locations to separate bronze/silver/gold layers in different storage accounts with proper access controls.',
            affectedComponents: deltaComponentsWithoutExternalLocation.map(c => c.id)
        });
    }

    // Rule 14: Implement proper incident response procedures
    jobs.forEach(job => {
        if (!job.properties?.runbook || !job.properties?.alerting) {
            results.push({
                connectionId: job.id,
                isValid: true,
                severity: 'info',
                message: 'Ensure runbooks exist for common failures and alerting is configured for critical jobs with proper escalation paths.',
                affectedComponents: [job.id]
            });
        }
    });

    // Rule 15: Use workspace-level libraries for consistency
    clusters.forEach(cluster => {
        const libraries = Array.isArray(cluster.properties?.libraries) ? cluster.properties.libraries : undefined;
        if (libraries && libraries.length > 0 && !cluster.properties?.workspaceLibraries) {
            results.push({
                connectionId: cluster.id,
                isValid: true,
                severity: 'info',
                message: 'Consider using workspace-level libraries instead of cluster-scoped libraries for consistency and easier dependency management.',
                affectedComponents: [cluster.id]
            });
        }
    });

    // Rule 16: Implement proper data retention policies
    deltaSinks.forEach(sink => {
        if (!sink.properties?.retentionPolicy) {
            results.push({
                connectionId: sink.id,
                isValid: true,
                severity: 'info',
                message: 'Define data retention policies aligned with regulatory requirements (GDPR, HIPAA). Configure Time Travel retention and automated archival.',
                affectedComponents: [sink.id]
            });
        }
    });

    // Rule 17: Use serverless for unpredictable workloads
    const sqlWarehousesClassic = sqlWarehouses.filter(w => !w.properties?.serverless);
    if (sqlWarehousesClassic.length > 0) {
        results.push({
            connectionId: 'bp-serverless',
            isValid: true,
            severity: 'info',
            message: 'Consider serverless SQL warehouses for BI workloads and sporadic batch jobs. Provides better cost-effectiveness for unpredictable workloads.',
            affectedComponents: sqlWarehousesClassic.map(c => c.id)
        });
    }

    // Rule 18: Implement proper disaster recovery (DR) strategy
    const notebookComponentsForDR = components.filter(c => c.type === 'notebook');
    if (notebookComponentsForDR.length > 0 && !components.some(c => c.properties?.drStrategy)) {
        results.push({
            connectionId: 'bp-dr',
            isValid: true,
            severity: 'info',
            message: 'Implement disaster recovery strategy: backup critical notebooks, configure cross-region replication for Delta tables, and test recovery procedures.',
            affectedComponents: notebookComponentsForDR.map(c => c.id)
        });
    }

    // Rule 19: Use table access control (Table ACLs) with Unity Catalog
    const tablesWithoutACL = components.filter(c =>
        (c.category === 'DeltaTableSource' || c.category === 'DeltaTableSink') &&
        c.properties?.catalog === 'main'
    );
    if (tablesWithoutACL.length > 0) {
        results.push({
            connectionId: 'bp-table-acl',
            isValid: true,
            severity: 'info',
            message: 'Use Unity Catalog table access control for row-level and column-level security. Create dynamic views for data filtering.',
            affectedComponents: tablesWithoutACL.map(c => c.id)
        });
    }

    // Rule 20: Implement observability with Databricks System Tables
    if (components.length > 0) {
        results.push({
            connectionId: 'bp-observability',
            isValid: true,
            severity: 'info',
            message: 'Use Databricks System Tables for observability: system.access.audit for audit logs, system.query.history for performance, and billing usage tables for costs.',
            affectedComponents: []
        });
    }
}

