import { SSISComponent, Connection } from './types';
import { TEMPLATES } from './templates';

export interface OptimizationSuggestion {
    id: string;
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'suggestion';
    category: 'Performance' | 'Best Practice' | 'Alternative Method' | 'Data Quality';
    recommendation: string;
    learnFrom?: string; // Template ID to reference
    estimatedImpact?: string; // "3x faster", "50% less memory"
    autoFix?: () => void;
}

export function analyzeAndSuggest(
    components: SSISComponent[],
    connections: Connection[]
): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Pattern 1: Detect "Conditional Split to Excel" pattern
    const conditionalSplits = components.filter(c => c.category === 'ConditionalSplit');
    const excelDests = components.filter(c => c.category === 'ExcelDestination');

    if (conditionalSplits.length > 0 && excelDests.length >= 2) {
        // Check if source has many rows (heuristic: if OLEDBSource before split)
        const splitInputs = conditionalSplits.flatMap(split =>
            connections.filter(c => c.target === split.id).map(c => c.source)
        );
        const hasOLEDBSource = splitInputs.some(sourceId =>
            components.find(c => c.id === sourceId && c.category === 'OLEDBSource')
        );

        if (hasOLEDBSource) {
            suggestions.push({
                id: 'suggest-separate-queries',
                title: 'Consider using separate SQL queries for better performance',
                description: 'You are using Conditional Split to route data to multiple Excel destinations. For large datasets, Method 2 (separate queries) is significantly faster.',
                severity: 'suggestion',
                category: 'Performance',
                recommendation: 'Replace Conditional Split with two separate OLE DB Sources using WHERE clauses. This allows SQL Server to do the filtering, reducing memory usage and improving performance.',
                learnFrom: 'sql-to-excel-method2',
                estimatedImpact: '2-3x faster for datasets > 100K rows'
            });
        }
    }

    // Pattern 2: Detect missing Sort before Merge Join
    const mergeJoins = components.filter(c => c.category === 'MergeJoin');
    mergeJoins.forEach(merge => {
        const inputs = connections.filter(c => c.target === merge.id);
        inputs.forEach(input => {
            const sourceComp = components.find(c => c.id === input.source);
            if (sourceComp && !sourceComp.isSorted && sourceComp.category !== 'Sort') {
                suggestions.push({
                    id: `suggest-sort-before-${merge.id}`,
                    title: 'Merge Join requires sorted inputs',
                    description: `Input from "${sourceComp.name}" to Merge Join is not sorted. This will cause a runtime error.`,
                    severity: 'warning',
                    category: 'Best Practice',
                    recommendation: 'Add a Sort transformation before the Merge Join, or ensure your source query includes ORDER BY.',
                    learnFrom: 'merge-join',
                    estimatedImpact: 'Required for Merge Join to work'
                });
            }
        });
    });

    // Pattern 3: CSV to Database without Data Conversion
    const csvSources = components.filter(c => c.category === 'FlatFileSource');

    csvSources.forEach(csv => {
        const connectedTo = connections.filter(c => c.source === csv.id);
        connectedTo.forEach(conn => {
            const target = components.find(c => c.id === conn.target);
            if (target?.category === 'OLEDBDestination') {
                // Check if there's a Data Conversion in between
                const hasDataConversion = components.some(c =>
                    c.category === 'DataConversion' &&
                    connections.some(c1 => c1.source === csv.id && c1.target === c.id) &&
                    connections.some(c2 => c2.source === c.id && c2.target === target.id)
                );

                if (!hasDataConversion) {
                    suggestions.push({
                        id: `suggest-dataconv-${csv.id}-${target.id}`,
                        title: 'Add Data Conversion between CSV and Database',
                        description: 'Flat File sources produce text data. Database destinations expect typed data. This mismatch will cause errors.',
                        severity: 'warning',
                        category: 'Best Practice',
                        recommendation: 'Insert a Data Conversion transformation to convert text columns to appropriate database types (e.g., DT_STR to DT_I4 for integers).',
                        learnFrom: 'basic-etl',
                        estimatedImpact: 'Prevents runtime type mismatch errors'
                    });
                }
            }
        });
    });

    // Pattern 4: Multicast with many outputs (performance concern)
    const multicasts = components.filter(c => c.category === 'Multicast');
    multicasts.forEach(multicast => {
        const outputs = connections.filter(c => c.source === multicast.id);
        if (outputs.length > 3) {
            suggestions.push({
                id: `suggest-reduce-multicast-${multicast.id}`,
                title: 'Multicast broadcasting to many destinations',
                description: `Multicast is sending data to ${outputs.length} destinations. This duplicates data in memory, which can be memory-intensive.`,
                severity: 'info',
                category: 'Performance',
                recommendation: 'Review if all outputs are necessary. Consider if some can be removed or if data can be processed serially instead of in parallel.',
                estimatedImpact: `Uses ${outputs.length}x memory`
            });
        }
    });

    // Pattern 5: Excel source to Database without conversion
    const excelSources = components.filter(c => c.category === 'ExcelSource');
    excelSources.forEach(excel => {
        const connectedTo = connections
            .filter(c => c.source === excel.id);
        connectedTo.forEach(conn => {
            const target = components.find(c => c.id === conn.target);
            if (target?.category === 'OLEDBDestination') {
                const hasDataConversion = components.some(c =>
                    c.category === 'DataConversion' &&
                    connections.some(c1 => c1.source === excel.id && c1.target === c.id) &&
                    connections.some(c2 => c2.source === c.id && c2.target === target.id)
                );

                if (!hasDataConversion) {
                    suggestions.push({
                        id: `suggest-dataconv-excel-${excel.id}-${target.id}`,
                        title: 'Excel to Database may need Data Conversion',
                        description: 'Excel sources can have mixed data types. Adding Data Conversion ensures type safety.',
                        severity: 'suggestion',
                        category: 'Data Quality',
                        recommendation: 'Add a Data Conversion transformation to explicitly define data types and handle potential type mismatches.',
                        learnFrom: 'basic-etl',
                        estimatedImpact: 'Improves reliability'
                    });
                }
            }
        });
    });

    // Pattern 6: No error handling
    const allSources = components.filter(c => c.type === 'source');
    const allDests = components.filter(c => c.type === 'destination');
    const errorLogDests = components.filter(c =>
        c.category === 'FlatFileDestination' &&
        (c.name.toLowerCase().includes('error') || c.name.toLowerCase().includes('log'))
    );

    if (allSources.length > 0 && allDests.length > 0 && errorLogDests.length === 0) {
        suggestions.push({
            id: 'suggest-error-handling',
            title: 'Consider adding error handling',
            description: 'Your pipeline has no error logging. In production, errors can occur (type mismatches, constraint violations, etc.).',
            severity: 'info',
            category: 'Best Practice',
            recommendation: 'Add a Conditional Split to separate valid and invalid records, and route errors to a Flat File destination for logging.',
            learnFrom: 'error-handling',
            estimatedImpact: 'Improves troubleshooting and reliability'
        });
    }

    // Pattern 7: Lookup without Row Count (auditing best practice)
    const lookups = components.filter(c => c.category === 'Lookup');
    const rowCounts = components.filter(c => c.category === 'RowCount');

    if (lookups.length > 0 && rowCounts.length === 0) {
        suggestions.push({
            id: 'suggest-row-count-audit',
            title: 'Add Row Count for auditing',
            description: 'Row Count transformations help track how many records were processed, which is essential for auditing and monitoring.',
            severity: 'info',
            category: 'Best Practice',
            recommendation: 'Add a Row Count transformation to store the count in a variable, which can be logged for audit purposes.',
            learnFrom: 'row-count',
            estimatedImpact: 'Enables better monitoring and troubleshooting'
        });
    }

    // Pattern 8: Suggest SCD Type 2 if updating dimension-like table
    const hasOLEDBDest = components.some(c => c.category === 'OLEDBDestination' &&
        (c.name.toLowerCase().includes('dimension') || c.name.toLowerCase().includes('dim'))
    );
    const hasLookupForSCD = components.some(c => c.category === 'Lookup' && c.referenceInput);

    if (hasOLEDBDest && !hasLookupForSCD) {
        suggestions.push({
            id: 'suggest-scd-type2',
            title: 'Loading dimension table? Consider SCD Type 2 pattern',
            description: 'If you need to track historical changes in dimension data, implement a Slowly Changing Dimension Type 2 pattern.',
            severity: 'info',
            category: 'Alternative Method',
            recommendation: 'Use Lookup to check existing records, Conditional Split to separate new vs changed records, and maintain start/end dates for historical tracking.',
            learnFrom: 'scd-type2',
            estimatedImpact: 'Enables historical data tracking'
        });
    }

    // Pattern 9: Union All without Sort (potential performance issue)
    const unions = components.filter(c => c.category === 'UnionAll');
    unions.forEach(union => {
        const inputs = connections.filter(c => c.target === union.id);
        if (inputs.length >= 3) {
            suggestions.push({
                id: `suggest-union-performance-${union.id}`,
                title: 'Union All with many inputs',
                description: `Union All is combining ${inputs.length} sources. Ensure all sources have matching schemas to avoid errors.`,
                severity: 'info',
                category: 'Data Quality',
                recommendation: 'Verify that all input sources have the same column names, data types, and order. Use Data Conversion if needed to standardize.',
                estimatedImpact: 'Prevents schema mismatch errors'
            });
        }
    });

    // Pattern 10: Aggregate without Sort (performance)
    const aggregates = components.filter(c => c.category === 'Aggregate');
    aggregates.forEach(agg => {
        const inputs = connections.filter(c => c.target === agg.id);
        const hasSortedInput = inputs.some(input => {
            const source = components.find(c => c.id === input.source);
            return source?.isSorted || source?.category === 'Sort';
        });

        if (!hasSortedInput) {
            suggestions.push({
                id: `suggest-sort-before-agg-${agg.id}`,
                title: 'Consider sorting before Aggregate',
                description: 'Aggregating sorted data can improve performance, especially for large datasets.',
                severity: 'info',
                category: 'Performance',
                recommendation: 'Add a Sort transformation before the Aggregate, sorted by your GROUP BY columns. This can improve aggregation performance.',
                estimatedImpact: 'Potential performance improvement for large datasets'
            });
        }
    });

    return suggestions;
}

// Helper function to get template name from ID
export function getTemplateReference(templateId: string): string {
    const template = TEMPLATES.find(t => t.id === templateId);
    return template ? `See template: "${template.name}"` : '';
}
