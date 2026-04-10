import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Users, Building2, Database, ArrowRight, Activity, Sun, Moon } from 'lucide-react';
import { useCursorPosition } from '@/hooks/useCursorPosition';

function GradientButton({ 
  to, 
  children, 
  variant = 'primary',
  className = '' 
}: { 
  to: string; 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary';
  className?: string;
}) {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const { x, y } = useCursorPosition(buttonRef);
  
  const isPrimary = variant === 'primary';
  
  return (
    <Link
      ref={buttonRef}
      to={to}
      className={`
        relative overflow-hidden rounded-xl px-8 py-4 font-semibold text-lg
        transition-all duration-300 ease-out
        ${isPrimary 
          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50' 
          : 'bg-white/20 dark:bg-slate-800/30 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 text-slate-800 dark:text-slate-100 hover:bg-white/30 dark:hover:bg-slate-800/50'}
        ${className}
      `}
      style={{
        background: isPrimary 
          ? `radial-gradient(circle at ${x}% ${y}%, rgba(249, 115, 22, 1) 0%, rgba(245, 158, 11, 1) 100%)`
          : undefined,
      }}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </Link>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: typeof Mic; 
  title: string; 
  description: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { x, y } = useCursorPosition(cardRef);
  
  return (
    <div
      ref={cardRef}
      className="group relative bg-orange-50/50 dark:bg-slate-800/50 backdrop-blur-md border border-orange-200/50 dark:border-slate-700/50 rounded-2xl p-6 transition-all duration-300 hover:bg-orange-100/60 dark:hover:bg-slate-700/60 hover:scale-105"
      style={{
        background: `radial-gradient(circle at ${x}% ${y}%, rgba(249, 115, 22, 0.15) 0%, transparent 70%)`,
      }}
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center mb-4 group-hover:from-orange-500/30 group-hover:to-amber-500/30 transition-all">
        <Icon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export function Landing() {
  return (
    <main className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated gradient background - orange/amber theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-orange-300/30 dark:bg-orange-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 -right-4 w-96 h-96 bg-amber-300/30 dark:bg-amber-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-200/20 dark:bg-yellow-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            {/* Logo */}
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30 dark:shadow-orange-500/20">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
                COPE
              </span>
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6 leading-tight">
              Cancer Outcomes &amp;
              <br />
              <span className="bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
                Prognosis Evaluation
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Streamline clinical data collection with voice-powered patient intake. 
              Focus on patients, not paperwork.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <GradientButton to="/voice">
                <Mic className="w-5 h-5" />
                Start Voice Input
              </GradientButton>
              <GradientButton to="/patient" variant="secondary">
                Patient View
                <ArrowRight className="w-5 h-5" />
              </GradientButton>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - transparent background */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Powerful features designed for modern oncology practices
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Mic}
              title="Voice Input"
              description="Record patient responses with our voice-powered intake system"
            />
            <FeatureCard
              icon={Users}
              title="Patient View"
              description="Access and manage patient records securely"
            />
            <FeatureCard
              icon={Building2}
              title="Provider Portal"
              description="Dedicated interface for healthcare providers"
            />
            <FeatureCard
              icon={Database}
              title="Backend"
              description="Robust data management and export capabilities"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 dark:text-slate-400 text-sm">
          <p>COPE App — Cancer Outcomes &amp; Prognosis Evaluation</p>
          <p className="mt-1">Built with care for healthcare providers</p>
        </div>
      </footer>
    </main>
  );
}
