'use client';

import React, { useState, useMemo } from 'react';
import { Book, Search, ExternalLink, Code, Database, Workflow, Brain, Server } from 'lucide-react';

interface HelpSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    content: string;
    links?: Array<{ title: string; url: string }>;
}

const HELP_SECTIONS: HelpSection[] = [
    {
        id: 'what-is-databricks',
        title: 'What is Azure Databricks?',
        icon: <Database className="w-5 h-5" />,
        content: `Azure Databricks is a unified analytics platform built on Apache Spark. It provides:
- Collaborative notebooks for data engineering and data science
- Delta Lake for ACID transactions and time travel
- MLflow for machine learning lifecycle management
- Unity Catalog for data governance
- Serverless compute for SQL analytics

Databricks enables teams to build, deploy, and manage data pipelines and ML models at scale.`,
        links: [
            { title: 'Official Documentation', url: 'https://docs.databricks.com/' },
            { title: 'Azure Databricks Overview', url: 'https://azure.microsoft.com/en-us/products/databricks' }
        ]
    },
    {
        id: 'getting-started',
        title: 'Getting Started',
        icon: <Book className="w-5 h-5" />,
        content: `1. Create a Databricks workspace in Azure Portal
2. Launch the workspace and create your first cluster
3. Create a notebook and write your first PySpark code
4. Use Delta Lake for data storage with ACID guarantees
5. Deploy jobs for scheduled execution

Start with the "Your First Databricks Notebook" tutorial in this simulator.`,
        links: [
            { title: 'Quickstart Guide', url: 'https://docs.databricks.com/getting-started/index.html' }
        ]
    },
    {
        id: 'components',
        title: 'Component Reference',
        icon: <Code className="w-5 h-5" />,
        content: `Notebooks: Python, Scala, SQL, R, and Markdown notebooks for code execution
Data Sources: Delta tables, Azure Blob Storage, ADLS Gen2, SQL databases, Kafka streams
Transformations: DataFrame operations, Delta Lake merge, Spark SQL, MLflow, Feature Store
Outputs: Delta tables, cloud storage, SQL databases, Power BI, MLflow Model Registry
Orchestration: Jobs, notebook tasks, JAR tasks, Python wheel tasks, Delta Live Tables
Clusters: All-purpose clusters, job clusters, SQL warehouses`,
        links: [
            { title: 'Component Documentation', url: 'https://docs.databricks.com/data/index.html' }
        ]
    },
    {
        id: 'pyspark-syntax',
        title: 'PySpark Syntax Cheat Sheet',
        icon: <Code className="w-5 h-5" />,
        content: `# Read from Delta table
df = spark.read.table("catalog.schema.table")

# Filter data
df_filtered = df.filter(col("amount") > 100)

# Select columns
df_selected = df.select("id", "name", "amount")

# Group by and aggregate
df_agg = df.groupBy("category").agg(sum("amount").alias("total"))

# Join tables
df_joined = df1.join(df2, "id", "inner")

# Write to Delta table
df.write.format("delta").mode("overwrite").saveAsTable("catalog.schema.table")

# Delta Lake MERGE
from delta.tables import DeltaTable
target = DeltaTable.forName(spark, "target_table")
target.alias("target").merge(
    source.alias("source"),
    "target.id = source.id"
).whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()`,
        links: [
            { title: 'PySpark API Reference', url: 'https://spark.apache.org/docs/latest/api/python/' }
        ]
    },
    {
        id: 'delta-lake',
        title: 'Delta Lake Concepts',
        icon: <Database className="w-5 h-5" />,
        content: `Delta Lake provides:
- ACID Transactions: Ensures data consistency
- Time Travel: Query historical versions of data
- Schema Evolution: Add columns without breaking existing queries
- Upserts: MERGE operations for incremental updates
- Z-Ordering: Optimize query performance on filtered columns
- Auto Optimize: Automatic file compaction

Best Practices:
- Use Delta Lake for all production tables
- Enable schema enforcement
- Partition on frequently filtered columns
- Use Z-ordering for point lookups
- Run OPTIMIZE regularly for small files`,
        links: [
            { title: 'Delta Lake Guide', url: 'https://docs.delta.io/latest/index.html' }
        ]
    },
    {
        id: 'mlflow',
        title: 'MLflow Workflow',
        icon: <Brain className="w-5 h-5" />,
        content: `MLflow provides:
1. Tracking: Log experiments, parameters, and metrics
2. Projects: Package code for reproducible runs
3. Models: Model format and registry
4. Model Registry: Centralized model management

Workflow:
1. Start experiment: mlflow.start_run()
2. Log parameters: mlflow.log_param("key", value)
3. Log metrics: mlflow.log_metric("accuracy", 0.95)
4. Log model: mlflow.sklearn.log_model(model, "model")
5. Register model: mlflow.register_model("runs:/run_id/model", "model_name")
6. Deploy: Load from registry and serve`,
        links: [
            { title: 'MLflow Documentation', url: 'https://mlflow.org/docs/latest/index.html' }
        ]
    },
    {
        id: 'unity-catalog',
        title: 'Unity Catalog Governance',
        icon: <Database className="w-5 h-5" />,
        content: `Unity Catalog provides:
- 3-Level Namespace: catalog.schema.table
- Centralized Access Control: Row-level and column-level security
- Data Lineage: Track data flow and dependencies
- Audit Logging: Track all data access
- External Locations: Manage cloud storage access

Best Practices:
- Use non-main catalogs for production
- Separate bronze/silver/gold layers
- Implement row-level security for sensitive data
- Enable audit logging for compliance
- Use external locations for storage separation`,
        links: [
            { title: 'Unity Catalog Guide', url: 'https://docs.databricks.com/data-governance/unity-catalog/index.html' }
        ]
    },
    {
        id: 'performance-tuning',
        title: 'Performance Tuning Best Practices',
        icon: <Server className="w-5 h-5" />,
        content: `Optimization Strategies:
1. Enable Adaptive Query Execution (AQE) for Spark 3.0+
2. Use broadcast joins for small tables (< 2GB)
3. Partition Delta tables on filtered columns
4. Z-order on frequently filtered columns
5. Cache DataFrames reused multiple times
6. Enable Photon for SQL workloads (2-3x improvement)
7. Tune shuffle partitions: spark.sql.shuffle.partitions
8. Use Auto Optimize for Delta tables
9. Run OPTIMIZE regularly for small files
10. Monitor for data skew and use salting if needed

Performance Analyzer in this simulator will identify optimization opportunities.`,
        links: [
            { title: 'Performance Tuning Guide', url: 'https://docs.databricks.com/optimizations/index.html' }
        ]
    },
    {
        id: 'cost-optimization',
        title: 'Cost Optimization',
        icon: <Server className="w-5 h-5" />,
        content: `Cost Reduction Strategies:
1. Use Job Clusters instead of All-Purpose for production
2. Enable autoscaling for variable workloads
3. Set auto-termination for idle clusters
4. Use instance pools for faster startup
5. Enable Photon for SQL workloads (reduces compute time)
6. Use serverless SQL warehouses for BI workloads
7. Schedule jobs during off-peak hours
8. Monitor with cost allocation tags
9. Use Delta Lake to reduce storage costs (better compression)
10. Run VACUUM to remove old file versions

Cost Calculator in this simulator estimates DBU costs.`,
        links: [
            { title: 'Cost Optimization', url: 'https://docs.databricks.com/administration-guide/account-settings/usage-detail.html' }
        ]
    },
    {
        id: 'delta-live-tables',
        title: 'Delta Live Tables (DLT)',
        icon: <Workflow className="w-5 h-5" />,
        content: `Delta Live Tables provides:
- Declarative Pipeline Definition: Define what, not how
- Automatic Data Quality: Built-in expectations
- Incremental Processing: Only process new/changed data
- Lineage Tracking: Automatic dependency graph
- Materialized Views: Pre-computed aggregations

Best Practices:
- Use expectations for data quality (expect, expect_or_drop, expect_or_fail)
- Define incremental tables with @dlt.table
- Use @dlt.view for transformations
- Enable change data feed for CDC patterns
- Monitor data quality metrics`,
        links: [
            { title: 'DLT Documentation', url: 'https://docs.databricks.com/data-engineering/delta-live-tables/index.html' }
        ]
    }
];

export default function DatabricksHelp() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSection, setSelectedSection] = useState<string | null>(null);

    const filteredSections = useMemo(() => {
        if (!searchTerm) return HELP_SECTIONS;
        const term = searchTerm.toLowerCase();
        return HELP_SECTIONS.filter(section =>
            section.title.toLowerCase().includes(term) ||
            section.content.toLowerCase().includes(term)
        );
    }, [searchTerm]);

    const selectedContent = useMemo(() => {
        if (!selectedSection) return null;
        return HELP_SECTIONS.find(s => s.id === selectedSection);
    }, [selectedSection]);

    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center space-x-2 mb-4">
                <Book className="w-6 h-6 text-orange-600" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Databricks Help & Documentation</h3>
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search help topics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
            </div>

            <div className="flex space-x-4 h-[600px]">
                <div className="w-1/3 border border-gray-200 dark:border-gray-700 rounded overflow-y-auto">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Topics</div>
                    </div>
                    {filteredSections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setSelectedSection(section.id)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border-b border-gray-200 dark:border-gray-700 ${
                                selectedSection === section.id
                                    ? 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-600'
                                    : ''
                            }`}
                        >
                            <div className="flex items-center space-x-2">
                                {section.icon}
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {section.title}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="w-2/3 border border-gray-200 dark:border-gray-700 rounded overflow-y-auto p-6">
                    {selectedContent ? (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 mb-4">
                                {selectedContent.icon}
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {selectedContent.title}
                                </h4>
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-4 rounded border border-gray-200 dark:border-gray-700 font-sans">
                                    {selectedContent.content}
                                </pre>
                            </div>
                            {selectedContent.links && selectedContent.links.length > 0 && (
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Learn More
                                    </h5>
                                    <div className="space-y-2">
                                        {selectedContent.links.map((link, idx) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center space-x-2 text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                <span>{link.title}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                            <Book className="w-12 h-12 mb-4 opacity-20" />
                            <p>Select a topic to view documentation</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

