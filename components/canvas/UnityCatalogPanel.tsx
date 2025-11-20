'use client';

import React, { useState, useMemo } from 'react';
import { SSISComponent } from '@/lib/types';
import { Database, Shield, Eye, Search } from 'lucide-react';

interface UnityCatalogPanelProps {
    components: SSISComponent[];
}

interface CatalogItem {
    catalog: string;
    schemas: SchemaItem[];
}

interface SchemaItem {
    schema: string;
    tables: TableItem[];
}

interface TableItem {
    name: string;
    type: string;
    location?: string;
    columns: number;
    rows?: number;
    lastModified?: string;
}

export default function UnityCatalogPanel({ components }: UnityCatalogPanelProps) {
    const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null);
    const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');

    const catalogStructure = useMemo(() => {
        const catalogs: Record<string, Record<string, TableItem[]>> = {};

        components.forEach((comp, index) => {
            const props = comp.properties || {};
            const catalog = props.catalog as string || 'main';
            const schema = props.schema as string || 'default';
            const table = props.table as string || '';

            if (table) {
                if (!catalogs[catalog]) {
                    catalogs[catalog] = {};
                }
                if (!catalogs[catalog][schema]) {
                    catalogs[catalog][schema] = [];
                }

                const tableType = comp.category === 'DeltaTableSource' ? 'Source' :
                                 comp.category === 'DeltaTableSink' ? 'Sink' : 'Table';

                // Use deterministic values based on component index instead of Math.random()
                const columnCount = 5 + (index % 20);
                const rowCount = 10000 + (index % 1000000);

                catalogs[catalog][schema].push({
                    name: table,
                    type: tableType,
                    location: `abfss://container@storage.dfs.core.windows.net/${catalog}/${schema}/${table}`,
                    columns: columnCount,
                    rows: rowCount,
                    lastModified: new Date().toISOString()
                });
            }
        });

        const result: CatalogItem[] = Object.entries(catalogs).map(([catalogName, schemas]) => ({
            catalog: catalogName,
            schemas: Object.entries(schemas).map(([schemaName, tables]) => ({
                schema: schemaName,
                tables: tables.filter(table => 
                    searchTerm === '' || 
                    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    catalogName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    schemaName.toLowerCase().includes(searchTerm.toLowerCase())
                )
            })).filter(s => s.tables.length > 0)
        })).filter(c => c.schemas.length > 0);

        if (result.length === 0) {
            result.push({
                catalog: 'main',
                schemas: [
                    {
                        schema: 'default',
                        tables: []
                    }
                ]
            });
        }

        return result;
    }, [components, searchTerm]);

    const selectedTable = useMemo(() => {
        if (!selectedCatalog || !selectedSchema) return null;
        const catalog = catalogStructure.find(c => c.catalog === selectedCatalog);
        if (!catalog) return null;
        const schema = catalog.schemas.find(s => s.schema === selectedSchema);
        if (!schema) return null;
        return schema.tables[0] || null;
    }, [selectedCatalog, selectedSchema, catalogStructure]);

    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center space-x-2 mb-4">
                <Database className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Unity Catalog</h3>
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search catalogs, schemas, tables..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
            </div>

            <div className="flex space-x-4 h-[500px]">
                <div className="w-1/3 border border-gray-200 dark:border-gray-700 rounded overflow-y-auto">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">Catalogs</div>
                    </div>
                    {catalogStructure.map(catalog => (
                        <div key={catalog.catalog}>
                            <button
                                onClick={() => {
                                    setSelectedCatalog(catalog.catalog);
                                    setSelectedSchema(catalog.schemas[0]?.schema || null);
                                }}
                                className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                                    selectedCatalog === catalog.catalog
                                        ? 'bg-teal-50 dark:bg-teal-900/20 border-l-2 border-teal-600'
                                        : ''
                                }`}
                            >
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {catalog.catalog}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {catalog.schemas.length} schema(s)
                                </div>
                            </button>
                            {selectedCatalog === catalog.catalog && (
                                <div className="pl-4">
                                    {catalog.schemas.map(schema => (
                                        <button
                                            key={schema.schema}
                                            onClick={() => setSelectedSchema(schema.schema)}
                                            className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                                                selectedSchema === schema.schema
                                                    ? 'bg-teal-50 dark:bg-teal-900/20 border-l-2 border-teal-600'
                                                    : ''
                                            }`}
                                        >
                                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                {schema.schema}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {schema.tables.length} table(s)
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="w-2/3 border border-gray-200 dark:border-gray-700 rounded overflow-y-auto">
                    {selectedSchema ? (
                        <div className="p-4">
                            <div className="mb-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Namespace</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    {selectedCatalog}.{selectedSchema}
                                </div>
                            </div>

                            <div className="space-y-2">
                                {catalogStructure
                                    .find(c => c.catalog === selectedCatalog)
                                    ?.schemas.find(s => s.schema === selectedSchema)
                                    ?.tables.map((table, idx) => (
                                        <div
                                            key={idx}
                                            className="border border-gray-200 dark:border-gray-700 rounded p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <Database className="w-4 h-4 text-teal-600" />
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {table.name}
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">
                                                        {table.type}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                                                <div>
                                                    <span className="font-semibold">Columns:</span> {table.columns}
                                                </div>
                                                {table.rows && (
                                                    <div>
                                                        <span className="font-semibold">Rows:</span> {table.rows.toLocaleString()}
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="font-semibold">Format:</span> Delta
                                                </div>
                                            </div>
                                            {table.location && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono">
                                                    {table.location}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>

                            {selectedTable && (
                                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        Access Control
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center space-x-2">
                                            <Shield className="w-4 h-4 text-teal-600" />
                                            <span className="text-gray-700 dark:text-gray-300">
                                                Read: All users
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Shield className="w-4 h-4 text-teal-600" />
                                            <span className="text-gray-700 dark:text-gray-300">
                                                Write: Data Engineers group
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Eye className="w-4 h-4 text-teal-600" />
                                            <span className="text-gray-700 dark:text-gray-300">
                                                Lineage: Tracked
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                            <Database className="w-12 h-12 mb-4 opacity-20" />
                            <p>Select a catalog and schema to view tables</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

