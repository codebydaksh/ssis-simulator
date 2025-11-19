'use client';

import React, { useState } from 'react';
import { TEMPLATES, Template } from '@/lib/templates';
import { useCanvasStore } from '@/store/canvasStore';
import { Book, X } from 'lucide-react';

export default function TemplateSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const { loadTemplate } = useCanvasStore();

    const handleLoadTemplate = (template: Template) => {
        if (confirm(`Load template "${template.name}"? This will replace your current canvas.`)) {
            loadTemplate(template.components, template.connections);
            setIsOpen(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-sm transition-colors text-white"
                title="Load Example Template"
            >
                <Book className="w-4 h-4" />
                <span>Templates</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold">Load Example Template</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {TEMPLATES.map((template) => (
                            <div
                                key={template.id}
                                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => handleLoadTemplate(template)}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-lg">{template.name}</h3>
                                    <span className={`text-xs px-2 py-1 rounded ${template.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                                            template.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                        }`}>
                                        {template.difficulty}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{template.components.length} components</span>
                                    <span>{template.connections.length} connections</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50">
                    <p className="text-sm text-gray-600">
                        Click any template to load it. Your current canvas will be replaced.
                    </p>
                </div>
            </div>
        </div>
    );
}
