import { useState, useCallback } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import type {
  Demographics,
  CancerDetails,
  TreatmentPlan,
  PrognosisData,
  CancerStage,
  AgeGroup,
  TreatmentGoal,
  Treatment,
  LikelihoodOfCure,
} from '../types';

interface ProviderFormData {
  demographics: Demographics;
  cancerDetails: CancerDetails;
  treatmentPlan: TreatmentPlan;
  prognosisData: PrognosisData;
}

const SEX_OPTIONS = ['Male', 'Female', 'Other'] as const;
const AGE_GROUP_OPTIONS: AgeGroup[] = ['18-34', '35-49', '50-59', '60-69', '70-79', '80-90'];
const CANCER_STAGE_OPTIONS: CancerStage[] = [
  'Stage 1 - Localized',
  'Stage 2 - Localized',
  'Stage 3 - Regional',
  'Stage 4 - Metastatic',
];
const TREATMENT_GOALS: TreatmentGoal[] = [
  'Cure',
  'Remission',
  'Better quality of life',
  'Longer life',
  'Comfort',
];
const TREATMENTS: Treatment[] = [
  'Radiation',
  'Surgery',
  'Chemotherapy',
  'Immunotherapy',
  'Targeted Therapy',
  'Hormone Therapy',
  'Other',
];
const LIKELIHOOD_OPTIONS: LikelihoodOfCure[] = [
  'Very unlikely (<1%)',
  'Unlikely (<25%)',
  'Possible (25-75%)',
  'Likely (>75%)',
];

const initialFormData: ProviderFormData = {
  demographics: {
    sex: 'Male',
    ageGroup: '50-59',
    ethnicity: '',
  },
  cancerDetails: {
    typeOfCancer: '',
    cancerStage: 'Stage 4 - Metastatic',
    scientificName: '',
    whereSpread: '',
  },
  treatmentPlan: {
    goals: [],
    treatments: [],
  },
  prognosisData: {
    survivalSources: [],
    additionalContext: '',
  },
};

interface JsonInspectorProps {
  data: ProviderFormData;
}

function JsonInspector({ data }: JsonInspectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 dark:bg-slate-950 border-t border-slate-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-slate-300 hover:text-slate-100 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-mono">
          <ClipboardList className="w-4 h-4" />
          JSONL Data Inspector
        </span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        )}
      </button>
      {isExpanded && (
        <pre className="px-4 pb-4 text-xs text-green-400 font-mono overflow-auto max-h-64">
          {jsonString}
        </pre>
      )}
    </div>
  );
}

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  className?: string;
}

function SelectInput({ label, value, onChange, options, className = '' }: SelectInputProps) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent"
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function TextInput({ label, value, onChange, placeholder, className = '' }: TextInputProps) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent"
      />
    </div>
  );
}

interface MultiSelectProps {
  label: string;
  selected: string[];
  onChange: (selected: string[]) => void;
  options: readonly string[];
  className?: string;
}

function MultiSelect({ label, selected, onChange, options, className = '' }: MultiSelectProps) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selected.includes(opt)
                ? 'bg-teal-600 text-white dark:bg-teal-500'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

interface LikelihoodInputsProps {
  label: string;
  values: Record<string, LikelihoodOfCure | null>;
  onChange: (key: string, value: LikelihoodOfCure | null) => void;
}

function LikelihoodInputs({ label, values, onChange }: LikelihoodInputsProps) {
  const timeframes = ['sixMonth', 'oneYear', 'twoYear', 'fiveYear'] as const;
  const labels: Record<string, string> = {
    sixMonth: '6-Month',
    oneYear: '1-Year',
    twoYear: '2-Year',
    fiveYear: '5-Year',
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
        {label}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {timeframes.map((tf) => (
          <SelectInput
            key={tf}
            label={labels[tf]}
            value={values[tf] || ''}
            onChange={(v) => onChange(tf, v as LikelihoodOfCure | null)}
            options={LIKELIHOOD_OPTIONS}
          />
        ))}
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

function SectionCard({ title, children }: SectionCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function ProviderView() {
  const [formData, setFormData] = useState<ProviderFormData>(initialFormData);

  const updateDemographics = useCallback(
    <K extends keyof Demographics>(key: K, value: Demographics[K]) => {
      setFormData((prev) => ({
        ...prev,
        demographics: { ...prev.demographics, [key]: value },
      }));
    },
    []
  );

  const updateCancerDetails = useCallback(
    <K extends keyof CancerDetails>(key: K, value: CancerDetails[K]) => {
      setFormData((prev) => ({
        ...prev,
        cancerDetails: { ...prev.cancerDetails, [key]: value },
      }));
    },
    []
  );

  const updateTreatmentGoals = useCallback((goals: TreatmentGoal[]) => {
    setFormData((prev) => ({
      ...prev,
      treatmentPlan: { ...prev.treatmentPlan, goals },
    }));
  }, []);

  const updateTreatmentList = useCallback((treatments: Treatment[]) => {
    setFormData((prev) => ({
      ...prev,
      treatmentPlan: { ...prev.treatmentPlan, treatments },
    }));
  }, []);

  const updatePrognosisContext = useCallback((additionalContext: string) => {
    setFormData((prev) => ({
      ...prev,
      prognosisData: { ...prev.prognosisData, additionalContext },
    }));
  }, []);

  const survivalSources = formData.prognosisData.survivalSources.length > 0
    ? formData.prognosisData.survivalSources
    : [{ source: 'Provider Estimate', likelihoodOfCure: 'Possible (25-75%)', sixMonth: 0, oneYear: 0, twoYear: 0, fiveYear: 0 }];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Clinical Prognosis Review
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                No PII Collected — Anonymous Clinical Data
              </p>
            </div>
            <Link
              to="/voice"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Transcription
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Demographics Section */}
        <SectionCard title="Patient Demographics">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectInput
              label="Sex at Birth"
              value={formData.demographics.sex}
              onChange={(v) => updateDemographics('sex', v as Demographics['sex'])}
              options={SEX_OPTIONS}
            />
            <SelectInput
              label="Age Group"
              value={formData.demographics.ageGroup}
              onChange={(v) => updateDemographics('ageGroup', v as AgeGroup)}
              options={AGE_GROUP_OPTIONS}
            />
            <TextInput
              label="Ethnicity / Race"
              value={formData.demographics.ethnicity}
              onChange={(v) => updateDemographics('ethnicity', v)}
              placeholder="e.g., Hispanic/Latino, Non-Hispanic Black..."
            />
          </div>
        </SectionCard>

        {/* Cancer Details Section */}
        <SectionCard title="Cancer Diagnosis">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Primary Cancer Type"
              value={formData.cancerDetails.typeOfCancer}
              onChange={(v) => updateCancerDetails('typeOfCancer', v)}
              placeholder="e.g., Non-Small Cell Lung Cancer"
              className="sm:col-span-2"
            />
            <SelectInput
              label="Cancer Stage"
              value={formData.cancerDetails.cancerStage}
              onChange={(v) => updateCancerDetails('cancerStage', v as CancerStage)}
              options={CANCER_STAGE_OPTIONS}
            />
            <TextInput
              label="Histology / Scientific Name"
              value={formData.cancerDetails.scientificName}
              onChange={(v) => updateCancerDetails('scientificName', v)}
              placeholder="e.g., Adenocarcinoma, Squamous cell carcinoma"
            />
            <TextInput
              label="Metastatic Spread"
              value={formData.cancerDetails.whereSpread}
              onChange={(v) => updateCancerDetails('whereSpread', v)}
              placeholder="e.g., Bones, liver, lungs"
              className="sm:col-span-2"
            />
          </div>
        </SectionCard>

        {/* Treatment Plan Section */}
        <SectionCard title="Treatment Plan">
          <div className="space-y-4">
            <MultiSelect
              label="Treatment Goals"
              selected={formData.treatmentPlan.goals}
              onChange={(selected) => updateTreatmentGoals(selected as TreatmentGoal[])}
              options={TREATMENT_GOALS}
            />
            <MultiSelect
              label="Planned Treatments"
              selected={formData.treatmentPlan.treatments}
              onChange={(selected) => updateTreatmentList(selected as Treatment[])}
              options={TREATMENTS}
            />
          </div>
        </SectionCard>

        {/* Survival Estimates Section */}
        <SectionCard title="Survival Estimates">
          <LikelihoodInputs
            label="Provider Estimate — Likelihood of Survival"
            values={{
              sixMonth: survivalSources[0]?.sixMonth ? 'Possible (25-75%)' : null,
              oneYear: survivalSources[0]?.oneYear ? 'Possible (25-75%)' : null,
              twoYear: survivalSources[0]?.twoYear ? 'Possible (25-75%)' : null,
              fiveYear: survivalSources[0]?.fiveYear ? 'Possible (25-75%)' : null,
            }}
            onChange={() => {
              // Provider estimates are manual — could be expanded
            }}
          />
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
              Additional Clinical Context
            </label>
            <textarea
              value={formData.prognosisData.additionalContext}
              onChange={(e) => updatePrognosisContext(e.target.value)}
              placeholder="Relevant comorbidities, biomarkers, genetic markers, clinical notes..."
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent resize-none"
            />
          </div>
        </SectionCard>
      </main>

      {/* JSONL Inspector */}
      <JsonInspector data={formData} />
    </div>
  );
}
