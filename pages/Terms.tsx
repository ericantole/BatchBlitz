
import React from 'react';
import { Navbar } from '../components/Navbar';
import { ScrollText, CreditCard, Ban, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Terms: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-ink-main">
            <Navbar />

            <div className="max-w-3xl mx-auto px-6 py-24 md:py-32">
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-600 rounded-2xl mb-4">
                        <ScrollText size={32} />
                    </div>
                    <h1 className="text-4xl font-serif font-bold mb-4">Terms of Service</h1>
                    <p className="text-lg text-ink-muted">Last Updated: December 2025</p>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">

                    <Section
                        icon={Scale}
                        title="1. Acceptance of Terms"
                        content="By accessing and using BatchBlitz, you accept and agree to be bound by the terms and provision of this agreement. Use of the tool varies by license type (Free vs Pro)."
                    />

                    <Section
                        icon={CreditCard}
                        title="2. Subscriptions & Payments"
                        content="Pro features are billed on a monthly subscription basis ($4.99/mo). Payments are processed securely via PayPal. By subscribing, you acknowledge that all sales are final. We do not offer refunds for partial months or unused services. You may cancel anytime to stop future billing."
                    />

                    <Section
                        icon={Ban}
                        title="3. Prohibited Use"
                        content="You agree not to misuse the service. Although processing is local, any attempt to reverse engineer the application, bypass payment mechanisms (the 'Paywall'), or use the software for illegal activities will result in immediate termination of your license."
                    />

                    <Section
                        icon={ScrollText}
                        title="4. Intellectual Property"
                        content="The software, its original content, features, and functionality are and will remain the exclusive property of The AK. Your processed images remain your property."
                    />

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
