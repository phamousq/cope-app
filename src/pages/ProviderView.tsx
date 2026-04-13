import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, ClipboardList, Brain, Loader2, AlertCircle } from 'lucide-react';
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

// TNM Staging options
const T_STAGE_OPTIONS = ['', 'TX', 'T0', 'Tis', 'T1', 'T1a', 'T1b', 'T2', 'T3', 'T4', 'T4a', 'T4b'];
const N_STAGE_OPTIONS = ['', 'NX', 'N0', 'N1', 'N1a', 'N1b', 'N1c', 'N2', 'N2a', 'N2b', 'N3'];
const M_STAGE_OPTIONS = ['', 'MX', 'M0', 'M1', 'M1a', 'M1b', 'M1c'];

// Patient-specific factors (standardized scales - keep as selects)
const ECOG_OPTIONS = ['', '0 - Fully active', '1 - Restricted strenuous activity', '2 - Ambulatory but unable to work', '3 - Limited self-care', '4 - Completely disabled'];
const CCI_OPTIONS = ['', '0', '1', '2', '3', '4', '5+'];
const MGPS_OPTIONS = ['', '0 (Low risk)', '1 (Intermediate)', '2 (High risk)'];

// SEER Registry options
const HISTOLOGIC_GRADE_OPTIONS = ['', 'Grade I (Well differentiated)', 'Grade II (Moderately differentiated)', 'Grade III (Poorly differentiated)', 'Grade IV (Undifferentiated)', 'Not applicable'];
const MARITAL_STATUS_OPTIONS = ['', 'Single (never married)', 'Married', 'Separated', 'Divorced', 'Widowed', 'Unmarried or domestic partner', 'Unknown'];
const SMOKING_HISTORY_OPTIONS = ['', 'Never smoker', 'Former smoker', 'Current smoker', 'Unknown'];
const URBANICITY_OPTIONS = ['', '1 - Metro counties (pop ≥1 million)', '2 - Metro counties (pop <1 million)', '3 - Urban counties', '4 - Less urban counties', '5 - Completely rural counties', 'Unknown'];

// Age group options
const AGE_GROUP_OPTIONS = ['', '18-34', '35-49', '50-59', '60-69', '70-79', '80-90'] as const;

// Overall stage options (computed from TNM or manual)
const OVERALL_STAGE_OPTIONS = ['', 'Stage 1 - Localized', 'Stage 2 - Localized', 'Stage 3 - Regional', 'Stage 4 - Metastatic'] as const;

interface SeerRegistryData {
  histologicGrade: string;
  maritalStatus: string;
  countyOfResidence: string;
  urbanicity: string;
  tumorSize: string;
  lymphNodesInvolved: string;
  smokingHistory: string;
  yearOfDiagnosis: string;
}

interface ClinicalMolecularData {
  // Molecular & Genomic Markers (free text)
  molecularGenomicMarkers: string;
  // Biochemical/Tumor Markers
  nlr: string;
  cea: string;
  ca125: string;
  psa: string;
  psaDoublingTime: string;
  ldh: string;
  // Treatment Response (free text)
  treatmentResponse: string;
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
    physiologicAge: string;
  };
  seerRegistry: SeerRegistryData;
  // TNM staging (moved from clinicalMolecular for logical grouping)
  tStage: string;
  nStage: string;
  mStage: string;
  overallStage: string; // manual override or computed from TNM
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
  clinicalMolecular: {
    molecularGenomicMarkers: '',
    nlr: '',
    cea: '',
    ca125: '',
    psa: '',
    psaDoublingTime: '',
    ldh: '',
    treatmentResponse: '',
  },
  patientFactors: {
    ecogStatus: '',
    charlsonComorbidityIndex: '',
    mgps: '',
    physiologicAge: '',
  },
  seerRegistry: {
    histologicGrade: '',
    maritalStatus: '',
    countyOfResidence: '',
    urbanicity: '',
    tumorSize: '',
    lymphNodesInvolved: '',
    smokingHistory: '',
    yearOfDiagnosis: '',
  },
  // TNM
  tStage: '',
  nStage: '',
  mStage: '',
  overallStage: '',
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

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

export function ProviderView() {
  const [formData, setFormData] = useState<ProviderFormData>(initialFormData);
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

  // Compute overall stage from TNM
  const computeOverallStage = (t: string, n: string, m: string): string => {
    if (!t && !n && !m) return '';
    if (m && m !== 'M0' && m !== 'MX') return 'Stage 4 - Metastatic';
    if (n && (n === 'N2' || n === 'N3')) return 'Stage 3 - Regional';
    if (t && (t === 'T3' || t === 'T4')) return 'Stage 3 - Regional';
    if (t && (t === 'T1b' || t === 'T2')) return 'Stage 2 - Localized';
    if (t && t.startsWith('T1')) return 'Stage 1 - Localized';
    return '';
  };

  // Auto-compute overall stage when TNM changes (unless manually set)
  const handleTNMChange = (key: 'tStage' | 'nStage' | 'mStage', value: string) => {
    setFormData((prev) => {
      const newT = key === 'tStage' ? value : prev.tStage;
      const newN = key === 'nStage' ? value : prev.nStage;
      const newM = key === 'mStage' ? value : prev.mStage;
      const computed = computeOverallStage(newT, newN, newM);
      // Only auto-update overall stage if it matches computed (user hasn't manually set something else)
      const newOverall = prev.overallStage === computeOverallStage(prev.tStage, prev.nStage, prev.mStage) || !prev.overallStage
        ? computed
        : prev.overallStage;
      return {
        ...prev,
        [key]: value,
        overallStage: newOverall,
      };
    });
  };

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
        {/* 1. PATIENT DEMOGRAPHICS - age, sex, ethnicity, performance status, comorbidities */}
        <SectionCard title="Patient Demographics">
          <div className="space-y-4">
            {/* Basic demographics - 4 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SelectInput
                label="Sex at Birth"
                value={formData.demographics.sex}
                onChange={(v) => updateDemographics('sex', v as Demographics['sex'])}
                options={SEX_OPTIONS}
              />
              <SelectInput
                label="Age Group"
                value={formData.demographics.ageGroup}
                onChange={(v) => updateDemographics('ageGroup', v as Demographics['ageGroup'])}
                options={AGE_GROUP_OPTIONS}
              />
              <TextInput
                label="Ethnicity / Race"
                value={formData.demographics.ethnicity}
                onChange={(v) => updateDemographics('ethnicity', v)}
                placeholder="e.g., Non-Hispanic White"
              />
              <TextInput
                label="Physiologic Age"
                value={formData.patientFactors.physiologicAge}
                onChange={(v) => updatePatientFactors('physiologicAge', v)}
                placeholder="e.g., 65"
              />
            </div>

            {/* Performance status & comorbidities - 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SelectInput
                label="ECOG Performance Status"
                value={formData.patientFactors.ecogStatus}
                onChange={(v) => updatePatientFactors('ecogStatus', v)}
                options={ECOG_OPTIONS}
              />
              <SelectInput
                label="Charlson Comorbidity Index"
                value={formData.patientFactors.charlsonComorbidityIndex}
                onChange={(v) => updatePatientFactors('charlsonComorbidityIndex', v)}
                options={CCI_OPTIONS}
              />
              <SelectInput
                label="mGPS (Glasgow Score)"
                value={formData.patientFactors.mgps}
                onChange={(v) => updatePatientFactors('mgps', v)}
                options={MGPS_OPTIONS}
              />
              <TextInput
                label="Physiologic Age"
                value={formData.patientFactors.physiologicAge}
                onChange={(v) => updatePatientFactors('physiologicAge', v)}
                placeholder="e.g., 65"
              />
            </div>
          </div>
        </SectionCard>

        {/* 2. CANCER DIAGNOSIS - cancer type, TNM staging, histology, metastatic spread */}
        <SectionCard title="Cancer Diagnosis">
          <div className="space-y-4">
            {/* Primary cancer type */}
            <TextInput
              label="Primary Cancer Type"
              value={formData.cancerDetails.typeOfCancer}
              onChange={(v) => updateCancerDetails('typeOfCancer', v)}
              placeholder="e.g., Non-Small Cell Lung Cancer"
              className="sm:col-span-2"
            />

            {/* TNM Staging - 4 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SelectInput
                label="T - Primary Tumor"
                value={formData.tStage}
                onChange={(v) => handleTNMChange('tStage', v)}
                options={T_STAGE_OPTIONS}
              />
              <SelectInput
                label="N - Regional Nodes"
                value={formData.nStage}
                onChange={(v) => handleTNMChange('nStage', v)}
                options={N_STAGE_OPTIONS}
              />
              <SelectInput
                label="M - Distant Metastasis"
                value={formData.mStage}
                onChange={(v) => handleTNMChange('mStage', v)}
                options={M_STAGE_OPTIONS}
              />
              <SelectInput
                label="Overall Stage (AJCC)"
                value={formData.overallStage}
                onChange={(v) => setFormData((prev) => ({ ...prev, overallStage: v }))}
                options={OVERALL_STAGE_OPTIONS}
              />
            </div>

            {/* Histology and spread - 3 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextInput
                label="Histology / Scientific Name"
                value={formData.cancerDetails.scientificName}
                onChange={(v) => updateCancerDetails('scientificName', v)}
                placeholder="e.g., Adenocarcinoma"
              />
              <TextInput
                label="Tumor Size (mm)"
                value={formData.seerRegistry.tumorSize}
                onChange={(v) => updateSeerRegistry('tumorSize', v)}
                placeholder="e.g., 45"
              />
              <TextInput
                label="Lymph Nodes Involved"
                value={formData.seerRegistry.lymphNodesInvolved}
                onChange={(v) => updateSeerRegistry('lymphNodesInvolved', v)}
                placeholder="e.g., 0, 2, 5+"
              />
            </div>

            {/* Metastatic spread */}
            <TextInput
              label="Metastatic Spread"
              value={formData.cancerDetails.whereSpread}
              onChange={(v) => updateCancerDetails('whereSpread', v)}
              placeholder="e.g., Bones, liver, lungs — or 'Localized'"
            />
          </div>
        </SectionCard>

        {/* 3. MOLECULAR & GENOMIC MARKERS */}
        <SectionCard title="Molecular & Genomic Markers">
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
        </SectionCard>

        {/* 4. BIOCHEMICAL & TUMOR MARKERS */}
        <SectionCard title="Biochemical & Tumor Markers">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <TextInput
              label="NLR (Neutrophil:Lymphocyte)"
              value={formData.clinicalMolecular.nlr}
              onChange={(v) => updateClinicalMolecular('nlr', v)}
              placeholder="e.g., 3.5"
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
                      analyze({
                        cancerType: formData.cancerDetails.typeOfCancer,
                        cancerStage: formData.overallStage || 'Not specified',
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
        </SectionCard>

        {/* 8. REGISTRY & POPULATION DATA - SEER-style data */}
        <SectionCard title="Registry & Population Data">
          <div className="space-y-4">
            {/* Social & Geographic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SelectInput
                label="Marital Status"
                value={formData.seerRegistry.maritalStatus}
                onChange={(v) => updateSeerRegistry('maritalStatus', v)}
                options={MARITAL_STATUS_OPTIONS}
              />
              <TextInput
                label="Year of Diagnosis"
                value={formData.seerRegistry.yearOfDiagnosis}
                onChange={(v) => updateSeerRegistry('yearOfDiagnosis', v)}
                placeholder="e.g., 2023"
              />
              <TextInput
                label="County of Residence"
                value={formData.seerRegistry.countyOfResidence}
                onChange={(v) => updateSeerRegistry('countyOfResidence', v)}
                placeholder="e.g., Travis County, TX"
              />
              <SelectInput
                label="Urbanicity (RUCC)"
                value={formData.seerRegistry.urbanicity}
                onChange={(v) => updateSeerRegistry('urbanicity', v)}
                options={URBANICITY_OPTIONS}
              />
            </div>

            {/* Histologic grade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectInput
                label="Histologic Grade"
                value={formData.seerRegistry.histologicGrade}
                onChange={(v) => updateSeerRegistry('histologicGrade', v)}
                options={HISTOLOGIC_GRADE_OPTIONS}
              />
              <SelectInput
                label="Smoking History"
                value={formData.seerRegistry.smokingHistory}
                onChange={(v) => updateSeerRegistry('smokingHistory', v)}
                options={SMOKING_HISTORY_OPTIONS}
              />
            </div>
          </div>
        </SectionCard>
      </main>

      {/* JSONL Inspector */}
      <JsonInspector data={formData} />
    </div>
  );
}