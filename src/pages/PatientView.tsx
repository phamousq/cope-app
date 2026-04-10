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
import type {
  PatientFormData,
  Demographics,
  CancerDetails,
  TreatmentPlan,
  LikelihoodExpectations,
  SurvivalWithoutTreatment,
  LikelihoodOfCure,
} from '@/types';

// Mock data structure for demo (in production, this comes from Provider View JSON)
interface ConsultationData {
  demographics: Demographics;
  cancerDetails: CancerDetails;
  treatmentPlan: TreatmentPlan;
  likelihoodExpectations: LikelihoodExpectations;
  survivalWithoutTreatment: SurvivalWithoutTreatment;
  patientFormComplete: boolean;
  providerFormComplete: boolean;
}

const mockData: ConsultationData = {
  demographics: {
    sex: 'Male',
    ageGroup: '60-69',
    ethnicity: 'Not specified',
  },
  cancerDetails: {
    typeOfCancer: 'Non-Small Cell Lung Cancer',
    cancerStage: 'Stage 4 - Metastatic',
    scientificName: 'Adenocarcinoma',
    whereSpread: 'Lungs, Liver, and Bones',
  },
  treatmentPlan: {
    goals: ['Better quality of life', 'Longer life'],
    treatments: ['Chemotherapy', 'Immunotherapy'],
  },
  likelihoodExpectations: {
    sixMonth: 'Likely (>75%)',
    oneYear: 'Possible (25-75%)',
    twoYear: 'Unlikely (<25%)',
    fiveYear: 'Very unlikely (<1%)',
  },
  survivalWithoutTreatment: {
    sixMonth: 'Unlikely (<25%)',
    oneYear: 'Very unlikely (<1%)',
    twoYear: null,
    fiveYear: null,
  },
  patientFormComplete: true,
  providerFormComplete: true,
};

type Timeframe = 'sixMonth' | 'oneYear' | 'twoYear' | 'fiveYear';

const timeframeLabels: Record<Timeframe, string> = {
  sixMonth: '6 Months',
  oneYear: '1 Year',
  twoYear: '2 Years',
  fiveYear: '5 Years',
};

const likelihoodColors: Record<LikelihoodOfCure, { bg: string; text: string; border: string; bar: string }> = {
  'Very unlikely (<1%)': { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800', bar: 'bg-red-500' },
  'Unlikely (<25%)': { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800', bar: 'bg-orange-500' },
  'Possible (25-75%)': { bg: 'bg-yellow-50 dark:bg-yellow-950/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800', bar: 'bg-yellow-500' },
  'Likely (>75%)': { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800', bar: 'bg-green-500' },
};

function getLikelihoodPercent(likelihood: LikelihoodOfCure | null): number {
  if (!likelihood) return 0;
  if (likelihood.includes('Very unlikely')) return 0.5;
  if (likelihood.includes('Unlikely')) return 12.5;
  if (likelihood.includes('Possible')) return 50;
  if (likelihood.includes('Likely')) return 87.5;
  return 0;
}

function SurvivalBar({ likelihood, label }: { likelihood: LikelihoodOfCure | null; label: string }) {
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

function DiagnosisNarrative({ data }: { data: ConsultationData }) {
  const { demographics, cancerDetails } = data;

  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <p className="text-xl text-slate-700 dark:text-slate-300 leading-relaxed">
        Based on your <strong className="text-orange-600 dark:text-orange-400">age group ({demographics.ageGroup})</strong> and{' '}
        <strong className="text-orange-600 dark:text-orange-400">cancer type ({cancerDetails.typeOfCancer})</strong>, here is your personalized overview:
      </p>
      <div className="mt-6 space-y-4 text-lg text-slate-600 dark:text-slate-400">
        <p>
          <strong className="text-slate-900 dark:text-slate-100">Your Cancer:</strong> {cancerDetails.typeOfCancer} ({cancerDetails.scientificName})
        </p>
        <p>
          <strong className="text-slate-900 dark:text-slate-100">Current Stage:</strong> {cancerDetails.cancerStage}
        </p>
        <p>
          <strong className="text-slate-900 dark:text-slate-100">Where It Has Spread:</strong> {cancerDetails.whereSpread || 'Not specified'}
        </p>
      </div>
    </div>
  );
}

function TreatmentCard({ data }: { data: ConsultationData }) {
  const [expanded, setExpanded] = useState(false);
  const { treatmentPlan } = data;

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
            <div className="flex flex-wrap gap-2">
              {treatmentPlan.goals.map((goal) => (
                <span key={goal} className="px-4 py-2 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 rounded-full text-base font-medium">
                  {goal}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Recommended Treatments</h4>
            <div className="flex flex-wrap gap-2">
              {treatmentPlan.treatments.map((treatment) => (
                <span key={treatment} className="px-4 py-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 rounded-full text-base font-medium">
                  {treatment}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SurvivalCard({ data }: { data: ConsultationData }) {
  const [expanded, setExpanded] = useState(false);
  const { likelihoodExpectations, survivalWithoutTreatment } = data;

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
            <p className="text-slate-600 dark:text-slate-400">With vs. without treatment</p>
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
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h4 className="font-bold text-green-800 dark:text-green-300">With Treatment</h4>
            </div>
            <div className="space-y-4">
              {(Object.keys(timeframeLabels) as Timeframe[]).map((tf) => (
                <SurvivalBar key={tf} label={timeframeLabels[tf]} likelihood={likelihoodExpectations[tf]} />
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300">Without Treatment (For Reference)</h4>
            </div>
            <div className="space-y-4">
              {(Object.keys(timeframeLabels) as Timeframe[]).map((tf) => (
                <SurvivalBar key={tf} label={timeframeLabels[tf]} likelihood={survivalWithoutTreatment[tf]} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PatientView() {
  const [data] = useState<ConsultationData>(mockData); // In production, load from Provider View JSON
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { patientFormComplete, providerFormComplete } = data;
  const allComplete = patientFormComplete && providerFormComplete;

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
          <StatusCard label="Patient Information" complete={patientFormComplete} />
          <StatusCard label="Provider Assessment" complete={providerFormComplete} />
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
          <DiagnosisNarrative data={data} />
        </section>

        {/* Treatment Card */}
        <TreatmentCard data={data} />
      </div>

      {/* Survival Statistics - Full Width */}
      <section className="mb-8">
        <SurvivalCard data={data} />
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
          <p>
            <strong>Your treatment plan</strong> combines {data.treatmentPlan.treatments.join(' and ')} to achieve your goals of {data.treatmentPlan.goals.join(' and ')}.
          </p>
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
