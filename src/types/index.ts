// Patient demographics
export interface Demographics {
  sex: 'Male' | 'Female';
  ageGroup: AgeGroup | '';
  ethnicity: string;
}

export type AgeGroup = '18-34' | '35-49' | '50-59' | '60-69' | '70-79' | '80-90' | '';

// Cancer clinical details - DIAGNOSIS section
export interface CancerDetails {
  typeOfCancer: string; // where it started
  cancerStage: CancerStage;
  scientificName: string; // histology / cancer cell type
  whereSpread: string; // where it has spread
}

export type CancerStage = 'Stage 1 - Localized' | 'Stage 2 - Localized' | 'Stage 3 - Regional' | 'Stage 4 - Metastatic';

export type DiagnosisTimeline = 'Within the past month' | '2-6 months ago' | '6-12 months ago' | '1-2 years ago' | '2+ years ago';

// Treatment plan
export interface TreatmentPlan {
  goals: TreatmentGoal[];
  treatments: Treatment[];
}

export type TreatmentGoal = 'Cure' | 'Remission' | 'Better quality of life' | 'Longer life' | 'Comfort';
export type Treatment = 'Radiation' | 'Surgery' | 'Chemotherapy' | 'Immunotherapy' | 'Targeted Therapy' | 'Hormone Therapy' | 'Other';

// Prognosis section
export type LikelihoodOfCure = 'Very unlikely (<1%)' | 'Unlikely (<25%)' | 'Possible (25-75%)' | 'Likely (>75%)';

export type SurvivalTimeframe = 'sixMonth' | 'oneYear' | 'twoYear' | 'fiveYear';

export type LikelihoodExpectation = LikelihoodOfCure | null;

export interface LikelihoodExpectations {
  sixMonth: LikelihoodExpectation;
  oneYear: LikelihoodExpectation;
  twoYear: LikelihoodExpectation;
  fiveYear: LikelihoodExpectation;
}

export interface SurvivalWithoutTreatment {
  sixMonth: LikelihoodExpectation;
  oneYear: LikelihoodExpectation;
  twoYear: LikelihoodExpectation;
  fiveYear: LikelihoodExpectation;
}

export interface SurvivalSource {
  source: string;
  likelihoodOfCure: LikelihoodOfCure;
  sixMonth: number;
  oneYear: number;
  twoYear: number;
  fiveYear: number;
}

export interface PrognosisData {
  survivalSources: SurvivalSource[];
  additionalContext: string;
}

// Complete form data
export interface PatientFormData {
  demographics: Demographics;
  cancerDetails: CancerDetails;
  treatmentPlan: TreatmentPlan;
  prognosisData: PrognosisData;
}

// SEER API request payload
export interface SEERAPIRequest {
  sex: string;
  ageGroup: string;
  stage: string;
  histology: string;
}

// SEER API response
export interface SEERAPIResponse {
  survivalData: SurvivalData;
  likelihoodOfCure: LikelihoodOfCure;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

// Survival data from API
export interface SurvivalData {
  timeframes: {
    sixMonth: number;
    oneYear: number;
    twoYear: number;
    fiveYear: number;
  };
  distribution: {
    worstCase: number;
    typical: number;
    bestCase: number;
  };
}

// Survival data with physician overrides - kept for backward compatibility
export interface SurvivalMatrix extends SurvivalData {
  physicianOverrides: {
    sixMonth?: number;
    oneYear?: number;
    twoYear?: number;
    fiveYear?: number;
  };
}
