import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Zap, Repeat, Sparkles } from 'lucide-react';
import { LandingHeader } from '@/components/landing-header';

export default function Home() {
    return (
        <div className="min-h-screen bg-white text-black selection:bg-indigo-100 font-sans">
            {/* Navbar */}
            <LandingHeader />

            {/* Hero */}
            <main className="max-w-5xl mx-auto px-8 pt-32 pb-24 text-center relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-indigo-50 to-white rounded-full blur-3xl -z-10 opacity-60" />

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-8 animate-fade-in-up">
                    <Sparkles className="w-4 h-4" />
                    <span>New: AI-Powered Flashcard Generation</span>
                </div>

                <h1 className="text-7xl font-bold tracking-tight mb-8 text-gray-900 leading-tight">
                    Study smarter, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                        remember everything.
                    </span>
                </h1>

                <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
                    Transform your PDFs into interactive study decks in seconds.
                    Our AI extracts the key concepts so you can focus on learning, not typing.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
                    <Link href="/dashboard">
                        <Button size="lg" className="rounded-full px-8 text-lg h-14 bg-gray-900 hover:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                            Start Learning Now <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                    <Link href="#features" className="text-sm font-semibold text-gray-600 hover:text-black transition-colors px-6 py-4">
                        How it works
                    </Link>
                </div>
            </main>

            {/* Features */}
            <section id="features" className="max-w-7xl mx-auto px-8 py-24">
                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<BookOpen className="w-6 h-6 text-indigo-600" />}
                        title="Instant PDF Parsing"
                        description="Upload any lecture note, textbook, or research paper. We handle the messy formatting for you."
                        delay={0}
                    />
                    <FeatureCard
                        icon={<Zap className="w-6 h-6 text-violet-600" />}
                        title="Smart Extraction"
                        description="Our AI identifies definitions, formulas, and key dates, creating cards that actually make sense."
                        delay={100}
                    />
                    <FeatureCard
                        icon={<Repeat className="w-6 h-6 text-fuchsia-600" />}
                        title="Spaced Repetition"
                        description="Built-in SM-2 algorithm schedules reviews at the perfect time to maximize your retention."
                        delay={200}
                    />
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
    return (
        <div
            className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
            <p className="text-gray-500 leading-relaxed">{description}</p>
        </div>
    );
}
