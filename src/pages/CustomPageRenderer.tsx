import React, { useState, useEffect } from 'react';
import type { CustomPage } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface CustomPageRendererProps {
    page: CustomPage;
}

const CustomPageRenderer: React.FC<CustomPageRendererProps> = ({ page }) => {
    const [cleanHtml, setCleanHtml] = useState('');

    useEffect(() => {
        const parseContent = async () => {
            // Step 1: Parse the Markdown, enabling the GFM option which is required for tables.
            const uncleanedHtml = await marked.parse(page.content || '', {
                gfm: true,      // This is the critical option for GitHub Flavored Markdown (tables).
                breaks: true,   // This makes single line breaks render as <br> tags.
            });
            
            // Step 2: Sanitize the HTML, explicitly allowing all table-related tags.
            const sanitizedHtml = DOMPurify.sanitize(uncleanedHtml, {
                ADD_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td'],
            });
            
            setCleanHtml(sanitizedHtml);
        };

        parseContent();
    }, [page.content]);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="p-6 md:p-10 rounded-lg shadow-lg bg-card-bg dark:bg-dark-card-bg">
                <h1 className="text-4xl font-extrabold mb-6 text-primary-heading dark:text-dark-primary-heading">
                    {page.title}
                </h1>
                <div 
                    className="prose dark:prose-invert max-w-none text-body-text dark:text-dark-body-text" 
                    dangerouslySetInnerHTML={{ __html: cleanHtml}}
                />
            </div>
        </div>
    );
};

export default CustomPageRenderer;