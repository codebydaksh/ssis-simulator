'use client';

import React, { useState, useMemo } from 'react';
import { TEMPLATES } from '@/lib/templates';
import { ADF_TEMPLATES } from '@/lib/adfTemplates';
import { DATABRICKS_TEMPLATES } from '@/lib/databricksTemplates';
import { SSISComponent, Connection } from '@/lib/types';
import { useCanvasStore } from '@/store/canvasStore';
import { Book, X, Search } from 'lucide-react';

type TemplateUnion = {
    id: string;
    name: string;
    description: string;
    category?: string;
    tags?: string[];
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'beginner' | 'intermediate' | 'advanced';
    components: SSISComponent[];
    connections: Connection[];
};

export default function TemplateSelector() {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const { loadTemplate, platform } = useCanvasStore();

    const currentTemplates = useMemo(() => {
        if (platform === 'adf') return ADF_TEMPLATES;
        if (platform === 'databricks') return DATABRICKS_TEMPLATES;
        return TEMPLATES;
    }, [platform]);

    const categories = useMemo(() => {
        const cats = new Set<string>();
        (currentTemplates as TemplateUnion[]).forEach((t) => {
            if (t.category) cats.add(t.category);
        });
        return Array.from(cats).sort();
    }, [currentTemplates]);

    const filteredTemplates = useMemo(() => {
        return (currentTemplates as TemplateUnion[]).filter((template) => {
            const matchesSearch = !searchTerm ||
                template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesCategory = !selectedCategory || template.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, selectedCategory, currentTemplates]);

    const handleLoadTemplate = (template: TemplateUnion) => {
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
                <span>{platform === 'adf' ? 'ADF Templates' : platform === 'databricks' ? 'Databricks Templates' : 'SSIS Templates'}</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Load {platform === 'adf' ? 'ADF' : platform === 'databricks' ? 'Databricks' : 'SSIS'} Example Template
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search templates by name, description, or tags..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${selectedCategory === null
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            All Categories
                        </button>
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${selectedCategory === category
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {filteredTemplates.length} of {currentTemplates.length} templates
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {filteredTemplates.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <p className="text-lg mb-2">No templates found</p>
                            <p className="text-sm">Try adjusting your search or category filter</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white dark:bg-gray-800"
                                    onClick={() => handleLoadTemplate(template)}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{template.name}</h3>
                                        <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ml-2 ${
                                            template.difficulty === 'Beginner' || template.difficulty === 'beginner' 
                                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                                                : template.difficulty === 'Intermediate' || template.difficulty === 'intermediate'
                                                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' 
                                                    : template.difficulty === 'Advanced' || template.difficulty === 'advanced'
                                                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                                        : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' // Default color
                                            }`}>
                                            {template.difficulty 
                                                ? template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1).toLowerCase()
                                                : 'Standard'}
                                        </span>
                                    </div>
                                    {template.category && (
                                        <div className="mb-2">
                                            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                                {template.category}
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span>{template.components.length} components</span>
                                        <span>{template.connections.length} connections</span>
                                    </div>
                                    {template.tags && template.tags.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {template.tags.slice(0, 3).map((tag: string) => (
                                                <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click any template to load it. Your current canvas will be replaced.
                    </p>
                </div>
            </div>
        </div>
    );
}
