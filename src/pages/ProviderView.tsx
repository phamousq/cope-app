import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Microscope,
  FlaskConical,
  Activity,
  UserRound,
  Database,
  ChevronDown,
  ChevronUp,
  User,
  ArrowRight,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// TNM Staging types
type TStage = 'TX' | 'T0' | 'Tis' | 'T1' | 'T1a' | 'T1b' | 'T2' | 'T2a' | 'T2b' | 'T3' | 'T4' | 'T4a' | 'T4b';
type NStage = 'NX' | 'N0' | 'N1' | 'N1a' | 'N1b' | 'N1c' | 'N2' | 'N2a' | 'N2b' | 'N3' | 'N3a' | 'N3b';
type MStage = 'MX' | 'M0' | 'M1' | 'M1a' | 'M1b' | 'M1c' | 'M1d';

type ECOGStatus = '0' | '1' | '2' | '3' | '4';
type CCIScore = '0' | '1-2' | '3-4' | '5+' | 'Unknown';
type mGPSScore = '0' | '1' | '2' | 'Unknown';
type SEERStage = 'Localized' | 'Regional' | 'Distant';
type MSStatus = 'MSI-H' | 'MSI-L' | 'MSS' | 'Unknown' | 'Not tested';
type MutationStatus = 'Wild-type' | 'Mutated' | 'Unknown' | 'Not tested';

interface ClinicalData {
  // TNM Staging
  tStage: TStage;
  nStage: NStage;
  mStage: MStage;
  
  // Molecular/Genomic Markers
  msiStatus: MSStatus;
  krasStatus: MutationStatus;
  brafStatus: MutationStatus;
  egfrStatus: MutationStatus;
  brca1Status: MutationStatus;
  brca2Status: MutationStatus;
  
  // Biochemical/Tumor Markers
  nlr: string;
  cea: string;
  ca125: string;
  psa: string;
  psaDoublingTime: string;
  ldh: string;
  
  // Treatment Response
  pcr: boolean;
  rcb: string;
}

interface PatientFactors {
  ecogStatus: ECOGStatus;
  cciScore: CCIScore;
  mgpsScore: mGPSScore;
  physiologicAge: string;
}

interface SEERData {
  primaryCancerSite: string;
  seerSummaryStage: SEERStage;
  histologicType: string;
  histologicGrade: string;
  ageAtDiagnosis: string;
  sex: 'Male' | 'Female' | 'Other';
  raceEthnicity: string;
  maritalStatus: string;
  county: string;
  urbanicity: string;
  tumorSize: string;
  lymphNodesInvolved: string;
  smokingHistory: 'Never' | 'Former' | 'Current' | 'Unknown';
  selfAssessedHealth: 'Excellent' | 'Very good' | 'Good' | 'Fair' | 'Poor' | 'Unknown';
  yearOfDiagnosis: string;
}

interface ProviderFormData {
  clinical: ClinicalData;
  patientFactors: PatientFactors;
  seer: SEERData;
}

const initialClinical: ClinicalData = {
  tStage: 'TX',
  nStage: 'NX',
  mStage: 'MX',
  msiStatus: 'Not tested',
  krasStatus: 'Not tested',
  brafStatus: 'Not tested',
  egfrStatus: 'Not tested',
  brca1Status: 'Not tested',
  brca2Status: 'Not tested',
  nlr: '',
  cea: '',
  ca125: '',
  psa: '',
  psaDoublingTime: '',
  ldh: '',
  pcr: false,
  rcb: '',
};

const initialPatientFactors: PatientFactors = {
  ecogStatus: '0',
  cciScore: '0',
  mgpsScore: '0',
  physiologicAge: '',
};

const initialSEER: SEERData = {
  primaryCancerSite: '',
  seerSummaryStage: 'Localized',
  histologicType: '',
  histologicGrade: '',
  ageAtDiagnosis: '',
  sex: 'Male',
  raceEthnicity: '',
  maritalStatus: '',
  county: '',
  urbanicity: '',
  tumorSize: '',
  lymphNodesInvolved: '',
  smokingHistory: 'Unknown',
  selfAssessedHealth: 'Unknown',
  yearOfDiagnosis: new Date().getFullYear().toString(),
};

function SectionCard({ 
  title, 
  icon: Icon, 
  children, 
  defaultExpanded = false 
}: { 
  title: string; 
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-700 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

function SelectField({ 
  label, 
  value, 
  onChange, 
  options 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  options: { value: string; label: string }[]; 
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function TextField({ 
  label, 
  value, 
  onChange, 
  placeholder = '', 
  type = 'text' 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string; 
  type?: string; 
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-orange-500"
      />
    </div>
  );
}

function CheckboxField({ 
  label, 
  checked, 
  onChange 
}: { 
  label: string; 
  checked: boolean; 
  onChange: (v: boolean) => void; 
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-orange-600 focus:ring-orange-500"
      />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </label>
  );
}

function TNMStagingSection({ data, onChange }: { data: ClinicalData; onChange: (d: ClinicalData) => void }) {
  const update = (field: keyof ClinicalData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <SelectField
        label="Primary Tumor (T)"
        value={data.tStage}
        onChange={(v) => update('tStage', v)}
        options={[
          { value: 'TX', label: 'TX - Cannot be assessed' },
          { value: 'T0', label: 'T0 - No evidence of primary' },
          { value: 'Tis', label: 'Tis - Carcinoma in situ' },
          { value: 'T1', label: 'T1 - Tumor invades submucosa' },
          { value: 'T1a', label: 'T1a' },
          { value: 'T1b', label: 'T1b' },
          { value: 'T2', label: 'T2 - Tumor invades muscularis' },
          { value: 'T2a', label: 'T2a' },
          { value: 'T2b', label: 'T2b' },
          { value: 'T3', label: 'T3 - Tumor invades subserosa' },
          { value: 'T4', label: 'T4 - Tumor invades adjacent structures' },
          { value: 'T4a', label: 'T4a - Visceral pleura' },
          { value: 'T4b', label: 'T4b - Other structures' },
        ]}
      />
      <SelectField
        label="Regional Lymph Nodes (N)"
        value={data.nStage}
        onChange={(v) => update('nStage', v)}
        options={[
          { value: 'NX', label: 'NX - Cannot be assessed' },
          { value: 'N0', label: 'N0 - No regional node metastasis' },
          { value: 'N1', label: 'N1 - 1-3 regional nodes' },
          { value: 'N1a', label: 'N1a - 1 node' },
          { value: 'N1b', label: 'N1b - 2-3 nodes' },
          { value: 'N1c', label: 'N1c - Satellite nodules' },
          { value: 'N2', label: 'N2 - 4-9 regional nodes' },
          { value: 'N2a', label: 'N2a - 4-6 nodes' },
          { value: 'N2b', label: 'N2b - 7+ nodes' },
          { value: 'N3', label: 'N3 - 10+ regional nodes' },
          { value: 'N3a', label: 'N3a - 10-12 nodes' },
          { value: 'N3b', label: 'N3b - 13+ nodes' },
        ]}
      />
      <SelectField
        label="Distant Metastasis (M)"
        value={data.mStage}
        onChange={(v) => update('mStage', v)}
        options={[
          { value: 'MX', label: 'MX - Cannot be assessed' },
          { value: 'M0', label: 'M0 - No distant metastasis' },
          { value: 'M1', label: 'M1 - Distant metastasis' },
          { value: 'M1a', label: 'M1a - Specific location 1' },
          { value: 'M1b', label: 'M1b - Specific location 2' },
          { value: 'M1c', label: 'M1c - Other locations' },
          { value: 'M1d', label: 'M1d - CNS metastasis' },
        ]}
      />
    </div>
  );
}

function MolecularSection({ data, onChange }: { data: ClinicalData; onChange: (d: ClinicalData) => void }) {
  const update = (field: keyof ClinicalData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <SelectField
        label="MSI Status"
        value={data.msiStatus}
        onChange={(v) => update('msiStatus', v)}
        options={[
          { value: 'MSI-H', label: 'MSI-H (High)' },
          { value: 'MSI-L', label: 'MSI-L (Low)' },
          { value: 'MSS', label: 'MSS (Stable)' },
          { value: 'Unknown', label: 'Unknown' },
          { value: 'Not tested', label: 'Not tested' },
        ]}
      />
      <SelectField
        label="KRAS Status"
        value={data.krasStatus}
        onChange={(v) => update('krasStatus', v)}
        options={[
          { value: 'Wild-type', label: 'Wild-type' },
          { value: 'Mutated', label: 'Mutated' },
          { value: 'Unknown', label: 'Unknown' },
          { value: 'Not tested', label: 'Not tested' },
        ]}
      />
      <SelectField
        label="BRAF Status"
        value={data.brafStatus}
        onChange={(v) => update('brafStatus', v)}
        options={[
          { value: 'Wild-type', label: 'Wild-type' },
          { value: 'Mutated', label: 'Mutated' },
          { value: 'Unknown', label: 'Unknown' },
          { value: 'Not tested', label: 'Not tested' },
        ]}
      />
      <SelectField
        label="EGFR Status"
        value={data.egfrStatus}
        onChange={(v) => update('egfrStatus', v)}
        options={[
          { value: 'Wild-type', label: 'Wild-type' },
          { value: 'Mutated', label: 'Mutated' },
          { value: 'Unknown', label: 'Unknown' },
          { value: 'Not tested', label: 'Not tested' },
        ]}
      />
      <SelectField
        label="BRCA1 Status"
        value={data.brca1Status}
        onChange={(v) => update('brca1Status', v)}
        options={[
          { value: 'Wild-type', label: 'Wild-type' },
          { value: 'Mutated', label: 'Mutated' },
          { value: 'Unknown', label: 'Unknown' },
          { value: 'Not tested', label: 'Not tested' },
        ]}
      />
      <SelectField
        label="BRCA2 Status"
        value={data.brca2Status}
        onChange={(v) => update('brca2Status', v)}
        options={[
          { value: 'Wild-type', label: 'Wild-type' },
          { value: 'Mutated', label: 'Mutated' },
          { value: 'Unknown', label: 'Unknown' },
          { value: 'Not tested', label: 'Not tested' },
        ]}
      />
    </div>
  );
}

function BiomarkersSection({ data, onChange }: { data: ClinicalData; onChange: (d: ClinicalData) => void }) {
  const update = (field: keyof ClinicalData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TextField label="NLR (Neutrophil/Lymphocyte)" value={data.nlr} onChange={(v) => update('nlr', v)} placeholder="e.g., 2.5" />
        <TextField label="CEA (ng/mL)" value={data.cea} onChange={(v) => update('cea', v)} placeholder="e.g., 5.2" />
        <TextField label="CA-125 (U/mL)" value={data.ca125} onChange={(v) => update('ca125', v)} placeholder="e.g., 35" />
        <TextField label="PSA (ng/mL)" value={data.psa} onChange={(v) => update('psa', v)} placeholder="e.g., 4.2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField label="PSA Doubling Time (months)" value={data.psaDoublingTime} onChange={(v) => update('psaDoublingTime', v)} placeholder="e.g., 12" />
        <TextField label="LDH (U/L)" value={data.ldh} onChange={(v) => update('ldh', v)} placeholder="e.g., 200" />
      </div>
    </div>
  );
}

function TreatmentResponseSection({ data, onChange }: { data: ClinicalData; onChange: (d: ClinicalData) => void }) {
  const update = (field: keyof ClinicalData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <CheckboxField label="Pathologic Complete Response (pCR)" checked={data.pcr} onChange={(v) => update('pcr', v)} />
      <TextField label="Residual Cancer Burden (RCB) Index" value={data.rcb} onChange={(v) => update('rcb', v)} placeholder="e.g., 0.5" />
    </div>
  );
}

function PatientFactorsSection({ data, onChange }: { data: PatientFactors; onChange: (d: PatientFactors) => void }) {
  const update = (field: keyof PatientFactors, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SelectField
          label="ECOG Performance Status"
          value={data.ecogStatus}
          onChange={(v) => update('ecogStatus', v)}
          options={[
            { value: '0', label: '0 - Fully active' },
            { value: '1', label: '1 - Restricted strenuous activity' },
            { value: '2', label: '2 - Self-care only' },
            { value: '3', label: '3 - Limited self-care' },
            { value: '4', label: '4 - Completely disabled' },
          ]}
        />
        <SelectField
          label="Charlson Comorbidity Index"
          value={data.cciScore}
          onChange={(v) => update('cciScore', v)}
          options={[
            { value: '0', label: '0 - No comorbidity' },
            { value: '1-2', label: '1-2 - Mild' },
            { value: '3-4', label: '3-4 - Moderate' },
            { value: '5+', label: '5+ - Severe' },
            { value: 'Unknown', label: 'Unknown' },
          ]}
        />
        <SelectField
          label="mGPS Score"
          value={data.mgpsScore}
          onChange={(v) => update('mgpsScore', v)}
          options={[
            { value: '0', label: '0 - Low risk' },
            { value: '1', label: '1 - Intermediate' },
            { value: '2', label: '2 - High risk' },
            { value: 'Unknown', label: 'Unknown' },
          ]}
        />
      </div>
      <TextField label="Physiologic Age (health-adjusted)" value={data.physiologicAge} onChange={(v) => update('physiologicAge', v)} placeholder="e.g., 65" />
    </div>
  );
}

function SEERDemographicsSection({ data, onChange }: { data: SEERData; onChange: (d: SEERData) => void }) {
  const update = (field: keyof SEERData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <TextField label="Age at Diagnosis" value={data.ageAtDiagnosis} onChange={(v) => update('ageAtDiagnosis', v)} placeholder="e.g., 65" type="number" />
      <SelectField
        label="Sex"
        value={data.sex}
        onChange={(v) => update('sex', v)}
        options={[
          { value: 'Male', label: 'Male' },
          { value: 'Female', label: 'Female' },
          { value: 'Other', label: 'Other' },
        ]}
      />
      <TextField label="Race/Ethnicity" value={data.raceEthnicity} onChange={(v) => update('raceEthnicity', v)} placeholder="e.g., Non-Hispanic White" />
      <SelectField
        label="Marital Status"
        value={data.maritalStatus}
        onChange={(v) => update('maritalStatus', v)}
        options={[
          { value: 'Single', label: 'Single' },
          { value: 'Married', label: 'Married' },
          { value: 'Divorced', label: 'Divorced' },
          { value: 'Widowed', label: 'Widowed' },
          { value: 'Separated', label: 'Separated' },
          { value: 'Unknown', label: 'Unknown' },
        ]}
      />
    </div>
  );
}

function SEERTumorSection({ data, onChange }: { data: SEERData; onChange: (d: SEERData) => void }) {
  const update = (field: keyof SEERData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <TextField label="Primary Cancer Site (ICD-O-3)" value={data.primaryCancerSite} onChange={(v) => update('primaryCancerSite', v)} placeholder="e.g., C18.9 (colon)" />
        <SelectField
          label="SEER Summary Stage"
          value={data.seerSummaryStage}
          onChange={(v) => update('seerSummaryStage', v)}
          options={[
            { value: 'Localized', label: 'Localized' },
            { value: 'Regional', label: 'Regional' },
            { value: 'Distant', label: 'Distant' },
          ]}
        />
        <TextField label="Histologic Type" value={data.histologicType} onChange={(v) => update('histologicType', v)} placeholder="e.g., Adenocarcinoma" />
        <TextField label="Histologic Grade" value={data.histologicGrade} onChange={(v) => update('histologicGrade', v)} placeholder="e.g., G2 (moderately differentiated)" />
        <TextField label="Tumor Size (mm)" value={data.tumorSize} onChange={(v) => update('tumorSize', v)} placeholder="e.g., 35" type="number" />
        <TextField label="Lymph Nodes Involved" value={data.lymphNodesInvolved} onChange={(v) => update('lymphNodesInvolved', v)} placeholder="e.g., 2/12" />
      </div>
    </div>
  );
}

function SEERSocialSection({ data, onChange }: { data: SEERData; onChange: (d: SEERData) => void }) {
  const update = (field: keyof SEERData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <TextField label="County of Residence" value={data.county} onChange={(v) => update('county', v)} placeholder="e.g., Travis County" />
      <TextField label="Urbanicity (RUCC)" value={data.urbanicity} onChange={(v) => update('urbanicity', v)} placeholder="e.g., Metro area" />
      <SelectField
        label="Smoking History"
        value={data.smokingHistory}
        onChange={(v) => update('smokingHistory', v)}
        options={[
          { value: 'Never', label: 'Never smoker' },
          { value: 'Former', label: 'Former smoker' },
          { value: 'Current', label: 'Current smoker' },
          { value: 'Unknown', label: 'Unknown' },
        ]}
      />
      <SelectField
        label="Self-Assessed Health"
        value={data.selfAssessedHealth}
        onChange={(v) => update('selfAssessedHealth', v)}
        options={[
          { value: 'Excellent', label: 'Excellent' },
          { value: 'Very good', label: 'Very good' },
          { value: 'Good', label: 'Good' },
          { value: 'Fair', label: 'Fair' },
          { value: 'Poor', label: 'Poor' },
          { value: 'Unknown', label: 'Unknown' },
        ]}
      />
    </div>
  );
}

export function ProviderView() {
  const [clinical, setClinical] = useState<ClinicalData>(initialClinical);
  const [patientFactors, setPatientFactors] = useState<PatientFactors>(initialPatientFactors);
  const [seer, setSEER] = useState<SEERData>(initialSEER);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    
    // In production, this would save to localStorage or send to backend
    const formData: ProviderFormData = { clinical, patientFactors, seer };
    localStorage.setItem('cope-provider-data', JSON.stringify(formData));
    
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const completionScore = () => {
    let total = 0;
    let filled = 0;
    
    // Clinical fields
    total += 3; // TNM
    if (clinical.tStage !== 'TX') filled++;
    if (clinical.nStage !== 'NX') filled++;
    if (clinical.mStage !== 'MX') filled++;
    
    total += 6; // Molecular
    if (clinical.msiStatus !== 'Not tested') filled++;
    if (clinical.krasStatus !== 'Not tested') filled++;
    if (clinical.brafStatus !== 'Not tested') filled++;
    if (clinical.egfrStatus !== 'Not tested') filled++;
    if (clinical.brca1Status !== 'Not tested') filled++;
    if (clinical.brca2Status !== 'Not tested') filled++;
    
    total += 5; // Biomarkers
    if (clinical.nlr) filled++;
    if (clinical.cea) filled++;
    if (clinical.ca125) filled++;
    if (clinical.psa) filled++;
    if (clinical.ldh) filled++;
    
    total += 2; // Treatment response
    if (clinical.pcr || clinical.rcb) filled++;
    
    // Patient factors
    total += 4;
    if (patientFactors.ecogStatus !== '0') filled++;
    if (patientFactors.cciScore !== '0') filled++;
    if (patientFactors.mgpsScore !== '0') filled++;
    if (patientFactors.physiologicAge) filled++;
    
    // SEER fields
    total += 12;
    if (seer.primaryCancerSite) filled++;
    if (seer.ageAtDiagnosis) filled++;
    if (seer.sex) filled++;
    if (seer.raceEthnicity) filled++;
    if (seer.maritalStatus) filled++;
    if (seer.histologicType) filled++;
    if (seer.histologicGrade) filled++;
    if (seer.tumorSize) filled++;
    if (seer.lymphNodesInvolved) filled++;
    if (seer.smokingHistory !== 'Unknown') filled++;
    if (seer.selfAssessedHealth !== 'Unknown') filled++;
    if (seer.yearOfDiagnosis) filled++;
    
    return Math.round((filled / total) * 100);
  };

  const progress = completionScore();

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Provider View</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Comprehensive clinical data entry for cancer prognosis
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-slate-500 dark:text-slate-400">Data Completion</div>
            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{progress}%</div>
          </div>
          <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Clinical & Molecular Data */}
      <div className="space-y-4 mb-6">
        <SectionCard title="TNM Staging" icon={Stethoscope} defaultExpanded>
          <TNMStagingSection data={clinical} onChange={setClinical} />
        </SectionCard>

        <SectionCard title="Molecular & Genomic Markers" icon={Microscope} defaultExpanded>
          <MolecularSection data={clinical} onChange={setClinical} />
        </SectionCard>

        <SectionCard title="Biochemical & Tumor Markers" icon={FlaskConical}>
          <BiomarkersSection data={clinical} onChange={setClinical} />
        </SectionCard>

        <SectionCard title="Treatment Response" icon={Activity}>
          <TreatmentResponseSection data={clinical} onChange={setClinical} />
        </SectionCard>
      </div>

      {/* Patient-Specific Factors */}
      <div className="mb-6">
        <SectionCard title="Patient-Specific Factors" icon={UserRound} defaultExpanded>
          <PatientFactorsSection data={patientFactors} onChange={setPatientFactors} />
        </SectionCard>
      </div>

      {/* SEER Registry Data */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">SEER Registry Data</h2>
        </div>

        <SectionCard title="Demographics" icon={User} defaultExpanded>
          <SEERDemographicsSection data={seer} onChange={setSEER} />
        </SectionCard>

        <SectionCard title="Tumor Characteristics" icon={Microscope}>
          <SEERTumorSection data={seer} onChange={setSEER} />
        </SectionCard>

        <SectionCard title="Social & Behavioral Factors" icon={Activity}>
          <SEERSocialSection data={seer} onChange={setSEER} />
        </SectionCard>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField 
            label="Year of Diagnosis" 
            value={seer.yearOfDiagnosis} 
            onChange={(v) => setSEER({ ...seer, yearOfDiagnosis: v })} 
            type="number"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Link
          to="/patient"
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <User className="w-5 h-5" />
          Switch to Patient View
        </Link>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold hover:from-orange-600 hover:to-amber-600 transition-colors shadow-lg disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save & Continue
            </>
          )}
        </button>
      </div>

      {/* Disclaimer */}
      <footer className="mt-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          All data entered here is de-identified. No PII is stored. Data is used for clinical decision support only.
        </p>
      </footer>
    </main>
  );
}
