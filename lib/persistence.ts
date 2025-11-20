import { SSISComponent, Connection } from './types';

const STORAGE_KEY = 'ssis-simulator-canvas';

export interface CanvasData {
    components: SSISComponent[];
    connections: Connection[];
    version: string;
}

export const saveToLocalStorage = (components: SSISComponent[], connections: Connection[], key: string = STORAGE_KEY): void => {
    try {
        const data: CanvasData = {
            components,
            connections,
            version: '1.0.0'
        };
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
};

export const loadFromLocalStorage = (key: string = STORAGE_KEY): CanvasData | null => {
    try {
        const stored = localStorage.getItem(key);
        if (!stored) return null;

        const data = JSON.parse(stored) as CanvasData;
        return data;
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return null;
    }
};

export const clearLocalStorage = (key: string = STORAGE_KEY): void => {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Failed to clear localStorage:', error);
    }
};

export const exportToJSON = (components: SSISComponent[], connections: Connection[]): void => {
    const data: CanvasData = {
        components,
        connections,
        version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ssis-pipeline-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const importFromJSON = (file: File): Promise<CanvasData | null> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string) as CanvasData;
                resolve(data);
            } catch (error) {
                console.error('Failed to parse JSON file:', error);
                resolve(null);
            }
        };
        reader.onerror = () => {
            console.error('Failed to read file');
            resolve(null);
        };
        reader.readAsText(file);
    });
};
