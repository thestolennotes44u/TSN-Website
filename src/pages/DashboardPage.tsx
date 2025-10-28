import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const DashboardPage: React.FC = () => {
    const { homepageContent } = useData();
    const [homeExtraHtml, setHomeExtraHtml] = useState('');

    useEffect(() => {
        const parseContent = async () => {
            if (homepageContent.showExtraSection && homepageContent.extraSectionContent) {
                const uncleanedExtra = await marked.parse(homepageContent.extraSectionContent);
                setHomeExtraHtml(DOMPurify.sanitize(uncleanedExtra));
            }
        };
        parseContent();
    }, [homepageContent]);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="p-8 rounded-lg shadow-lg bg-card-bg dark:bg-dark-card-bg mb-8">
                <h1 className="text-4xl font-extrabold mb-4 text-primary-heading dark:text-dark-primary-heading">
                    {homepageContent.welcomeTitle}
                </h1>
                <p className="text-lg text-body-text dark:text-dark-body-text">
                    {homepageContent.welcomeText}
                </p>
                <Link 
                    to="/content" 
                    className="inline-block mt-6 px-6 py-3 rounded-md text-white font-semibold bg-accent dark:bg-dark-accent hover:opacity-90 transition-opacity"
                >
                    Browse All Content
                </Link>
            </div>

            {homepageContent.showExtraSection && (
                <div className="p-8 rounded-lg shadow-lg bg-card-bg dark:bg-dark-card-bg">
                    <h2 className="text-3xl font-bold mb-6 text-primary-heading dark:text-dark-primary-heading">
                        {homepageContent.extraSectionTitle}
                    </h2>
                    <div 
                        className="prose dark:prose-invert max-w-none text-body-text dark:text-dark-body-text" 
                        dangerouslySetInnerHTML={{ __html: homeExtraHtml }}
                    />
                </div>
            )}
        </div>
    );
};

export default DashboardPage;