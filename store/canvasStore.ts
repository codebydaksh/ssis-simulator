import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { SSISComponent, Connection, ValidationResult, ViewMode, PlatformType } from '../lib/types';
import { validateGraph } from '../lib/validationEngine';
import { saveToLocalStorage, loadFromLocalStorage, exportToJSON, importFromJSON } from '../lib/persistence';
import { historyManager } from '../lib/historyManager';
import { decodePipelineFromURL } from '../lib/shareableLinks';
import { generateARMTemplate } from '../lib/adfExport';

interface CanvasState {
    // Platform
    platform: PlatformType;
    setPlatform: (platform: PlatformType) => void;

    // View mode
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;

    // Current context (for nested data flows)
    currentDataFlowTaskId: string | null; // If viewing nested data flow, this is the parent task ID
    setCurrentDataFlowTaskId: (id: string | null) => void;
    navigateToDataFlow: (taskId: string) => void;
    navigateToControlFlow: () => void;

    components: SSISComponent[];
    connections: Connection[];
    selectedComponent: string | null;
    errors: ValidationResult[];
    clipboard: SSISComponent | null;

    // Actions
    addComponent: (component: SSISComponent) => void;
    removeComponent: (id: string) => void;
    updateComponent: (id: string, updates: Partial<SSISComponent>) => void;
    setComponents: (components: SSISComponent[]) => void;

    addConnection: (connection: Connection) => void;
    removeConnection: (id: string) => void;
    setConnections: (connections: Connection[]) => void;

    selectComponent: (id: string | null) => void;

    validateAll: () => void;
    clearCanvas: () => void;

    // Copy/Paste
    copyComponent: (id: string) => void;
    pasteComponent: () => void;
    canPaste: () => boolean;

    // History (Undo/Redo)
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;

    // Persistence
    saveToStorage: () => void;
    loadFromStorage: () => void;
    exportToFile: () => void;
    importFromFile: (file: File) => Promise<void>;

    // Templates
    loadTemplate: (components: SSISComponent[], connections: Connection[]) => void;

    // Shareable Links
    loadFromURL: () => void;

    // Helper getters for current view
    getCurrentComponents: () => SSISComponent[];
    getCurrentConnections: () => Connection[];
}

export const useCanvasStore = create<CanvasState>((set, get) => {
    // Helper to save state to history
    const saveHistory = (action: string) => {
        const { components, connections } = get();
        historyManager.saveState(components, connections, action);
    };

    return {
        // Platform - default to ssis
        platform: 'ssis',
        setPlatform: (platform: PlatformType) => {
            const currentPlatform = get().platform;
            if (currentPlatform === platform) return;

            // Save current state before switching
            get().saveToStorage();

            // Switch platform
            set({ platform, selectedComponent: null, currentDataFlowTaskId: null, viewMode: 'data-flow' });

            // Load state for new platform
            get().loadFromStorage();
        },

        // View mode - default to data-flow for backward compatibility
        viewMode: 'data-flow',
        setViewMode: (mode: ViewMode) => {
            set({ viewMode: mode, selectedComponent: null });
        },

        // Nested data flow navigation
        currentDataFlowTaskId: null,
        setCurrentDataFlowTaskId: (id: string | null) => {
            set({ currentDataFlowTaskId: id });
        },
        navigateToDataFlow: (taskId: string) => {
            const task = get().components.find(c => c.id === taskId);
            if (task && task.category === 'DataFlowTask') {
                // Initialize nested data flow if it doesn't exist
                if (!task.nestedDataFlow) {
                    get().updateComponent(taskId, {
                        nestedDataFlow: { components: [], connections: [] }
                    });
                }
                set({
                    currentDataFlowTaskId: taskId,
                    viewMode: 'data-flow',
                    selectedComponent: null
                });
            }
        },
        navigateToControlFlow: () => {
            set({
                currentDataFlowTaskId: null,
                viewMode: 'control-flow',
                selectedComponent: null
            });
        },

        components: [],
        connections: [],
        selectedComponent: null,
        errors: [],
        clipboard: null,

        addComponent: (component) => {
            const { currentDataFlowTaskId, components, viewMode } = get();

            console.log('[ADD COMPONENT DEBUG]:', {
                componentName: component.name,
                componentType: component.type,
                componentCategory: component.category,
                currentDataFlowTaskId,
                viewMode,
                totalComponentsCount: components.length
            });

            // If in nested data flow, add to nested data flow
            if (currentDataFlowTaskId) {
                console.log('[Adding to NESTED data flow task]:', currentDataFlowTaskId);
                const task = components.find(c => c.id === currentDataFlowTaskId);
                if (task && task.nestedDataFlow) {
                    const updatedNested = {
                        components: [...task.nestedDataFlow.components, component],
                        connections: task.nestedDataFlow.connections
                    };
                    console.log('[Component added to nested flow. New nested count]:', updatedNested.components.length);
                    get().updateComponent(currentDataFlowTaskId, {
                        nestedDataFlow: updatedNested
                    });
                    saveHistory(`Added ${component.category} to data flow`);
                    get().validateAll();
                    return;
                } else {
                    console.error('[ERROR] Nested task not found or has no nestedDataFlow property');
                }
            }

            // Otherwise add to main components
            console.log('[Adding to ROOT level components]');
            set((state) => {
                const newComponents = [...state.components, component];
                console.log('[Component added to root. New count]:', newComponents.length);
                return { components: newComponents };
            });
            saveHistory(`Added ${component.category}`);
            get().validateAll();
        },

        removeComponent: (id) => {
            const { currentDataFlowTaskId, components } = get();
            const comp = components.find(c => c.id === id);

            // If in nested data flow, remove from nested data flow
            if (currentDataFlowTaskId) {
                const task = components.find(c => c.id === currentDataFlowTaskId);
                if (task && task.nestedDataFlow) {
                    const updatedNested = {
                        components: task.nestedDataFlow.components.filter((c) => c.id !== id),
                        connections: task.nestedDataFlow.connections.filter(
                            (c) => c.source !== id && c.target !== id
                        )
                    };
                    get().updateComponent(currentDataFlowTaskId, {
                        nestedDataFlow: updatedNested
                    });
                    saveHistory(`Deleted ${comp?.category || 'component'} from data flow`);
                    get().validateAll();
                    return;
                }
            }

            // Otherwise remove from main components
            set((state) => {
                const newComponents = state.components.filter((c) => c.id !== id);
                const newConnections = state.connections.filter(
                    (c) => c.source !== id && c.target !== id
                );
                return { components: newComponents, connections: newConnections };
            });
            saveHistory(`Deleted ${comp?.category || 'component'}`);
            get().validateAll();
        },

        updateComponent: (id, updates) => {
            set((state) => ({
                components: state.components.map((c) =>
                    c.id === id ? { ...c, ...updates } : c
                ),
            }));
            saveHistory(`Updated component`);
            get().validateAll();
        },

        setComponents: (components) => {
            set({ components });
            get().validateAll();
        },

        addConnection: (connection) => {
            const { currentDataFlowTaskId, components } = get();

            // If in nested data flow, add to nested data flow
            if (currentDataFlowTaskId) {
                const task = components.find(c => c.id === currentDataFlowTaskId);
                if (task && task.nestedDataFlow) {
                    const exists = task.nestedDataFlow.connections.some(
                        (c) => c.source === connection.source && c.target === connection.target
                    );
                    if (!exists) {
                        const updatedNested = {
                            components: task.nestedDataFlow.components,
                            connections: [...task.nestedDataFlow.connections, connection]
                        };
                        get().updateComponent(currentDataFlowTaskId, {
                            nestedDataFlow: updatedNested
                        });
                        saveHistory('Added connection to data flow');
                        get().validateAll();
                    }
                    return;
                }
            }

            // Otherwise add to main connections
            set((state) => {
                const exists = state.connections.some(
                    (c) => c.source === connection.source && c.target === connection.target
                );
                if (exists) return state;
                return { connections: [...state.connections, connection] };
            });
            saveHistory('Created connection');
            get().validateAll();
        },

        removeConnection: (id) => {
            const { currentDataFlowTaskId, components } = get();

            // If in nested data flow, remove from nested data flow
            if (currentDataFlowTaskId) {
                const task = components.find(c => c.id === currentDataFlowTaskId);
                if (task && task.nestedDataFlow) {
                    const updatedNested = {
                        components: task.nestedDataFlow.components,
                        connections: task.nestedDataFlow.connections.filter((c) => c.id !== id)
                    };
                    get().updateComponent(currentDataFlowTaskId, {
                        nestedDataFlow: updatedNested
                    });
                    saveHistory('Deleted connection from data flow');
                    get().validateAll();
                    return;
                }
            }

            // Otherwise remove from main connections
            set((state) => ({
                connections: state.connections.filter((c) => c.id !== id),
            }));
            saveHistory('Deleted connection');
            get().validateAll();
        },

        setConnections: (connections) => {
            set({ connections });
            get().validateAll();
        },

        selectComponent: (id) => set({ selectedComponent: id }),

        copyComponent: (id) => {
            const component = get().components.find(c => c.id === id);
            if (component) {
                set({ clipboard: { ...component } });
            }
        },

        pasteComponent: () => {
            const { clipboard } = get();
            if (!clipboard) return;

            const newId = uuidv4();
            const offset = 50;

            const newComponent: SSISComponent = {
                ...clipboard,
                id: newId,
                position: {
                    x: clipboard.position.x + offset,
                    y: clipboard.position.y + offset
                },
                inputs: [],
                outputs: [],
                hasError: false,
                errorMessage: undefined
            };

            set((state) => ({
                components: [...state.components, newComponent],
                selectedComponent: newId
            }));
            saveHistory(`Pasted ${newComponent.category}`);
            get().validateAll();
        },

        canPaste: () => get().clipboard !== null,

        validateAll: () => {
            const { components, connections, platform } = get();
            const errors = validateGraph(components, connections, platform);

            const updatedComponents = components.map(comp => {
                const compErrors = errors.filter(e => e.affectedComponents.includes(comp.id));
                const hasError = compErrors.some(e => e.severity === 'error');
                const errorMessage = compErrors.map(e => e.message).join('; ');

                if (comp.hasError !== hasError || comp.errorMessage !== errorMessage) {
                    return { ...comp, hasError, errorMessage };
                }
                return comp;
            });

            const updatedConnections = connections.map(conn => {
                const connError = errors.find(e => e.connectionId === conn.id);
                const isValid = !connError || connError.severity === 'info';

                if (conn.isValid !== isValid || conn.validationResult !== connError) {
                    return { ...conn, isValid, validationResult: connError };
                }
                return conn;
            });

            set({
                errors,
                components: updatedComponents,
                connections: updatedConnections
            });
        },

        clearCanvas: () => {
            set({ components: [], connections: [], errors: [], selectedComponent: null });
            historyManager.clear();
            saveHistory('Cleared canvas');
        },

        // Undo/Redo implementations
        undo: () => {
            const previousState = historyManager.undo();
            if (previousState) {
                set({
                    components: previousState.components,
                    connections: previousState.connections,
                    selectedComponent: null
                });
                get().validateAll();
            }
        },

        redo: () => {
            const nextState = historyManager.redo();
            if (nextState) {
                set({
                    components: nextState.components,
                    connections: nextState.connections,
                    selectedComponent: null
                });
                get().validateAll();
            }
        },

        canUndo: () => historyManager.canUndo(),

        canRedo: () => historyManager.canRedo(),

        saveToStorage: () => {
            const { components, connections, platform } = get();
            const key = platform === 'adf' ? 'adf-simulator-canvas' : 'ssis-simulator-canvas';
            saveToLocalStorage(components, connections, key);
        },

        loadFromStorage: () => {
            const { platform } = get();
            const key = platform === 'adf' ? 'adf-simulator-canvas' : 'ssis-simulator-canvas';
            const data = loadFromLocalStorage(key);

            if (data) {
                console.log('[DEBUG] Loading from localStorage:', JSON.stringify({
                    platform,
                    key,
                    componentCount: data.components.length,
                    componentTypes: data.components.map((c: SSISComponent) => ({
                        name: c.name,
                        type: c.type,
                        category: c.category
                    }))
                }, null, 2));

                // Validation for SSIS components
                if (platform === 'ssis') {
                    const validTypes = ['source', 'transformation', 'destination', 'control-flow-task'];
                    const invalidComponents = data.components.filter((c: SSISComponent) => !validTypes.includes(c.type));

                    if (invalidComponents.length > 0) {
                        console.error('[DEBUG] INVALID component types detected:', invalidComponents.map((c: SSISComponent) => ({
                            name: c.name,
                            type: c.type
                        })));
                        console.warn('[DEBUG] Clearing corrupted localStorage...');
                        localStorage.removeItem(key);
                        alert('Corrupted data detected in localStorage. It has been cleared. Please refresh the page.');
                        set({ components: [], connections: [], errors: [], selectedComponent: null });
                        return;
                    }
                }

                set({
                    components: data.components,
                    connections: data.connections,
                    errors: [],
                    selectedComponent: null
                });
                historyManager.clear();
                saveHistory('Loaded from storage');
                get().validateAll();
            } else {
                // If no data found for this platform, reset to empty
                set({ components: [], connections: [], errors: [], selectedComponent: null });
                historyManager.clear();
            }
        },

        exportToFile: () => {
            const { components, connections, platform } = get();

            if (platform === 'adf') {
                const armTemplate = generateARMTemplate(components, connections);
                const blob = new Blob([armTemplate], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `adf-pipeline-export-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                exportToJSON(components, connections);
            }
        },

        importFromFile: async (file: File) => {
            const data = await importFromJSON(file);
            if (data) {
                set({
                    components: data.components,
                    connections: data.connections,
                    errors: [],
                    selectedComponent: null
                });
                historyManager.clear();
                saveHistory('Imported from file');
                get().validateAll();
            }
        },

        loadTemplate: (components, connections) => {
            const { platform } = get();

            // Determine the appropriate view mode based on template content
            let initialViewMode: ViewMode = 'data-flow';

            if (platform === 'ssis') {
                // Check if template has control flow tasks
                const hasControlFlowTasks = components.some(c => c.type === 'control-flow-task');
                const hasDataFlowComponents = components.some(c =>
                    c.type === 'source' || c.type === 'transformation' || c.type === 'destination'
                );

                // If it has control flow tasks, show control flow view
                // Otherwise show data flow view
                initialViewMode = hasControlFlowTasks ? 'control-flow' : 'data-flow';
            }

            console.log('[LOAD TEMPLATE]:', {
                platform,
                componentCount: components.length,
                componentTypes: components.map(c => ({ name: c.name, type: c.type })),
                initialViewMode
            });

            set({
                components,
                connections,
                errors: [],
                selectedComponent: null,
                viewMode: initialViewMode,
                currentDataFlowTaskId: null
            });

            console.log('[LOAD TEMPLATE] State set complete. Verifying...');

            historyManager.clear();
            saveHistory('Loaded template');
            get().validateAll();

            // Verify the final state
            const finalState = get();
            console.log('[LOAD TEMPLATE] Final state:', {
                componentCount: finalState.components.length,
                viewMode: finalState.viewMode,
                platform: finalState.platform,
                visibleComponents: finalState.getCurrentComponents().length,
                visibleComponentNames: finalState.getCurrentComponents().map(c => c.name)
            });
        },

        loadFromURL: () => {
            const data = decodePipelineFromURL();
            if (data) {
                set({
                    components: data.components,
                    connections: data.connections,
                    errors: [],
                    selectedComponent: null
                });
                historyManager.clear();
                saveHistory('Loaded from shareable link');
                get().validateAll();
            }
        },

        // Helper getters - return components/connections for current view
        getCurrentComponents: () => {
            const { viewMode, currentDataFlowTaskId, components, platform } = get();

            console.log('[GET CURRENT COMPONENTS]:', {
                platform,
                viewMode,
                currentDataFlowTaskId,
                totalComponents: components.length
            });

            // If viewing nested data flow (SSIS Data Flow Task or ADF Mapping Data Flow), return nested components
            if (currentDataFlowTaskId) {
                const task = components.find(c => c.id === currentDataFlowTaskId);
                if (task?.nestedDataFlow) {
                    console.log('[Returning NESTED components]:', task.nestedDataFlow.components.length);
                    return task.nestedDataFlow.components;
                }
                console.log('[WARNING] No nested flow. Returning empty.');
                return [];
            }

            // ADF Platform Logic
            if (platform === 'adf') {
                // In ADF, the main canvas is the Pipeline (Control Flow).
                // All ADF components added to the root are part of the pipeline.
                // We filter out SSIS components just in case.
                const adfComponents = components.filter(c =>
                    ['data-movement', 'transformation', 'control-flow'].includes(c.type)
                );
                return adfComponents;
            }

            // SSIS Platform Logic
            // If in control flow view, return only control flow tasks
            if (viewMode === 'control-flow') {
                const cf = components.filter(c => c.type === 'control-flow-task');
                console.log('[Returning CONTROL FLOW]:', cf.length);
                return cf;
            }

            // Default: data flow view - return data flow components
            const dataFlow = components.filter(c =>
                c.type === 'source' ||
                c.type === 'transformation' ||
                c.type === 'destination'
            );
            console.log('[DEBUG] Data flow filter results:', JSON.stringify({
                totalComponents: components.length,
                dataFlowComponents: dataFlow.length,
                allComponentTypes: components.map(c => ({ name: c.name, type: c.type })),
                dataFlowNames: dataFlow.map(c => c.name),
                rejectedComponents: components.filter(c => !['source', 'transformation', 'destination'].includes(c.type))
                    .map(c => ({ name: c.name, type: c.type }))
            }, null, 2));
            return dataFlow;
        },

        getCurrentConnections: () => {
            const { viewMode, currentDataFlowTaskId, connections, components, platform } = get();

            // If viewing nested data flow, return nested connections
            if (currentDataFlowTaskId) {
                const task = components.find(c => c.id === currentDataFlowTaskId);
                if (task?.nestedDataFlow) {
                    return task.nestedDataFlow.connections;
                }
                return [];
            }

            // ADF Platform Logic
            if (platform === 'adf') {
                // Return all connections between ADF components
                const adfComponentIds = new Set(
                    components.filter(c =>
                        ['data-movement', 'transformation', 'control-flow'].includes(c.type)
                    ).map(c => c.id)
                );
                return connections.filter(c =>
                    adfComponentIds.has(c.source) &&
                    adfComponentIds.has(c.target)
                );
            }

            // SSIS Platform Logic
            // If in control flow view, return only control flow connections
            if (viewMode === 'control-flow') {
                const controlFlowComponentIds = new Set(
                    components.filter(c => c.type === 'control-flow-task').map(c => c.id)
                );
                return connections.filter(c =>
                    controlFlowComponentIds.has(c.source) &&
                    controlFlowComponentIds.has(c.target)
                );
            }

            // Default: data flow view - return data flow connections
            const dataFlowComponentIds = new Set(
                components.filter(c =>
                    c.type === 'source' ||
                    c.type === 'transformation' ||
                    c.type === 'destination'
                ).map(c => c.id)
            );
            return connections.filter(c =>
                dataFlowComponentIds.has(c.source) &&
                dataFlowComponentIds.has(c.target)
            );
        }
    };
});
