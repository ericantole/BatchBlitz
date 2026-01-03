
import React from 'react';
import { Navbar } from '../components/Navbar';
import { ShieldCheck, ServerOff, Eye, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Privacy: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-ink-main">
            <Navbar />

            <div className="max-w-3xl mx-auto px-6 py-24 md:py-32">
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-emerald-100 text-emerald-600 rounded-2xl mb-4">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-4xl font-serif font-bold mb-4">Privacy Policy</h1>
                    <p className="text-lg text-ink-muted">Last Updated: December 2025</p>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">
                    <Section
                        icon={ServerOff}
                        title="1. Local Processing (Zero Data Collection)"
                        content="The core philosophy of BatchBlitz is 'Local First'. When you process images (resizing, watermarking, converting), the operations happen entirely within your browser using WebAssembly. Your photos are NEVER uploaded to our servers, never analyzed by AI in the cloud, and never stored by us. They don't leave your device."
                    />

                    <Section
                        icon={Eye}
                        title="2. Analytics & Usage Data"
                        content="We collect minimal, anonymous usage data to improve the app (e.g., 'User X processed a batch successfully'). This does NOT include any image content, filenames, or metadata. We simply count how often features are used to prioritize future updates."
                    />

                    <Section
                        icon={Lock}
                        title="3. Account & Payments"
                        content="If you create a Pro account, we store your email and authentication status via Supabase (a secure database provider). Payment processing involves third-party providers (Like PayPal/Stripe). We do not store your credit card information directly."
                    />

                    <div className="pt-8 border-t border-gray-100">
                        <h3 className="font-bold text-lg mb-4">Contact Us</h3>
                        <p className="text-ink-muted">
                            If you have questions about this policy, please context us at <a href="mailto:support@batchblitz.com" className="text-ink-main font-bold hover:underline">support@batchblitz.com</a>.
                        </p>
                    </div>

                    <div className="pt-4 flex justify-center">
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
