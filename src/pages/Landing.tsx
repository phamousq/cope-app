import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Users, Building2, Database, ArrowRight, Activity } from 'lucide-react';
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
          ? 'bg-gradient-to-r from-purple-600 to-teal-600 text-white shadow-lg shadow-purple-500/30' 
          : 'bg-white/20 backdrop-blur-sm border border-white/30 text-slate-800 hover:bg-white/30'}
        ${className}
      `}
      style={{
        background: isPrimary 
          ? `radial-gradient(circle at ${x}% ${y}%, rgba(168, 85, 247, 0.9) 0%, rgba(20, 184, 166, 0.9) 100%)`
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
      className="group relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:bg-white/20 hover:scale-105"
      style={{
        background: `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)`,
      }}
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-teal-500/20 flex items-center justify-center mb-4 group-hover:from-purple-500/30 group-hover:to-teal-500/30 transition-all">
        <Icon className="w-6 h-6 text-purple-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export function Landing() {
  return (
    <main className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100 via-teal-50 to-slate-100">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 -right-4 w-96 h-96 bg-teal-300/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            {/* Logo */}
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-teal-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
                Cope
              </span>
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Cancer Outcomes &amp;
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
                Prognosis Evaluation
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
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

      {/* Features Section */}
      <section className="bg-gradient-to-b from-slate-100/50 to-white py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
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

      {/* Stats Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-purple-600 to-teal-600 rounded-3xl p-8 sm:p-12 text-center">
            <div className="grid sm:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl sm:text-5xl font-bold text-white mb-2">50%</div>
                <div className="text-purple-100">Time Saved on Intake</div>
              </div>
              <div>
                <div className="text-4xl sm:text-5xl font-bold text-white mb-2">99.9%</div>
                <div className="text-purple-100">Uptime Guaranteed</div>
              </div>
              <div>
                <div className="text-4xl sm:text-5xl font-bold text-white mb-2">HIPAA</div>
                <div className="text-purple-100">Compliant Platform</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm">
          <p>Cope App — Cancer Outcomes &amp; Prognosis Evaluation</p>
          <p className="mt-1">Built with care for healthcare providers</p>
        </div>
      </footer>
    </main>
  );
}
