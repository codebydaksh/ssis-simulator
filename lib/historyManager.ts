import { SSISComponent, Connection } from './types';

export interface HistoryState {
    components: SSISComponent[];
    connections: Connection[];
    timestamp: number;
    action: string;
}

export class HistoryManager {
    private history: HistoryState[] = [];
    private currentIndex: number = -1;
    private maxHistory: number = 50;

    saveState(components: SSISComponent[], connections: Connection[], action: string): void {
        // Remove any future states if we're not at the end
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Deep clone to avoid reference issues
        const state: HistoryState = {
            components: JSON.parse(JSON.stringify(components)),
            connections: JSON.parse(JSON.stringify(connections)),
            timestamp: Date.now(),
            action
        };

        this.history.push(state);

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }
    }

    undo(): HistoryState | null {
        if (this.canUndo()) {
            this.currentIndex--;
            return this.history[this.currentIndex];
        }
        return null;
    }

    redo(): HistoryState | null {
        if (this.canRedo()) {
            this.currentIndex++;
            return this.history[this.currentIndex];
        }
        return null;
    }

    canUndo(): boolean {
        return this.currentIndex > 0;
    }

    canRedo(): boolean {
        return this.currentIndex < this.history.length - 1;
    }

    getCurrentState(): HistoryState | null {
        if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
            return this.history[this.currentIndex];
        }
        return null;
    }

    getHistoryList(): { action: string; timestamp: number; isCurrent: boolean }[] {
        return this.history.map((state, index) => ({
            action: state.action,
            timestamp: state.timestamp,
            isCurrent: index === this.currentIndex
        }));
    }

    clear(): void {
        this.history = [];
        this.currentIndex = -1;
    }

    getUndoLabel(): string | null {
        if (this.canUndo() && this.currentIndex > 0) {
            return this.history[this.currentIndex - 1].action;
        }
        return null;
    }

    getRedoLabel(): string | null {
        if (this.canRedo() && this.currentIndex < this.history.length - 1) {
            return this.history[this.currentIndex + 1].action;
        }
        return null;
    }
}

// Singleton instance
export const historyManager = new HistoryManager();
