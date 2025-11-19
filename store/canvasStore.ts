import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { SSISComponent, Connection, ValidationResult } from '../lib/types';
import { validateGraph } from '../lib/validationEngine';
import { saveToLocalStorage, loadFromLocalStorage, exportToJSON, importFromJSON } from '../lib/persistence';
import { historyManager } from '../lib/historyManager';
import { decodePipelineFromURL } from '../lib/shareableLinks';

interface CanvasState {
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
}

export const useCanvasStore = create<CanvasState>((set, get) => {
    // Helper to save state to history
    const saveHistory = (action: string) => {
        const { components, connections } = get();
        historyManager.saveState(components, connections, action);
    };

    return {
        components: [],
        connections: [],
        selectedComponent: null,
        errors: [],
        clipboard: null,

        addComponent: (component) => {
            set((state) => {
                const newComponents = [...state.components, component];
                return { components: newComponents };
            });
            saveHistory(`Added ${component.category}`);
            get().validateAll();
        },

        removeComponent: (id) => {
            const comp = get().components.find(c => c.id === id);
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
            const { clipboard, components } = get();
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
        }
    };
});
