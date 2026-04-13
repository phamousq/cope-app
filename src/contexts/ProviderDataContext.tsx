import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ProviderFormData {
  age: string;
  demographics: {
    sex: string;
    ageGroup: string;
    ethnicity: string;
    dateOfDiagnosis: string;
  };
  cancerDetails: {
    typeOfCancer: string;
    scientificName: string;
    whereSpread: string;
    cancerStage: string;
  };
  cancerLocation: string;
  cancerSize: string;
  tStage: string;
  nStage: string;
  mStage: string;
  lymphNodes: string;
  clinicalMolecular: {
    molecularGenomicMarkers: string;
    nlr: string;
    cea: string;
    ca125: string;
    psa: string;
    psaDoublingTime: string;
    ldh: string;
    treatmentResponse: string;
  };
  treatmentPlan: {
    goals: string[];
    treatments: string[];
    response: string;
  };
  patientFactors: {
    ecogStatus: string;
    charlsonComorbidityIndex: string;
    mgps: string;
    physiologicAge: string;
  };
  seerRegistry: {
    maritalStatus: string;
    yearOfDiagnosis: string;
    countyOfResidence: string;
    urbanicity: string;
    histologicGrade: string;
    smokingHistory: string;
  };
  prognosisData: {
    survivalSources: Array<{
      source: string;
      likelihoodOfCure: string;
      sixMonth: number;
      oneYear: number;
      twoYear: number;
      fiveYear: number;
    }>;
    additionalContext: string;
  };
}

const STORAGE_KEY = 'cope_provider_form_data';

const defaultFormData: ProviderFormData = {
  age: '',
  demographics: {
    sex: '',
    ageGroup: '',
    ethnicity: '',
    dateOfDiagnosis: '',
  },
  cancerDetails: {
    typeOfCancer: '',
    scientificName: '',
    whereSpread: '',
    cancerStage: '',
  },
  cancerLocation: '',
  cancerSize: '',
  tStage: '',
  nStage: '',
  mStage: '',
  lymphNodes: '',
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
  treatmentPlan: {
    goals: [] as string[],
    treatments: [] as string[],
    response: '',
  },
  patientFactors: {
    ecogStatus: '',
    charlsonComorbidityIndex: '',
    mgps: '',
    physiologicAge: '',
  },
  seerRegistry: {
    maritalStatus: '',
    yearOfDiagnosis: '',
    countyOfResidence: '',
    urbanicity: '',
    histologicGrade: '',
    smokingHistory: '',
  },
  prognosisData: {
    survivalSources: [
      { source: 'Provider Estimate', likelihoodOfCure: 'Possible (25-75%)', sixMonth: 0, oneYear: 0, twoYear: 0, fiveYear: 0 },
    ],
    additionalContext: '',
  },
};

export type FormDataUpdater = (prev: ProviderFormData) => ProviderFormData;

interface ProviderDataContextType {
  formData: ProviderFormData;
  setFormData: (data: ProviderFormData | FormDataUpdater) => void;
}

const ProviderDataContext = createContext<ProviderDataContextType | null>(null);

export function ProviderDataProvider({ children }: { children: ReactNode }) {
  const [formData, setFormDataState] = useState<ProviderFormData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Deep merge with defaults to handle schema changes
        return {
          ...defaultFormData,
          ...parsed,
          demographics: { ...defaultFormData.demographics, ...parsed.demographics },
          cancerDetails: { ...defaultFormData.cancerDetails, ...parsed.cancerDetails },
          clinicalMolecular: { ...defaultFormData.clinicalMolecular, ...parsed.clinicalMolecular },
          treatmentPlan: parsed.treatmentPlan
            ? { ...defaultFormData.treatmentPlan, ...parsed.treatmentPlan }
            : defaultFormData.treatmentPlan,
          patientFactors: { ...defaultFormData.patientFactors, ...parsed.patientFactors },
          seerRegistry: { ...defaultFormData.seerRegistry, ...parsed.seerRegistry },
          prognosisData: parsed.prognosisData
            ? { ...defaultFormData.prognosisData, ...parsed.prognosisData }
            : defaultFormData.prognosisData,
        };
      } catch {
        return defaultFormData;
      }
    }
    return defaultFormData;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const setFormData = (data: ProviderFormData | FormDataUpdater) => {
    if (typeof data === 'function') {
      setFormDataState(prev => (data as FormDataUpdater)(prev));
    } else {
      setFormDataState(data);
    }
  };

  return (
    <ProviderDataContext.Provider value={{ formData, setFormData }}>
      {children}
    </ProviderDataContext.Provider>
  );
}

export function useProviderData() {
  const context = useContext(ProviderDataContext);
  if (!context) {
    throw new Error('useProviderData must be used within ProviderDataProvider');
  }
  return context;
}

export function getProviderFormData(): ProviderFormData {
  if (typeof window === 'undefined') return defaultFormData;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultFormData;
    }
  }
  return defaultFormData;
}