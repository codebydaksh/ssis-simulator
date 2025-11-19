import { SSISComponent, ComponentType, DataType } from './types';

export interface ComponentDefinition {
    type: ComponentType;
    category: string;
    name: string;
    icon: string;
    description: string;
    useCases: string[];
    dataType: DataType;
    defaultProperties?: Record<string, any>;
}

export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
    // --- SOURCES ---
    {
        type: 'source',
        category: 'OLEDBSource',
        name: 'OLE DB Source',
        icon: '🗄️',
        description: 'Reads data from SQL Server, Oracle, or OLE DB compliant databases.',
        useCases: ['Reading from SQL tables', 'Executing SQL queries'],
        dataType: 'structured'
    },
    {
        type: 'source',
        category: 'FlatFileSource',
        name: 'Flat File Source',
        icon: '📄',
        description: 'Reads data from text files (CSV, TXT).',
        useCases: ['Reading CSV logs', 'Importing legacy text data'],
        dataType: 'text'
    },
    {
        type: 'source',
        category: 'ExcelSource',
        name: 'Excel Source',
        icon: '📗',
        description: 'Reads data from Excel workbooks.',
        useCases: ['Importing business reports', 'Reading spreadsheets'],
        dataType: 'mixed'
    },
    {
        type: 'source',
        category: 'JSONSource',
        name: 'JSON Source',
        icon: '{ }',
        description: 'Reads data from JSON files.',
        useCases: ['Importing API responses', 'Reading NoSQL exports'],
        dataType: 'nested'
    },
    {
        type: 'source',
        category: 'XMLSource',
        name: 'XML Source',
        icon: '🏷️',
        description: 'Reads data from XML documents.',
        useCases: ['Importing SOAP responses', 'Reading configuration files'],
        dataType: 'nested'
    },

    // --- TRANSFORMATIONS ---
    {
        type: 'transformation',
        category: 'DataConversion',
        name: 'Data Conversion',
        icon: '🔄',
        description: 'Converts data from one type to another.',
        useCases: ['Fixing type mismatches', 'Converting text to numbers'],
        dataType: 'structured'
    },
    {
        type: 'transformation',
        category: 'DerivedColumn',
        name: 'Derived Column',
        icon: '➕',
        description: 'Creates new column values using expressions.',
        useCases: ['Concatenating names', 'Calculating totals', 'Cleaning strings'],
        dataType: 'structured'
    },
    {
        type: 'transformation',
        category: 'Lookup',
        name: 'Lookup',
        icon: '🔍',
        description: 'Joins data with a reference table.',
        useCases: ['Getting IDs from names', 'Validating codes'],
        dataType: 'structured'
    },
    {
        type: 'transformation',
        category: 'ConditionalSplit',
        name: 'Conditional Split',
        icon: '🔀',
        description: 'Routes rows to different outputs based on conditions.',
        useCases: ['Separating bad data', 'Routing by region'],
        dataType: 'structured'
    },
    {
        type: 'transformation',
        category: 'Sort',
        name: 'Sort',
        icon: '⬆️',
        description: 'Sorts input data by one or more columns.',
        useCases: ['Preparing for Merge Join', 'Ordering for reports'],
        dataType: 'structured'
    },
    {
        type: 'transformation',
        category: 'Aggregate',
        name: 'Aggregate',
        icon: 'Σ',
        description: 'Aggregates values (Sum, Count, Avg) by group.',
        useCases: ['Daily totals', 'Counting records per category'],
        dataType: 'structured'
    },
    {
        type: 'transformation',
        category: 'MergeJoin',
        name: 'Merge Join',
        icon: '🔗',
        description: 'Merges two sorted datasets using FULL, LEFT, or INNER join.',
        useCases: ['Joining large sorted datasets', 'Combining historical data'],
        dataType: 'structured'
    },
    {
        type: 'transformation',
        category: 'UnionAll',
        name: 'Union All',
        icon: '⊕',
        description: 'Combines multiple inputs into a single output.',
        useCases: ['Merging monthly files', 'Combining similar datasets'],
        dataType: 'structured'
    },
    {
        type: 'transformation',
        category: 'Multicast',
        name: 'Multicast',
        icon: '📡',
        description: 'Distributes every input row to every output.',
        useCases: ['Sending data to multiple destinations', 'Logging while processing'],
        dataType: 'structured'
    },
    {
        type: 'transformation',
        category: 'RowCount',
        name: 'Row Count',
        icon: '🔢',
        description: 'Counts rows passing through and stores in a variable.',
        useCases: ['Auditing', 'Logging process stats'],
        dataType: 'structured'
    },

    // --- DESTINATIONS ---
    {
        type: 'destination',
        category: 'OLEDBDestination',
        name: 'OLE DB Destination',
        icon: '💾',
        description: 'Writes data to a SQL Server or OLE DB database.',
        useCases: ['Loading data warehouse', 'Updating records'],
        dataType: 'structured'
    },
    {
        type: 'destination',
        category: 'FlatFileDestination',
        name: 'Flat File Destination',
        icon: '📄',
        description: 'Writes data to a text file (CSV, TXT).',
        useCases: ['Generating reports', 'Exporting for other systems'],
        dataType: 'text'
    },
    {
        type: 'destination',
        category: 'ExcelDestination',
        name: 'Excel Destination',
        icon: '📗',
        description: 'Writes data to an Excel workbook.',
        useCases: ['Creating business reports', 'User-friendly exports'],
        dataType: 'mixed'
    },
    {
        type: 'destination',
        category: 'SQLServerDestination',
        name: 'SQL Server Dest',
        icon: '🗄️',
        description: 'Optimized bulk insert into SQL Server.',
        useCases: ['High-performance loading', 'Bulk inserts'],
        dataType: 'structured'
    },

    // --- CONTROL FLOW TASKS ---
    {
        type: 'control-flow-task',
        category: 'DataFlowTask',
        name: 'Data Flow Task',
        icon: '📊',
        description: 'Container for data flow transformations. Double-click to edit the data flow inside.',
        useCases: ['ETL operations', 'Data transformations', 'Loading data'],
        dataType: 'structured'
    },
    {
        type: 'control-flow-task',
        category: 'ExecuteSQLTask',
        name: 'Execute SQL Task',
        icon: '⚙️',
        description: 'Executes SQL statements or stored procedures.',
        useCases: ['Truncate tables before load', 'Run stored procedures', 'Execute DDL statements'],
        dataType: 'structured'
    },
    {
        type: 'control-flow-task',
        category: 'FileSystemTask',
        name: 'File System Task',
        icon: '📁',
        description: 'Performs file operations (copy, move, delete, rename).',
        useCases: ['Archive files', 'Move processed files', 'Clean up temp files'],
        dataType: 'structured'
    },
    {
        type: 'control-flow-task',
        category: 'ScriptTask',
        name: 'Script Task',
        icon: '📝',
        description: 'Runs custom .NET code for complex logic.',
        useCases: ['Custom validation', 'Complex calculations', 'API calls'],
        dataType: 'structured'
    },
    {
        type: 'control-flow-task',
        category: 'ForLoopContainer',
        name: 'For Loop Container',
        icon: '🔁',
        description: 'Repeats tasks a fixed number of times.',
        useCases: ['Process multiple files', 'Iterate through dates', 'Batch processing'],
        dataType: 'structured'
    },
    {
        type: 'control-flow-task',
        category: 'ForeachLoopContainer',
        name: 'Foreach Loop Container',
        icon: '🔄',
        description: 'Repeats tasks for each item in a collection.',
        useCases: ['Process all files in folder', 'Iterate through table rows', 'Dynamic file processing'],
        dataType: 'structured'
    },
    {
        type: 'control-flow-task',
        category: 'SequenceContainer',
        name: 'Sequence Container',
        icon: '📦',
        description: 'Groups tasks together for organization and transaction management.',
        useCases: ['Group related tasks', 'Transaction boundaries', 'Organizing package structure'],
        dataType: 'structured'
    }
];

export const getComponentDefinition = (category: string) =>
    COMPONENT_DEFINITIONS.find(c => c.category === category);
