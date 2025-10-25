import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useSettings } from '../context/SettingsContext';
import type { CustomPage } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface CustomPageRendererProps {
    page: CustomPage;
}

const CustomPageRenderer: React.FC<CustomPageRendererProps> = ({ page }) => {
    const { themeStyles } = useSettings();
    
    // 1. Create a state variable to hold the final HTML
const [cleanHtml, setCleanHtml] = useState('');

// 2. Use an effect to parse and sanitize the content when the page changes
useEffect(() => {
    const parseContent = async () => {
        // Use 'await' to wait for the promise from marked.parse() to finish
        const uncleanedHtml = await marked.parse(page.content || '');
        
        // Now that we have the real string, we can sanitize it
        const sanitizedHtml = DOMPurify.sanitize(uncleanedHtml);
        
        // Update our state with the final, clean HTML
        setCleanHtml(sanitizedHtml);
    };

    parseContent();
}, [page.content]); // This effect re-runs whenever the page content changes

    return (
    <div className="container mx-auto p-4 md:p-8">
        {/* Change #1: Apply the card style to this div */}
        <div className="p-6 md:p-10 rounded-lg shadow-lg" style={themeStyles.card}>
            
            {/* Change #2: Apply the primary heading style to this h1 */}
            <h1 className="text-4xl font-extrabold mb-6" style={themeStyles.primaryHeading}>{page.title}</h1>
            
            <div 
                className="prose dark:prose-invert max-w-none" 
                dangerouslySetInnerHTML={{ __html: cleanHtml}}
            />
        </div>
    </div>
);
};

export default CustomPageRenderer;
