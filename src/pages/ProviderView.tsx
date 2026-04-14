import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, ClipboardList, Brain, Loader2, AlertCircle, ExternalLink, HelpCircle, ChevronRight } from 'lucide-react';
import type {
  Demographics,
  CancerDetails,
  TreatmentPlan,
  PrognosisData,
  TreatmentGoal,
  Treatment,
  LikelihoodOfCure,
} from '../types';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { exportToCancerSurvivalRates } from '@/utils/cancerSurvivalRatesExport';
import { useProviderData, type ProviderFormData as ProviderFormDataType } from '@/contexts/ProviderDataContext';

// TNM Staging options (for hover tooltips)
const T_OPTIONS = ['TX', 'T0', 'Tis', 'T1', 'T1a', 'T1b', 'T2', 'T3', 'T4', 'T4a', 'T4b'];
const N_OPTIONS = ['NX', 'N0', 'N1', 'N1a', 'N1b', 'N1c', 'N2', 'N2a', 'N2b', 'N3'];
const M_OPTIONS = ['MX', 'M0', 'M1', 'M1a', 'M1b', 'M1c'];

// Patient-specific factors (standardized scales - keep as selects)
const ECOG_OPTIONS = ['', '0 - Fully active', '1 - Restricted strenuous activity', '2 - Ambulatory but unable to work', '3 - Limited self-care', '4 - Completely disabled'];
const CCI_OPTIONS = ['', '0', '1', '2', '3', '4', '5+'];
const MGPS_OPTIONS = ['', '0 (Low risk)', '1 (Intermediate)', '2 (High risk)'];

// SEER Registry options
const HISTOLOGIC_GRADE_OPTIONS = ['', 'Grade I (Well differentiated)', 'Grade II (Moderately differentiated)', 'Grade III (Poorly differentiated)', 'Grade IV (Undifferentiated)', 'Not applicable'];
const MARITAL_STATUS_OPTIONS = ['', 'Single (never married)', 'Married', 'Separated', 'Divorced', 'Widowed', 'Unmarried or domestic partner', 'Unknown'];
const SMOKING_HISTORY_OPTIONS = ['', 'Never smoker', 'Former smoker', 'Current smoker', 'Unknown'];
const URBANICITY_OPTIONS = ['', '1 - Metro counties (pop ≥1 million)', '2 - Metro counties (pop <1 million)', '3 - Urban counties', '4 - Less urban counties', '5 - Completely rural counties', 'Unknown'];

interface SeerRegistryData {
  histologicGrade: string;
  maritalStatus: string;
  countyOfResidence: string;
  urbanicity: string;
  smokingHistory: string;
  yearOfDiagnosis: string;
}

interface ClinicalMolecularData {
  molecularGenomicMarkers: string;
  nlr: string;
  cea: string;
  ca125: string;
  psa: string;
  psaDoublingTime: string;
  ldh: string;
  treatmentResponse: string;
  cellDiff: string;
}

interface ProviderFormData {
  demographics: Demographics;
  cancerDetails: CancerDetails;
  treatmentPlan: TreatmentPlan;
  prognosisData: PrognosisData;
  clinicalMolecular: ClinicalMolecularData;
  patientFactors: {
    ecogStatus: string;
    charlsonComorbidityIndex: string;
    mgps: string;
  };
  seerRegistry: SeerRegistryData;
  tStage: string;
  nStage: string;
  mStage: string;
  // Cancer diagnosis row
  cancerLocation: string;
  cancerSize: string;
  lymphNodes: string;
  // Numeric age (separate from Demographics.ageGroup for raw number input)
  age: string;
}

const SEX_OPTIONS = ['Male', 'Female', 'Other'] as const;
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
const CELL_DIFF_OPTIONS = ['', 'Well differentiated (Grade I)', 'Moderately differentiated (Grade II)', 'Poorly differentiated (Grade III)', 'Undifferentiated (Grade IV)'];

const LIKELIHOOD_OPTIONS: LikelihoodOfCure[] = [
  'Very unlikely (<1%)',
  'Unlikely (<25%)',
  'Possible (25-75%)',
  'Likely (>75%)',
];

// Helper to convert numeric percentage to LikelihoodOfCure
function numericToLikelihood(value: number): LikelihoodOfCure | null {
  if (value === 0) return null;
  if (value < 1) return 'Very unlikely (<1%)';
  if (value < 25) return 'Unlikely (<25%)';
  if (value <= 75) return 'Possible (25-75%)';
  return 'Likely (>75%)';
}

// Helper to convert LikelihoodOfCure to numeric percentage (midpoint of range)
function likelihoodToNumeric(likelihood: LikelihoodOfCure | null): number {
  if (!likelihood) return 0;
  if (likelihood === 'Very unlikely (<1%)') return 0.5;
  if (likelihood === 'Unlikely (<25%)') return 12.5;
  if (likelihood === 'Possible (25-75%)') return 50;
  if (likelihood === 'Likely (>75%)') return 87.5;
  return 0;
}

const initialFormData: ProviderFormData = {
  demographics: {
    sex: 'Male',
    ageGroup: '50-59',
    ethnicity: '',
    dateOfDiagnosis: '',
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
  clinicalMolecular: {
    molecularGenomicMarkers: '',
    nlr: '',
    cea: '',
    ca125: '',
    psa: '',
    psaDoublingTime: '',
    ldh: '',
    treatmentResponse: '',
    cellDiff: '',
  },
  patientFactors: {
    ecogStatus: '',
    charlsonComorbidityIndex: '',
    mgps: '',
  },
  seerRegistry: {
    histologicGrade: '',
    maritalStatus: '',
    countyOfResidence: '',
    urbanicity: '',
    smokingHistory: '',
    yearOfDiagnosis: '',
  },
  tStage: '',
  nStage: '',
  mStage: '',
  cancerLocation: '',
  cancerSize: '',
  lymphNodes: '',
  age: '',
};

interface JsonInspectorProps {
  data: ProviderFormDataType;
}

function JsonInspector({ data }: JsonInspectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  // Build JSON output with today field
  const jsonOutput = JSON.stringify({ ...data, today }, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers or insecure contexts
      const textArea = document.createElement('textarea');
      textArea.value = jsonOutput;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy also failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className={"fixed bottom-0 left-0 right-0 bg-slate-900 dark:bg-slate-950 border-t border-slate-700 z-50 transition-all duration-200 " + (isExpanded ? "max-h-[70vh]" : "")}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-slate-300 hover:text-slate-100 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-mono">
          <ClipboardList className="w-4 h-4" />
          JSONL Data Inspector
        </span>
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>
      {isExpanded && (
        <div className="relative">
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
          >
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
          <pre className="px-4 pb-4 pt-2 text-xs text-green-400 font-mono overflow-auto max-h-[calc(70vh-48px)]">
            {jsonOutput}
          </pre>
        </div>
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
  helpUrl?: string;
  required?: boolean;
}

function SelectInput({ label, value, onChange, options, className = '', helpUrl, required }: SelectInputProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1 mb-1">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {helpUrl && (
          <a
            href={helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            title="View reference"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent ${required && !value ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
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
  type?: string;
  helpUrl?: string;
  tooltip?: string;
  required?: boolean;
}

function TextInput({ label, value, onChange, placeholder, className = '', type = 'text', helpUrl, tooltip, required }: TextInputProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1 mb-1">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {helpUrl && (
          <a
            href={helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            title="View reference"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {tooltip && (
          <span className="group relative">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <div className="hidden group-hover:block absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-slate-100 text-xs rounded whitespace-nowrap">
              {tooltip}
            </div>
          </span>
        )}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent ${required && !value ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
      />
    </div>
  );
}

interface TNMInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
  placeholder?: string;
}

function TNMInput({ label, value, onChange, options, className = '', placeholder }: TNMInputProps) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
        {label}
      </label>
      <div className="relative group">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder={placeholder ?? 'T1, T2, N0...'}
          className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent"
        />
        <div className="hidden group-hover:block absolute z-10 top-full left-0 mt-1 px-3 py-2 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-lg min-w-[180px]">
          <p className="font-medium text-slate-300 mb-1">Valid options:</p>
          <div className="flex flex-wrap gap-1">
            {options.map((opt) => (
              <span key={opt} className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-200 font-mono">{opt}</span>
            ))}
          </div>
        </div>
      </div>
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

// Compute overall stage from TNM (for AI analysis, not shown as a field)
function computeOverallStage(t: string, n: string, m: string): string {
  if (!t && !n && !m) return '';
  if (m && m !== 'M0' && m !== 'MX') return 'Stage 4 - Metastatic';
  if (n && (n === 'N2' || n === 'N3')) return 'Stage 3 - Regional';
  if (t && (t === 'T3' || t === 'T4')) return 'Stage 3 - Regional';
  if (t && (t === 'T1b' || t === 'T2')) return 'Stage 2 - Localized';
  if (t && t.startsWith('T1')) return 'Stage 1 - Localized';
  return '';
}

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

export function ProviderView() {
  const { formData, setFormData } = useProviderData();
  const [csrJson, setCsrJson] = useState<string | null>(null);
  const [csrWarnings, setCsrWarnings] = useState<string[]>([]);
  const { analysis, isLoading, error, analyze, clearAnalysis } = useAIAnalysis({
    apiKey: OPENROUTER_API_KEY,
    model: 'openai/gpt-oss-120b:free',
  });

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

  const updateClinicalMolecular = useCallback(<K extends keyof ClinicalMolecularData>(key: K, value: ClinicalMolecularData[K]) => {
    setFormData((prev) => ({
      ...prev,
      clinicalMolecular: { ...prev.clinicalMolecular, [key]: value },
    }));
  }, []);

  const updatePatientFactors = useCallback(<K extends keyof ProviderFormData['patientFactors']>(key: K, value: ProviderFormData['patientFactors'][K]) => {
    setFormData((prev) => ({
      ...prev,
      patientFactors: { ...prev.patientFactors, [key]: value },
    }));
  }, []);

  const updateSeerRegistry = useCallback(<K extends keyof SeerRegistryData>(key: K, value: SeerRegistryData[K]) => {
    setFormData((prev) => ({
      ...prev,
      seerRegistry: { ...prev.seerRegistry, [key]: value },
    }));
  }, []);

  const updateSurvivalEstimate = useCallback((timeframe: string, likelihood: LikelihoodOfCure | null) => {
    const numericValue = likelihoodToNumeric(likelihood);
    setFormData((prev) => {
      const currentSources = prev.prognosisData.survivalSources;
      const updatedSources = [...currentSources];
      if (updatedSources.length === 0) {
        // Create default source if none exists
        updatedSources.push({
          source: 'Provider Estimate',
          likelihoodOfCure: likelihood || 'Possible (25-75%)',
          sixMonth: 0,
          oneYear: 0,
          twoYear: 0,
          fiveYear: 0,
        });
      }
      updatedSources[0] = {
        ...updatedSources[0],
        [timeframe]: numericValue,
        likelihoodOfCure: likelihood || updatedSources[0].likelihoodOfCure,
      };
      return {
        ...prev,
        prognosisData: { ...prev.prognosisData, survivalSources: updatedSources },
      };
    });
  }, []);

  const survivalSources = formData.prognosisData.survivalSources.length > 0
    ? formData.prognosisData.survivalSources
    : [{ source: 'Provider Estimate', likelihoodOfCure: 'Possible (25-75%)', sixMonth: 0, oneYear: 0, twoYear: 0, fiveYear: 0 }];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
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
        {/* 1. PATIENT DEMOGRAPHICS */}
        <SectionCard title="Patient Demographics">
          <div className="space-y-4">
            {/* Basic demographics - Sex, Age, Ethnicity, Date of Diagnosis */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SelectInput
                label="Sex"
                value={formData.demographics.sex}
                onChange={(v) => updateDemographics('sex', v as Demographics['sex'])}
                options={SEX_OPTIONS}
                required
              />
              <div className="flex flex-col">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Age<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => {
                    const rawAge = e.target.value;
                    setFormData((prev) => ({ ...prev, age: rawAge }));
                    const age = parseInt(rawAge);
                    if (isNaN(age) || rawAge === '') {
                      updateDemographics('ageGroup', '');
                    } else if (age < 35) updateDemographics('ageGroup', '18-34');
                    else if (age < 50) updateDemographics('ageGroup', '35-49');
                    else if (age < 60) updateDemographics('ageGroup', '50-59');
                    else if (age < 70) updateDemographics('ageGroup', '60-69');
                    else if (age < 80) updateDemographics('ageGroup', '70-79');
                    else updateDemographics('ageGroup', '80-90');
                  }}
                  placeholder="e.g., 55"
                  min="18"
                  max="120"
                  required
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent ${!formData.age ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                />
              </div>
              <TextInput
                label="Ethnicity / Race"
                value={formData.demographics.ethnicity}
                onChange={(v) => updateDemographics('ethnicity', v)}
                placeholder="e.g., Non-Hispanic White"
                required
              />
              <div className="flex flex-col">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Date of Diagnosis
                </label>
                <input
                  type="date"
                  value={formData.demographics.dateOfDiagnosis}
                  onChange={(e) => updateDemographics('dateOfDiagnosis', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Performance status & comorbidities with links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SelectInput
                label="ECOG Performance Status"
                value={formData.patientFactors.ecogStatus}
                onChange={(v) => updatePatientFactors('ecogStatus', v)}
                options={ECOG_OPTIONS}
                helpUrl="https://www.mdcalc.com/calc/3170/eastern-cooperative-oncology-group-ecog-performance-status"
              />
              <SelectInput
                label="Charlson Comorbidity Index"
                value={formData.patientFactors.charlsonComorbidityIndex}
                onChange={(v) => updatePatientFactors('charlsonComorbidityIndex', v)}
                options={CCI_OPTIONS}
                helpUrl="https://www.mdcalc.com/calc/3941/charlson-comorbidity-index"
              />
              <SelectInput
                label="mGPS (Glasgow Score)"
                value={formData.patientFactors.mgps}
                onChange={(v) => updatePatientFactors('mgps', v)}
                options={MGPS_OPTIONS}
                helpUrl="https://www.mdcalc.com/calc/3312/modified-glasgow-prognostic-score-mgps-cancer-outcomes"
              />
            </div>
          </div>
        </SectionCard>

        {/* 2. CANCER DIAGNOSIS */}
        <SectionCard title="Cancer Diagnosis">
          <div className="space-y-4">
            {/* Primary cancer type + site + size on same row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextInput
                label="Primary Cancer Type / Histology"
                value={formData.cancerDetails.scientificName || formData.cancerDetails.typeOfCancer}
                onChange={(v) => {
                  updateCancerDetails('typeOfCancer', v);
                  updateCancerDetails('scientificName', v);
                }}
                placeholder="Non-Small Cell Lung Cancer..."
                tooltip="Enter the primary cancer type or histology. This is used as the cancer type for prognosis estimation."
              />
              <TextInput
                label="Primary Site / Location"
                value={formData.cancerLocation}
                onChange={(v) => setFormData((prev) => ({ ...prev, cancerLocation: v }))}
                placeholder="e.g., Right upper lobe"
              />
              <TextInput
                label="Size (mm)"
                value={formData.cancerSize}
                onChange={(v) => setFormData((prev) => ({ ...prev, cancerSize: v }))}
                placeholder="e.g., 45"
                type="number"
              />
            </div>

            {/* TNM Staging - free text inputs with hover showing options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TNMInput
                label="T - Primary Tumor"
                value={formData.tStage}
                onChange={(v) => setFormData((prev) => ({ ...prev, tStage: v }))}
                options={T_OPTIONS}
                placeholder="T1, T2, T3, T4..."
              />
              <TNMInput
                label="N - Regional Nodes"
                value={formData.nStage}
                onChange={(v) => setFormData((prev) => ({ ...prev, nStage: v }))}
                options={N_OPTIONS}
                placeholder="N0, N1, N2, N3..."
              />
              <TNMInput
                label="M - Distant Metastasis"
                value={formData.mStage}
                onChange={(v) => setFormData((prev) => ({ ...prev, mStage: v }))}
                options={M_OPTIONS}
                placeholder="M0, M1..."
              />
            </div>

            {/* Metastatic spread */}
            <TextInput
              label="Metastatic Spread"
              value={formData.cancerDetails.whereSpread}
              onChange={(v) => updateCancerDetails('whereSpread', v)}
              placeholder="e.g., Bones, liver, lungs — or 'Localized'"
            />

            {/* Lymph Nodes */}
            <TextInput
              label="Lymph Nodes Involved"
              value={formData.lymphNodes}
              onChange={(v) => setFormData((prev) => ({ ...prev, lymphNodes: v }))}
              placeholder="e.g., 0, 2, 5+"
            />
          </div>
        </SectionCard>

        {/* 3. MOLECULAR & GENOMIC MARKERS */}
        <SectionCard title="Molecular & Genomic Markers">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Biomarker & Mutation Results
              </label>
              <textarea
                value={formData.clinicalMolecular.molecularGenomicMarkers}
                onChange={(e) => updateClinicalMolecular('molecularGenomicMarkers', e.target.value)}
                placeholder="e.g., MSI-H, KRAS G12C mutant, BRAF wild-type, EGFR exon 19 deletion, BRCA1/2 negative..."
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Cell Differentiation (Grade)
              </label>
              <SelectInput
                label=""
                value={formData.clinicalMolecular.cellDiff || ''}
                onChange={(v) => updateClinicalMolecular('cellDiff', v)}
                options={CELL_DIFF_OPTIONS}
              />
            </div>
          </div>
        </SectionCard>

        {/* 4. BIOCHEMICAL & TUMOR MARKERS */}
        <SectionCard title="Biochemical & Tumor Markers">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <TextInput
              label="NLR (Neutrophil:Lymphocyte)"
              value={formData.clinicalMolecular.nlr}
              onChange={(v) => updateClinicalMolecular('nlr', v)}
              placeholder="e.g., 3.5"
              helpUrl="https://www.mdcalc.com/neutrophil-lymphocyte-ratio-nlr"
            />
            <TextInput
              label="CEA (ng/mL)"
              value={formData.clinicalMolecular.cea}
              onChange={(v) => updateClinicalMolecular('cea', v)}
              placeholder="e.g., 5.2"
            />
            <TextInput
              label="CA-125 (U/mL)"
              value={formData.clinicalMolecular.ca125}
              onChange={(v) => updateClinicalMolecular('ca125', v)}
              placeholder="e.g., 35"
            />
            <TextInput
              label="PSA (ng/mL)"
              value={formData.clinicalMolecular.psa}
              onChange={(v) => updateClinicalMolecular('psa', v)}
              placeholder="e.g., 4.2"
            />
            <TextInput
              label="PSA Doubling Time (months)"
              value={formData.clinicalMolecular.psaDoublingTime}
              onChange={(v) => updateClinicalMolecular('psaDoublingTime', v)}
              placeholder="e.g., 12"
            />
            <TextInput
              label="LDH (U/L)"
              value={formData.clinicalMolecular.ldh}
              onChange={(v) => updateClinicalMolecular('ldh', v)}
              placeholder="e.g., 200"
            />
          </div>
        </SectionCard>

        {/* 5. TREATMENT PLAN */}
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

        {/* 6. TREATMENT RESPONSE */}
        <SectionCard title="Treatment Response">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wide">
              Treatment Response Notes
            </label>
            <textarea
              value={formData.clinicalMolecular.treatmentResponse}
              onChange={(e) => updateClinicalMolecular('treatmentResponse', e.target.value)}
              placeholder="e.g., Achieved pCR, RCB-I with minimal residual disease, progressing on chemotherapy..."
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-transparent resize-none"
            />
          </div>
        </SectionCard>

        {/* 7. SURVIVAL ESTIMATES */}
        <SectionCard title="Survival Estimates">
          <LikelihoodInputs
            label="Provider Estimate — Likelihood of Survival"
            values={{
              sixMonth: numericToLikelihood(survivalSources[0]?.sixMonth || 0),
              oneYear: numericToLikelihood(survivalSources[0]?.oneYear || 0),
              twoYear: numericToLikelihood(survivalSources[0]?.twoYear || 0),
              fiveYear: numericToLikelihood(survivalSources[0]?.fiveYear || 0),
            }}
            onChange={updateSurvivalEstimate}
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

          {/* AI Analysis Section */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI Prognosis Analysis</span>
                {analysis?.confidence && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    analysis.confidence === 'high' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    analysis.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {analysis.confidence} confidence
                  </span>
                )}
              </div>
              {!OPENROUTER_API_KEY ? (
                <span className="text-xs text-amber-600 dark:text-amber-400">API key not configured</span>
              ) : (
                <button
                  onClick={() => {
                    if (analysis) {
                      clearAnalysis();
                    } else {
                      const computedStage = computeOverallStage(formData.tStage, formData.nStage, formData.mStage);
                      analyze({
                        cancerType: formData.cancerDetails.typeOfCancer,
                        cancerStage: computedStage || 'Not specified',
                        treatmentGoals: formData.treatmentPlan.goals,
                        treatments: formData.treatmentPlan.treatments,
                        tnmStage: formData.tStage || formData.nStage || formData.mStage
                          ? { t: formData.tStage, n: formData.nStage, m: formData.mStage }
                          : undefined,
                        molecularMarkers: formData.clinicalMolecular.molecularGenomicMarkers,
                        biomarkers: {
                          nlr: formData.clinicalMolecular.nlr,
                          cea: formData.clinicalMolecular.cea,
                          ca125: formData.clinicalMolecular.ca125,
                          psa: formData.clinicalMolecular.psa,
                          ldh: formData.clinicalMolecular.ldh,
                        },
                        patientFactors: {
                          ecog: formData.patientFactors.ecogStatus,
                          cci: formData.patientFactors.charlsonComorbidityIndex,
                          mgps: formData.patientFactors.mgps,
                        },
                      });
                    }
                  }}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  {isLoading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                  ) : analysis ? (
                    'Regenerate'
                  ) : (
                    <><Brain className="w-3.5 h-3.5" /> Generate Analysis</>
                  )}
                </button>
              )}
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing clinical data with AI...</span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {analysis && !isLoading && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {analysis.analysis}
                  </p>
                </div>
                {analysis.model && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    Generated by {analysis.model}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* CancerSurvivalRates.com Export */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">External Prognosis Tools</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  const result = exportToCancerSurvivalRates({
                    tStage: formData.tStage,
                    nStage: formData.nStage,
                    mStage: formData.mStage,
                    typeOfCancer: formData.cancerDetails.typeOfCancer,
                    sex: formData.demographics.sex,
                    ageGroup: formData.demographics.ageGroup,
                    numericAge: formData.age,
                    scientificName: formData.cancerDetails.scientificName,
                    dateOfDiagnosis: formData.demographics.dateOfDiagnosis,
                  });
                  if ('error' in result) {
                    setCsrWarnings(result.warnings);
                    setCsrJson(null);
                  } else {
                    setCsrWarnings(result.warnings || []);
                    setCsrJson(JSON.stringify(result, null, 2));
                  }
                }}
                className="inline-flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                Export to CancerSurvivalRates.com
              </button>
            </div>

            {csrWarnings.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Warnings:</p>
                {csrWarnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-600 dark:text-amber-400">{w}</p>
                ))}
              </div>
            )}

            {csrJson && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  CancerSurvivalRates.com JSON
                </label>
                <textarea
                  readOnly
                  value={csrJson}
                  className="w-full h-32 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 resize-none"
                />
              </div>
            )}
          </div>
        </SectionCard>

        {/* [8. REGISTRY & POPULATION DATA - commented out for future use]
        {/* <SectionCard title="Registry & Population Data"> */}
        {/*   <div className="space-y-4"> */}
        {/*     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"> */}
        {/*       <SelectInput */}
        {/*         label="Marital Status" */}
        {/*         value={formData.seerRegistry.maritalStatus} */}
        {/*         onChange={(v) => updateSeerRegistry('maritalStatus', v)} */}
        {/*         options={MARITAL_STATUS_OPTIONS} */}
        {/*       /> */}
        {/*       <TextInput */}
        {/*         label="Year of Diagnosis" */}
        {/*         value={formData.seerRegistry.yearOfDiagnosis} */}
        {/*         onChange={(v) => updateSeerRegistry('yearOfDiagnosis', v)} */}
        {/*         placeholder="e.g., 2023" */}
        {/*         type="number" */}
        {/*       /> */}
        {/*       <TextInput */}
        {/*         label="County of Residence" */}
        {/*         value={formData.seerRegistry.countyOfResidence} */}
        {/*         onChange={(v) => updateSeerRegistry('countyOfResidence', v)} */}
        {/*         placeholder="e.g., Travis County, TX" */}
        {/*       /> */}
        {/*       <SelectInput */}
        {/*         label="Urbanicity (RUCC)" */}
        {/*         value={formData.seerRegistry.urbanicity} */}
        {/*         onChange={(v) => updateSeerRegistry('urbanicity', v)} */}
        {/*         options={URBANICITY_OPTIONS} */}
        {/*       /> */}
        {/*     </div> */}
        {/*     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> */}
        {/*       <SelectInput */}
        {/*         label="Histologic Grade" */}
        {/*         value={formData.seerRegistry.histologicGrade} */}
        {/*         onChange={(v) => updateSeerRegistry('histologicGrade', v)} */}
        {/*         options={HISTOLOGIC_GRADE_OPTIONS} */}
        {/*       /> */}
        {/*       <SelectInput */}
        {/*         label="Smoking History" */}
        {/*         value={formData.seerRegistry.smokingHistory} */}
        {/*         onChange={(v) => updateSeerRegistry('smokingHistory', v)} */}
        {/*         options={SMOKING_HISTORY_OPTIONS} */}
        {/*       /> */}
        {/*     </div> */}
        {/*   </div> */}
        {/* </SectionCard> */}
      </main>

      {/* JSONL Inspector */}
      <JsonInspector data={formData as ProviderFormDataType} />
    </div>
  );
}