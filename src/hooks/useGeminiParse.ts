import { useState, useCallback } from 'react';

export interface ParsedClinicalData {
  // Demographics
  sex: 'Male' | 'Female' | '';
  numericAge: string;
  ageGroup: string;
  ethnicity: string;
  dateOfDiagnosis: string;

  // Cancer Details
  typeOfCancer: string;
  tStage: string;
  nStage: string;
  mStage: string;
  overallStage: string;
  lymphNodes: string;
  metastaticSpread: string;
  cancerSize: string;
  scientificName: string;

  // Clinical Molecular
  molecularGenomicMarkers: string;
  nlr: string;
  cea: string;
  ca125: string;
  psa: string;
  psaDoublingTime: string;
  ldh: string;
  treatmentResponse: string;
  cellDiff: string;

  // Patient Factors
  ecogStatus: string;
  charlsonComorbidityIndex: string;
  mgps: string;
  physiologicAge: string;

  // Treatment Plan
  treatmentGoals: string[];
  treatments: string[];

  // Survival
  survivalEstimates: {
    sixMonth: string;
    oneYear: string;
    twoYear: string;
    fiveYear: string;
  };
}

export interface UseGeminiParseReturn {
  isParsing: boolean;
  error: string | null;
  parse: (transcript: string, apiKey: string, model: string) => Promise<ParsedClinicalData | null>;
}

const PARSE_PROMPT = `You are a clinical data extraction AI. Parse the following medical transcript and extract structured patient data.

Return ONLY a valid JSON object with these fields (no markdown, no explanation):

{
  "sex": "Male" or "Female" or "" (empty string if unknown),
  "numericAge": "e.g. 65" (age as number in string, or "" if unknown),
  "ageGroup": "50-59" or "60-69" etc (derived from numericAge, or "" if unknown),
  "ethnicity": "e.g. Hispanic/Latino, Non-Hispanic White, African American, Asian, Other" or "",
  "dateOfDiagnosis": "YYYY-MM-DD" or "" if not mentioned,

  "typeOfCancer": "e.g. Lung, Colon, Breast, Prostate" or "",
  "tStage": "T1, T2, T3, T4, Tx" or "",
  "nStage": "N0, N1, N2, N3, Nx" or "",
  "mStage": "M0, M1, M1a, M1b, Mx" or "",
  "overallStage": "Stage 1 - Localized, Stage 2 - Localized, Stage 3 - Regional, Stage 4 - Metastatic" or "",
  "lymphNodes": "brief description of lymph node involvement or """,
  "metastaticSpread": "description of metastatic spread or """,
  "cancerSize": "tumor size if mentioned or """,
  "scientificName": "histology / scientific name e.g. Adenocarcinoma, Neuroendocrine tumor or """,

  "molecularGenomicMarkers": "e.g. KRAS mutation, BRCA1, PD-L1 positive or """,
  "nlr": "Neutrophil-to-Lymphocyte Ratio value or """,
  "cea": "CEA level or """,
  "ca125": "CA-125 level or """,
  "psa": "PSA level or """,
  "psaDoublingTime": "PSA doubling time or """,
  "ldh": "LDH level or """,
  "treatmentResponse": "description of treatment response or """,
  "cellDiff": "Well differentiated (Grade I), Moderately differentiated (Grade II), Poorly differentiated (Grade III), or Undifferentiated (Grade IV) or """,

  "ecogStatus": "0, 1, 2, 3, 4 or """,
  "charlsonComorbidityIndex": "CCI score 0-10+ or """,
  "mgps": "mGPS 0, 1, or 2 or """,
  "physiologicAge": "physiologic age if mentioned or """,

  "treatmentGoals": ["Cure", "Remission", "Longer life", "Better quality of life", "Comfort"] (array of relevant goals, empty array if unknown),
  "treatments": ["Radiation", "Surgery", "Chemotherapy", "Immunotherapy", "Targeted Therapy", "Hormone Therapy", "Other"] (treatments mentioned, empty array if none),

  "survivalEstimates": {
    "sixMonth": "Very unlikely (<1%), Unlikely (<25%), Possible (25-75%), Likely (>75%), or """,
    "oneYear": "same options or """,
    "twoYear": "same options or """,
    "fiveYear": "same options or ""
  }
}

TRANSCRIPT TO PARSE:
`;

export function useGeminiParse(): UseGeminiParseReturn {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback(async (transcript: string, apiKey: string, model: string): Promise<ParsedClinicalData | null> => {
    if (!transcript.trim()) {
      setError('No transcript to parse.');
      return null;
    }

    if (!apiKey) {
      setError('Gemini API key not configured.');
      return null;
    }

    setIsParsing(true);
    setError(null);

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: PARSE_PROMPT + transcript }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.1,
            maxOutputTokens: 2048,
          }
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('No response from Gemini model.');
      }

      // Strip markdown code fences if present
      let jsonStr = rawText.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      const parsed = JSON.parse(jsonStr) as ParsedClinicalData;

      // Basic validation
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Invalid response format from Gemini.');
      }

      return parsed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error parsing transcript.';
      setError(message);
      return null;
    } finally {
      setIsParsing(false);
    }
  }, []);

  return { isParsing, error, parse };
}
