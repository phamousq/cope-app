import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  Circle,
  User,
  Stethoscope,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import type { LikelihoodOfCure } from '@/types';
import { useProviderData } from '@/contexts/ProviderDataContext';

type Timeframe = 'sixMonth' | 'oneYear' | 'twoYear' | 'fiveYear';

const timeframeLabels: Record<Timeframe, string> = {
  sixMonth: '6 Months',
  oneYear: '1 Year',
  twoYear: '2 Years',
  fiveYear: '5 Years',
};

const likelihoodColors: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  'Very unlikely (<1%)': { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800', bar: 'bg-red-500' },
  'Unlikely (<25%)': { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', bar: 'bg-orange-500' },
  'Possible (25-75%)': { bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800', bar: 'bg-yellow-500' },
  'Likely (>75%)': { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800', bar: 'bg-green-500' },
};

function getLikelihoodPercent(likelihood: LikelihoodOfCure | null | string): number {
  if (!likelihood) return 0;
  if (likelihood.includes('Very unlikely')) return 0.5;
  if (likelihood.includes('Unlikely')) return 12.5;
  if (likelihood.includes('Possible')) return 50;
  if (likelihood.includes('Likely')) return 87.5;
  return 0;
}

function SurvivalBar({ likelihood, label }: { likelihood: LikelihoodOfCure | null | string; label: string }) {
  const percent = getLikelihoodPercent(likelihood);
  const colors = likelihood ? likelihoodColors[likelihood] : { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500', border: 'border-slate-200 dark:border-slate-700', bar: 'bg-slate-300 dark:bg-slate-600' };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-base font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className={`text-sm font-semibold ${colors.text}`}>{likelihood || 'Not assessed'}</span>
      </div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function StatusCard({ label, complete }: { label: string; complete: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${complete ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
      {complete ? (
        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
      ) : (
        <Circle className="w-6 h-6 text-slate-400 dark:text-slate-500 flex-shrink-0" />
      )}
      <span className={`text-base font-medium ${complete ? 'text-green-700 dark:text-green-300' : 'text-slate-600 dark:text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}

function DiagnosisNarrative({ demographics, cancerDetails }: { demographics: { sex: string; ageGroup: string; ethnicity: string }; cancerDetails: { typeOfCancer: string; cancerStage: string; scientificName: string; whereSpread: string } }) {
  const hasData = demographics.ageGroup && cancerDetails.typeOfCancer;

  if (!hasData) {
    return (
      <div className="prose prose-lg dark:prose-invert max-w-none">
        <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed">
          No diagnosis data available yet. Please complete the provider assessment to see your personalized overview.
        </p>
      </div>
    );
  }

  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed">
        Based on your <strong className="text-orange-600 dark:text-orange-400">age group ({demographics.ageGroup})</strong> and{' '}
        <strong className="text-orange-600 dark:text-orange-400">cancer type ({cancerDetails.typeOfCancer})</strong>, here is your personalized overview:
      </p>
      <div className="mt-6 space-y-4 text-lg text-slate-600 dark:text-slate-400">
        <p>
          <strong className="text-slate-900 dark:text-slate-100">Your Cancer:</strong> {cancerDetails.typeOfCancer} {cancerDetails.scientificName ? `(${cancerDetails.scientificName})` : ''}
        </p>
        <p>
          <strong className="text-slate-900 dark:text-slate-100">Current Stage:</strong> {cancerDetails.cancerStage || 'Not specified'}
        </p>
        <p>
          <strong className="text-slate-900 dark:text-slate-100">Where It Has Spread:</strong> {cancerDetails.whereSpread || 'Not specified'}
        </p>
      </div>
    </div>
  );
}

function TreatmentCard({ treatmentPlan }: { treatmentPlan: { goals: string[]; treatments: string[]; response: string } }) {
  const [expanded, setExpanded] = useState(false);
  const hasData = treatmentPlan.goals.length > 0 || treatmentPlan.treatments.length > 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
            <Activity className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Treatment Plan</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {treatmentPlan.goals.length} goal{treatmentPlan.goals.length !== 1 ? 's' : ''} · {treatmentPlan.treatments.length} treatment{treatmentPlan.treatments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-6 h-6 text-slate-400" />
        ) : (
          <ChevronDown className="w-6 h-6 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-slate-100 dark:border-slate-700 pt-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Goals</h4>
            {hasData ? (
              <div className="flex flex-wrap gap-2">
                {treatmentPlan.goals.map((goal) => (
                  <span key={goal} className="px-4 py-2 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 rounded-full text-base font-medium">
                    {goal}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 italic">No goals specified</p>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Recommended Treatments</h4>
            {hasData ? (
              <div className="flex flex-wrap gap-2">
                {treatmentPlan.treatments.map((treatment) => (
                  <span key={treatment} className="px-4 py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-full text-base font-medium">
                    {treatment}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 italic">No treatments specified</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SurvivalCard({ survivalSources }: { survivalSources: Array<{ source: string; likelihoodOfCure: string; sixMonth: number; oneYear: number; twoYear: number; fiveYear: number }> }) {
  const [expanded, setExpanded] = useState(false);
  const primarySource = survivalSources[0];
  const hasData = primarySource && (primarySource.sixMonth > 0 || primarySource.oneYear > 0 || primarySource.twoYear > 0 || primarySource.fiveYear > 0);

  const getLikelihood = (value: number): LikelihoodOfCure | null => {
    if (value === 0) return null;
    if (value < 1) return 'Very unlikely (<1%)';
    if (value < 25) return 'Unlikely (<25%)';
    if (value <= 75) return 'Possible (25-75%)';
    return 'Likely (>75%)';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Survival Statistics</h3>
            <p className="text-slate-600 dark:text-slate-400">{primarySource?.source || 'No assessment yet'}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-6 h-6 text-slate-400" />
        ) : (
          <ChevronDown className="w-6 h-6 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-slate-100 dark:border-slate-700 pt-4 space-y-6">
          {hasData ? (
            <>
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-bold text-green-800 dark:text-green-300">With Treatment ({primarySource.source})</h4>
                </div>
                <div className="space-y-4">
                  <SurvivalBar label="6 Months" likelihood={getLikelihood(primarySource.sixMonth)} />
                  <SurvivalBar label="1 Year" likelihood={getLikelihood(primarySource.oneYear)} />
                  <SurvivalBar label="2 Years" likelihood={getLikelihood(primarySource.twoYear)} />
                  <SurvivalBar label="5 Years" likelihood={getLikelihood(primarySource.fiveYear)} />
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <h4 className="font-bold text-slate-700 dark:text-slate-300">Without Treatment (For Reference)</h4>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Survival estimates without treatment are generally lower. This is shown for reference only.
                </p>
              </div>
            </>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4 italic">
              No survival statistics available yet. Complete the provider assessment to see estimates.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function PatientView() {
  const { formData } = useProviderData();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { demographics, cancerDetails, treatmentPlan, prognosisData } = formData;

  // Check if forms have data
  const hasPatientData = !!(demographics.sex || demographics.ethnicity);
  const hasProviderData = !!(cancerDetails.typeOfCancer || treatmentPlan.goals.length > 0);
  const hasSurvivalData = prognosisData.survivalSources.some(s => s.sixMonth > 0 || s.oneYear > 0 || s.twoYear > 0 || s.fiveYear > 0);

  const allComplete = hasPatientData && hasProviderData && hasSurvivalData;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Your Cancer Consultation
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          A shared view for you and your care team to understand your diagnosis together.
        </p>
      </div>

      {/* Survey Status Tracker */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          Form Completion Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatusCard label="Patient Information" complete={hasPatientData} />
          <StatusCard label="Provider Assessment" complete={hasProviderData} />
        </div>
        {!allComplete && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="text-amber-700 dark:text-amber-300 text-center">
              Some information is still being completed. Your care team will update this view as assessments are finalized.
            </p>
          </div>
        )}
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Diagnosis Walkthrough */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Your Diagnosis</h2>
              <p className="text-slate-600 dark:text-slate-400">Understanding your cancer</p>
            </div>
          </div>
          <DiagnosisNarrative demographics={demographics} cancerDetails={cancerDetails} />
        </section>

        {/* Treatment Card */}
        <TreatmentCard treatmentPlan={treatmentPlan} />
      </div>

      {/* Survival Statistics - Full Width */}
      <section className="mb-8">
        <SurvivalCard survivalSources={prognosisData.survivalSources} />
      </section>

      {/* Key Insights */}
      <section className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-2xl border border-teal-200 dark:border-teal-800 p-6 mb-8">
        <h2 className="text-xl font-bold text-teal-800 dark:text-teal-200 mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          What This Means For You
        </h2>
        <div className="space-y-4 text-lg text-teal-700 dark:text-teal-300">
          <p>
            These statistics are based on research from large groups of patients with similar cancers. They represent averages — your individual experience may be different.
          </p>
          {treatmentPlan.treatments.length > 0 && treatmentPlan.goals.length > 0 && (
            <p>
              <strong>Your treatment plan</strong> combines {treatmentPlan.treatments.join(' and ')} to achieve your goals of {treatmentPlan.goals.join(' and ')}.
            </p>
          )}
          <p>
            Talk with your care team about any questions. This information is meant to support your conversation, not replace it.
          </p>
        </div>
      </section>

      {/* Provider View Toggle */}
      <section className="flex justify-center">
        <Link
          to="/provider"
          className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg"
        >
          <User className="w-6 h-6" />
          Switch to Provider View
          <ArrowRight className="w-6 h-6" />
        </Link>
      </section>

      {/* Disclaimer */}
      <footer className="mt-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This interface is for educational purposes and shared decision-making. All data shown is de-identified.
          Always consult with your healthcare provider for medical advice.
        </p>
      </footer>
    </main>
  );
}
