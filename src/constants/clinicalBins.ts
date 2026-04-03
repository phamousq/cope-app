import type { AgeGroup, CancerStage, TreatmentGoal, Treatment, LikelihoodOfCure, SurvivalTimeframe } from '@/types';

export const AGE_GROUPS: AgeGroup[] = ['18-34', '35-49', '50-59', '60-69', '70-79', '80-90'];

export const CANCER_STAGES: CancerStage[] = ['Stage 1 - Localized', 'Stage 2 - Localized', 'Stage 3 - Regional', 'Stage 4 - Metastatic'];

export const TREATMENT_GOALS: TreatmentGoal[] = [
  'Cure',
  'Remission',
  'Better quality of life',
  'Longer life',
  'Comfort',
];

export const TREATMENTS: Treatment[] = [
  'Radiation',
  'Surgery',
  'Chemotherapy',
  'Immunotherapy',
  'Targeted Therapy',
  'Hormone Therapy',
  'Other',
];

export const LIKELIHOOD_OF_CURE: LikelihoodOfCure[] = [
  'Very unlikely (<1%)',
  'Unlikely (<25%)',
  'Possible (25-75%)',
  'Likely (>75%)',
];

export const SURVIVAL_SOURCES = [
  'SEER Data',
  'CancerSurvivalRates',
  'AI Analysis',
] as const;

export const LIKELIHOOD_LEVELS: LikelihoodOfCure[] = [
  'Very unlikely (<1%)',
  'Unlikely (<25%)',
  'Possible (25-75%)',
  'Likely (>75%)',
];

export const SURVIVAL_TIMEFRAMES: { key: SurvivalTimeframe; label: string }[] = [
  { key: 'sixMonth', label: '6 Months' },
  { key: 'oneYear', label: '1 Year' },
  { key: 'twoYear', label: '2 Years' },
  { key: 'fiveYear', label: '5 Years' },
];
