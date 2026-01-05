import React, { useRef, useState } from 'react';
import { Zap, Shield, Image as ImageIcon, PenTool, Move, FileText, ChevronDown } from 'lucide-react';

const FEATURE_ITEMS = [
    {
        icon: Shield,
        title: "Privacy First",
        desc: "100% Local Processing. Your photos never leave your device.",
        color: "bg-emerald-500",
        delay: "delay-0"
    },
    {
        icon: Zap,
        title: "Lightning Fast",
        desc: "Process 1000s of images in seconds using multi-threaded workers.",
        color: "bg-amber-500",
        delay: "delay-100"
    },
    {
        icon: Move,
        title: "Drag & Organize",
        desc: "Visually reorder your queue. Drag and drop to set the exact sequence.",
        color: "bg-blue-500",
        delay: "delay-200"
    },
    {
        icon: PenTool,
        title: "Batch Sign & Watermark",
        desc: "Apply logos or signatures to unlimited photos instantly.",
        color: "bg-purple-500",
        delay: "delay-300"
    },
    {
        icon: FileText,
        title: "Smart Batch Rename",
        desc: "Organize files with powerful patterns (Date, Sequence, Original) in one click.",
        color: "bg-rose-500",
        delay: "delay-100" // Reuse delay for variety
    },
    {
        icon: ImageIcon,
        title: "Any Format",
        desc: "Convert HEIC, PNG, WebP to JPG directly in the browser.",
        color: "bg-indigo-500",
        delay: "delay-200"
    }
];



const TiltCard = ({ item, index }: { item: any, index: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [rotate, setRotate] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5; // Max 5deg rotation
        const rotateY = ((x - centerX) / centerX) * 5;

        setRotate({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setRotate({ x: 0, y: 0 });
    };

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
                transition: 'transform 0.1s ease-out'
            }}
            className={`
                group relative overflow-hidden bg-white/60 backdrop-blur-sm 
                border border-white/40 hover:border-white/80
                rounded-2xl p-6 
                shadow-sm hover:shadow-xl hover:shadow-accent-gold/5
                cursor-default
                animate-in zoom-in-50 fade-in fill-mode-forwards
                ${item.delay}
            `}
        >
            {/* Hover Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex flex-col items-start gap-4 transform transition-transform duration-300 group-hover:translate-z-10">
                {/* Icon Box */}
                <div className={`
                            p-3 rounded-xl text-white shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3
                            ${item.color}
                        `}>
                    <item.icon size={24} strokeWidth={2} />
                </div>

                {/* Text */}
                <div>
                    <h3 className="text-lg font-bold text-ink-main mb-1 group-hover:text-amber-600 transition-colors">
                        {item.title}
                    </h3>
                    <p className="text-xs md:text-sm text-ink-muted leading-relaxed">
                        {item.desc}
                    </p>
                </div>
            </div>

            {/* Decorative Blob */}
            <div className={`
                        absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 blur-2xl transition-transform duration-500 group-hover:scale-150
                        ${item.color} 
                    `} />
        </div>
    );
};

export const FeaturesGallery: React.FC = () => {
    return (
        <div id="features-section" className="w-full max-w-5xl mx-auto mt-12 mb-24 px-6 scroll-mt-24">

            {/* Scroll Hint - Airport Runway Effect (Centered in Gap) */}
            <div className="flex flex-col items-center justify-center -space-y-4 mb-12 -mt-12 opacity-60">
                {[0, 1, 2].map((i) => (
                    <ChevronDown
                        key={i}
                        size={24 + (i * 2)} // Get slightly larger (24, 26, 28)
                        className="text-ink-muted animate-[pulse_1.5s_ease-in-out_infinite]"
                        style={{ animationDelay: `${i * 0.2}s` }}
                    />
                ))}
            </div>

            {/* Header */}
            <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h2 className="text-2xl md:text-3xl font-bold text-ink-main tracking-tight mb-3">
                    Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-gold to-amber-600">Speed & Privacy</span>
                </h2>
                <p className="text-ink-muted text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                    Everything you need to manage your visual assets, right in your browser. No uploads, no waiting.
                </p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {FEATURE_ITEMS.map((item, i) => (
                    <TiltCard key={i} item={item} index={i} />
                ))}
            </div>
        </div>
    );
};
