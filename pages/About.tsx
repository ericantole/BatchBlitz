
import React from 'react';
import { Navbar } from '../components/Navbar';
import { ShieldCheck, Cpu, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const About: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-paper-base flex flex-col font-sans">
            <Navbar onLoginClick={() => navigate('/login')} />

            <div className="flex-1 pt-32 pb-20 px-4 md:px-8 max-w-4xl mx-auto w-full">
                <div className="space-y-12">

                    <div className="space-y-6">
                        <h1 className="text-5xl md:text-7xl font-serif font-bold text-ink-main tracking-tight">Built by The AK</h1>
                        <p className="text-xl md:text-2xl text-ink-muted font-light leading-relaxed">
                            "I built BatchBlitz because I was tired of uploading my private photos to random servers just to resize them. This tool runs 100% on your device."
                        </p>
                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm text-yellow-800 font-medium leading-relaxed">
                            We require login solely to track your Pro subscription status. We do NOT track your usage data, file history, or store any images. Your privacy is our product.
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 py-12 border-y border-ink-muted/10">
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-ink-main">
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className="font-bold text-lg text-ink-main">Privacy First</h3>
                            <p className="text-sm text-ink-muted leading-relaxed">
                                Your images never leave your browser. There is no backend server processing your files.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-ink-main">
                                <Cpu size={24} />
                            </div>
                            <h3 className="font-bold text-lg text-ink-main">Client-Side Power</h3>
                            <p className="text-sm text-ink-muted leading-relaxed">
                                We use WebAssembly and modern browser APIs to deliver native-app performance on the web.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-ink-main">
                                <Heart size={24} />
                            </div>
                            <h3 className="font-bold text-lg text-ink-main">Indie Crafted</h3>
                            <p className="text-sm text-ink-muted leading-relaxed">
                                No VC funding, no tracking, no ads. Just a useful tool built with care.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-float border border-white flex flex-col md:flex-row items-center gap-8">
                        <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                            <img src="/avatars/mascitgifn.gif" alt="The AK" className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-2 text-center md:text-left">
                            <h4 className="text-xl font-bold text-ink-main">Join the Journey</h4>
                            <p className="text-ink-muted">
                                BatchBlitz is constantly evolving. If you have feature requests or feedback, reach out.
                            </p>
                        </div>
                    </div>

                    {/* Legal Links */}
                    <div className="flex justify-center gap-6 mt-2 text-sm text-ink-muted">
                        <Link to="/privacy" className="hover:text-ink-main underline decoration-gray-300">Privacy</Link>
                        <Link to="/terms" className="hover:text-ink-main underline decoration-gray-300">Terms</Link>
                        <Link to="/disclaimer" className="hover:text-ink-main underline decoration-gray-300">Disclaimer</Link>
                    </div>

                </div>
            </div>
        </div>
    );
};