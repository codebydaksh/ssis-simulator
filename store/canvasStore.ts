import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { SSISComponent, Connection, ValidationResult, ViewMode } from '../lib/types';
import { validateGraph } from '../lib/validationEngine';
import { saveToLocalStorage, loadFromLocalStorage, exportToJSON, importFromJSON } from '../lib/persistence';
import { historyManager } from '../lib/historyManager';
import { decodePipelineFromURL } from '../lib/shareableLinks';

interface CanvasState {
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
            const { currentDataFlowTaskId, components } = get();
            
            // If in nested data flow, add to nested data flow
            if (currentDataFlowTaskId) {
                const task = components.find(c => c.id === currentDataFlowTaskId);
                if (task && task.nestedDataFlow) {
                    const updatedNested = {
                        components: [...task.nestedDataFlow.components, component],
                        connections: task.nestedDataFlow.connections
                    };
                    get().updateComponent(currentDataFlowTaskId, {
                        nestedDataFlow: updatedNested
                    });
                    saveHistory(`Added ${component.category} to data flow`);
                    get().validateAll();
                    return;
                }
            }
            
            // Otherwise add to main components
            set((state) => {
                const newComponents = [...state.components, component];
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
            const { components, connections } = get();
            const errors = validateGraph(components, connections);

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
            const { components, connections } = get();
            saveToLocalStorage(components, connections);
        },

        loadFromStorage: () => {
            const data = loadFromLocalStorage();
            if (data) {
                set({
                    components: data.components,
                    connections: data.connections,
                    errors: [],
                    selectedComponent: null
                });
                historyManager.clear();
                saveHistory('Loaded from storage');
                get().validateAll();
            }
        },

        exportToFile: () => {
            const { components, connections } = get();
            exportToJSON(components, connections);
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
            set({ components, connections, errors: [], selectedComponent: null });
            historyManager.clear();
            saveHistory('Loaded template');
            get().validateAll();
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
            const { viewMode, currentDataFlowTaskId, components } = get();
            
            // If viewing nested data flow, return nested components
            if (currentDataFlowTaskId) {
                const task = components.find(c => c.id === currentDataFlowTaskId);
                if (task?.nestedDataFlow) {
                    return task.nestedDataFlow.components;
                }
                return [];
            }
            
            // If in control flow view, return only control flow tasks
            if (viewMode === 'control-flow') {
                return components.filter(c => c.type === 'control-flow-task');
            }
            
            // Default: data flow view - return data flow components
            return components.filter(c => 
                c.type === 'source' || 
                c.type === 'transformation' || 
                c.type === 'destination'
            );
        },

        getCurrentConnections: () => {
            const { viewMode, currentDataFlowTaskId, connections, components } = get();
            
            // If viewing nested data flow, return nested connections
            if (currentDataFlowTaskId) {
                const task = components.find(c => c.id === currentDataFlowTaskId);
                if (task?.nestedDataFlow) {
                    return task.nestedDataFlow.connections;
                }
                return [];
            }
            
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
