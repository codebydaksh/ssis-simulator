import { SSISComponent, Connection } from './types';
import { CanvasData } from './persistence';

export function encodePipelineToURL(components: SSISComponent[], connections: Connection[]): string {
    const data: CanvasData = {
        components,
        connections,
        version: '1.0.0'
    };

    try {
        const jsonString = JSON.stringify(data);
        const base64 = btoa(encodeURIComponent(jsonString));
        return `${window.location.origin}${window.location.pathname}?pipeline=${base64}`;
    } catch (error) {
        console.error('Failed to encode pipeline to URL:', error);
        return window.location.href;
    }
}

export function decodePipelineFromURL(): CanvasData | null {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const encoded = urlParams.get('pipeline');
        
        if (!encoded) return null;

        const jsonString = decodeURIComponent(atob(encoded));
        const data = JSON.parse(jsonString) as CanvasData;
        
        if (!data.components || !data.connections) {
            return null;
        }

        return data;
    } catch (error) {
        console.error('Failed to decode pipeline from URL:', error);
        return null;
    }
}

export function copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        return new Promise((resolve, reject) => {
            if (document.execCommand('copy')) {
                resolve();
            } else {
                reject(new Error('Copy command failed'));
            }
            document.body.removeChild(textArea);
        });
    }
}

