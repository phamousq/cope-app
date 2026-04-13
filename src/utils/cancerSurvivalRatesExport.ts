/**
 * CancerSurvivalRates.com Export Utility
 * Converts COPE form data to cancersurvivalrates.com JSON format
 */

// Exact cancer types accepted by cancersurvivalrates.com
export const CANCER_TYPES = [
  'Anal',
  'Bladder',
  'Bone',
  'Breast',
  'Breast without subtype',
  'Cervical',
  'Chronic lymphocytic leukemia',
  'Colon',
  'Esophagus',
  'Hodgkin\'s lymphoma',
  'Hypopharynx',
  'Kidney',
  'Larynx',
  'Liver',
  'Lung',
  'Melanoma',
  'Myeloma',
  'Nasopharynx',
  'Non-Hodgkin\'s lymphoma',
  'Oral cavity',
  'Oropharynx / tonsil',
  'Ovarian',
  'Pancreatic',
  'Prostate',
  'Prostate without Gleason',
  'Rectal',
  'Salivary gland',
  'Soft tissue sarcoma',
  'Stomach',
  'Thyroid',
  'Ureter',
  'Uterine',
] as const;

export type CancerType = typeof CANCER_TYPES[number];

// Mapping from common COPE cancer type variations to target site types
const CANCER_TYPE_MAP: Record<string, CancerType> = {
  'anal': 'Anal',
  'anal cancer': 'Anal',
  'bladder': 'Bladder',
  'bladder cancer': 'Bladder',
  'bone': 'Bone',
  'bone cancer': 'Bone',
  'breast': 'Breast',
  'breast cancer': 'Breast',
  'cervical': 'Cervical',
  'cervix': 'Cervical',
  'chronic lymphocytic leukemia': 'Chronic lymphocytic leukemia',
  'cll': 'Chronic lymphocytic leukemia',
  'colon': 'Colon',
  'colon cancer': 'Colon',
  'colorectal': 'Colon',
  'esophageal': 'Esophagus',
  'esophagus': 'Esophagus',
  'hodgkin': 'Hodgkin\'s lymphoma',
  'hodgkin\'s lymphoma': 'Hodgkin\'s lymphoma',
  'hypopharynx': 'Hypopharynx',
  'kidney': 'Kidney',
  'renal': 'Kidney',
  'laryngeal': 'Larynx',
  'larynx': 'Larynx',
  'liver': 'Liver',
  'hepatocellular': 'Liver',
  'lung': 'Lung',
  'lung cancer': 'Lung',
  'nsclc': 'Lung',
  'melanoma': 'Melanoma',
  'skin melanoma': 'Melanoma',
  'myeloma': 'Myeloma',
  'multiple myeloma': 'Myeloma',
  'nasopharynx': 'Nasopharynx',
  'nasopharyngeal': 'Nasopharynx',
  'non-hodgkin': 'Non-Hodgkin\'s lymphoma',
  'non-hodgkin\'s lymphoma': 'Non-Hodgkin\'s lymphoma',
  'nhl': 'Non-Hodgkin\'s lymphoma',
  'oral': 'Oral cavity',
  'oral cavity': 'Oral cavity',
  'oropharynx': 'Oropharynx / tonsil',
  'tonsil': 'Oropharynx / tonsil',
  'tonsillar': 'Oropharynx / tonsil',
  'ovarian': 'Ovarian',
  'ovary': 'Ovarian',
  'pancreatic': 'Pancreatic',
  'pancreas': 'Pancreatic',
  'prostate': 'Prostate',
  'prostate cancer': 'Prostate',
  'rectal': 'Rectal',
  'rectum': 'Rectal',
  'rectal cancer': 'Rectal',
  'salivary': 'Salivary gland',
  'salivary gland': 'Salivary gland',
  'soft tissue': 'Soft tissue sarcoma',
  'soft tissue sarcoma': 'Soft tissue sarcoma',
  'sarcoma': 'Soft tissue sarcoma',
  'stomach': 'Stomach',
  'gastric': 'Stomach',
  'gastric cancer': 'Stomach',
  'thyroid': 'Thyroid',
  'thyroid cancer': 'Thyroid',
  'ureter': 'Ureter',
  'uterine': 'Uterine',
  'endometrial': 'Uterine',
  'uterine cancer': 'Uterine',
};

// Histology mapping for colon cancer (most common example)
const COLON_HISTOLOGY_MAP: Record<string, string> = {
  'adenocarcinoma': 'adenocarcinoma',
  'neuroendocrine': 'neuroendocrine',
  'mucinous': 'mucinous adenocarcinoma',
  'signet ring': 'signet ring cell carcinoma',
  'serrated': 'serrated adenocarcinoma',
};

// Map ageGroup midpoint to numeric age
const AGE_GROUP_MIDPOINTS: Record<string, number> = {
  '18-34': 26,
  '35-49': 42,
  '50-59': 55,
  '60-69': 65,
  '70-79': 75,
  '80-90': 85,
};

/**
 * Calculate months since diagnosis from dateOfDiagnosis
 */
function calculateMonthsSinceDiagnosis(dateOfDiagnosis: string | undefined): number | null {
  if (!dateOfDiagnosis) return null;

  try {
    const diagnosed = new Date(dateOfDiagnosis);
    if (isNaN(diagnosed.getTime())) return null;

    const now = new Date();
    const diffMs = now.getTime() - diagnosed.getTime();
    const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));

    if (diffMonths < 1) return 1;
    if (diffMonths > 24) return 25; // "longer" indicator
    return diffMonths;
  } catch {
    return null;
  }
}

/**
 * Compute stage (1, 2/3, 4) from TNM stages
 * T4 or M1 → 4
 * T3, N2, or any N>0 with significant → 2/3
 * otherwise → 1
 */
function computeStageFromTNM(tStage: string, nStage: string, mStage: string): '1' | '2/3' | '4' {
  const t = tStage.toUpperCase();
  const n = nStage.toUpperCase();
  const m = mStage.toUpperCase();

  // M1 always stage 4
  if (m === 'M1' || m === 'M1A' || m === 'M1B' || m === 'M1C') return '4';

  // T4 is stage 4
  if (t === 'T4' || t === 'T4A' || t === 'T4B') return '4';

  // N2/N3 or T3 suggests regional spread → stage 2/3
  if (n === 'N2' || n === 'N2A' || n === 'N2B' || n === 'N3' || t === 'T3') return '2/3';

  // N1 is also 2/3
  if (n === 'N1' || n === 'N1A' || n === 'N1B' || n === 'N1C') return '2/3';

  // Otherwise localized → stage 1
  return '1';
}

/**
 * Map COPE cancer type to target site type
 */
function mapCancerType(typeOfCancer: string): { mapped: CancerType; exact: boolean } {
  const normalized = typeOfCancer.toLowerCase().trim();

  if (CANCER_TYPE_MAP[normalized]) {
    return { mapped: CANCER_TYPE_MAP[normalized], exact: true };
  }

  // Try partial matching for unknown types
  for (const [key, value] of Object.entries(CANCER_TYPE_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { mapped: value, exact: false };
    }
  }

  // Return colon as fallback (most common) but mark as unmapped
  return { mapped: 'Colon', exact: false };
}

/**
 * Map histology string to target site histology
 */
function mapHistology(histology: string, cancerType: CancerType): string {
  if (!histology) return '';

  const normalized = histology.toLowerCase();

  // Colon-specific histology mapping
  if (cancerType === 'Colon') {
    for (const [key, value] of Object.entries(COLON_HISTOLOGY_MAP)) {
      if (normalized.includes(key)) {
        return value;
      }
    }
  }

  // Return as-is for other cancers (target site may accept free text)
  return histology;
}

/**
 * Map sex to target site format (lowercase)
 */
function mapSex(sex: string): 'male' | 'female' | null {
  if (!sex) return null;
  const normalized = sex.toLowerCase();
  if (normalized === 'male') return 'male';
  if (normalized === 'female') return 'female';
  if (normalized === 'other') return 'female'; // default to female for "other"
  return null;
}

/**
 * Export interface matching cancersurvivalrates.com input format
 */
export interface CancerSurvivalRatesExport {
  type: CancerType;
  sex: 'male' | 'female';
  age: number;
  stage: '1' | '2/3' | '4';
  cellDiff?: 'well' | 'moderately' | 'poor';
  monthDiagnosed: number;
  histology?: string;
  // Warnings for fields that couldn't be mapped
  warnings?: string[];
}

export interface ExportOptions {
  tStage: string;
  nStage: string;
  mStage: string;
  typeOfCancer: string;
  sex: string;
  ageGroup: string;
  numericAge?: string;
  scientificName?: string;
  dateOfDiagnosis?: string;
}

/**
 * Main export function
 */
export function exportToCancerSurvivalRates(data: ExportOptions): CancerSurvivalRatesExport | { error: string; warnings: string[] } {
  const warnings: string[] = [];

  // Map cancer type
  const { mapped: cancerType, exact } = mapCancerType(data.typeOfCancer);
  if (!exact) {
    warnings.push(`Cancer type "${data.typeOfCancer}" not found. Using "${cancerType}" as closest match.`);
  }

  // Map sex
  const sex = mapSex(data.sex);
  if (!sex) {
    warnings.push(`Sex "${data.sex}" not recognized.`);
  }

  // Get age
  let age: number;
  if (data.numericAge && !isNaN(Number(data.numericAge))) {
    age = Number(data.numericAge);
  } else if (data.ageGroup && AGE_GROUP_MIDPOINTS[data.ageGroup]) {
    age = AGE_GROUP_MIDPOINTS[data.ageGroup];
  } else {
    warnings.push('Age could not be determined. Using 65 as default.');
    age = 65;
  }

  // Clamp age to valid range
  if (age < 18) {
    warnings.push(`Age ${age} is below minimum (18). Using 18.`);
    age = 18;
  }
  if (age > 120) {
    warnings.push(`Age ${age} is above maximum (120). Using 120.`);
    age = 120;
  }

  // Compute stage from TNM
  const stage = computeStageFromTNM(data.tStage, data.nStage, data.mStage);

  // Calculate months since diagnosis
  const monthDiagnosed = calculateMonthsSinceDiagnosis(data.dateOfDiagnosis);
  if (monthDiagnosed === null) {
    warnings.push('Date of diagnosis not provided. Using 1 month as default.');
  }

  // Map histology
  const histology = data.scientificName
    ? mapHistology(data.scientificName, cancerType)
    : undefined;

  if (!sex) {
    return {
      error: 'Required fields missing',
      warnings,
    };
  }

  return {
    type: cancerType,
    sex,
    age,
    stage,
    monthDiagnosed: monthDiagnosed ?? 1,
    ...(histology && { histology }),
    ...(warnings.length > 0 && { warnings }),
  };
}
