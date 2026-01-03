
import React from 'react';
import { Navbar } from '../components/Navbar';
import { AlertTriangle, HardDrive, Copyright } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Disclaimer: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-ink-main">
            <Navbar />

            <div className="max-w-3xl mx-auto px-6 py-24 md:py-32">
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-amber-100 text-amber-600 rounded-2xl mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h1 className="text-4xl font-serif font-bold mb-4">Disclaimer</h1>
                    <p className="text-lg text-ink-muted">Important Usage Information</p>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">

                    <Section
                        icon={HardDrive}
                        title="1. Software Provided 'AS IS'"
                        content="BatchBlitz is provided 'as is', without warranty of any kind, express or implied. While we strive for perfection and use enterprise-grade local processing, we cannot guarantee that the software is completely free of errors. We are not liable for any data loss, image corruption, or lost profits arising from the use of this tool."
                    />

                    <Section
                        icon={Copyright}
                        title="2. Copyright & Ownership"
                        content="You retain full ownership and copyright of your images. BatchBlitz claims no rights over the content you process. Conversely, you are solely responsible for ensuring you have the legal right to edit/modify the images you load into the tool."
                    />

                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                        <h3 className="font-bold text-amber-900 mb-2">Beta Notice</h3>
                        <p className="text-amber-800 text-sm leading-relaxed">
                            BatchBlitz is constantly evolving. Features may change without notice. By using this application, you acknowledge that it is a tool to assist your workflow, not a replacement for professional legal or archival advice.
                        </p>
                    </div>

                    <div className="pt-8 border-t border-gray-100 flex justify-center">
                        <Link to="/" className="text-sm font-bold text-ink-muted hover:text-ink-main transition-colors">
                            &larr; Return to Studio
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Section: React.FC<{ icon: any, title: string, content: string }> = ({ icon: Icon, title, content }) => (
    <div className="flex gap-4">
        <div className="flex-none pt-1">
            <Icon className="text-accent-gold" size={24} />
        </div>
        <div>
            <h2 className="text-xl font-bold mb-2">{title}</h2>
            <p className="text-ink-muted leading-relaxed">{content}</p>
        </div>
    </div>
);
