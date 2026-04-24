/**
 * OpenRouter AI Service
 *
 * Provides AI-powered prognosis analysis using OpenRouter's unified API.
 * Uses free models for prototyping.
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'liquid/lfm-2.5-1.2b-instruct:free';

export interface AIAnalysisRequest {
  cancerType: string;
  cancerStage: string;
  treatmentGoals: string[];
  treatments: string[];
  // Optional clinical data
  tnmStage?: {
    t: string;
    n: string;
    m: string;
  };
  molecularMarkers?: string;
  biomarkers?: {
    nlr?: string;
    cea?: string;
    ca125?: string;
    psa?: string;
    ldh?: string;
  };
  patientFactors?: {
    ecog?: string;
    cci?: string;
    mgps?: string;
  };
}

export interface AIAnalysisResponse {
  analysis: string;
  confidence: 'low' | 'medium' | 'high';
  model: string;
}

/**
 * Generate AI-powered prognosis analysis
 */
export async function generateAIAnalysis(
  request: AIAnalysisRequest,
  apiKey: string,
  model: string = DEFAULT_MODEL
): Promise<AIAnalysisResponse> {
  const prompt = buildPrognosisPrompt(request);

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://cope-app.pages.dev',
      'X-Title': 'COPE - Cancer Outcomes & Prognosis Evaluation',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an oncology AI assistant helping to provide clinical context for cancer prognosis discussions.
You provide educational information only and should always remind patients to discuss their specific case with their healthcare team.
Be compassionate, clear, and avoid overly technical jargon when possible.
Never make definitive prognostic claims - always emphasize uncertainty and individual variation.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const analysis = data.choices?.[0]?.message?.content || 'Unable to generate analysis.';

  // Estimate confidence based on how complete the input data is
  const confidence = estimateConfidence(request);

  return {
    analysis,
    confidence,
    model: data.model || model,
  };
}

function buildPrognosisPrompt(request: AIAnalysisRequest): string {
  const parts: string[] = [];

  parts.push(`Please provide an educational prognosis summary for a patient with the following characteristics:

**Cancer Type:** ${request.cancerType || 'Not specified'}
**Stage:** ${request.cancerStage || 'Not specified'}
**Treatment Goals:** ${request.treatmentGoals.length > 0 ? request.treatmentGoals.join(', ') : 'Not specified'}
**Planned Treatments:** ${request.treatments.length > 0 ? request.treatments.join(', ') : 'Not specified'}`);

  if (request.tnmStage) {
    parts.push(`\n**TNM Stage:** T${request.tnmStage.t}, N${request.tnmStage.n}, M${request.tnmStage.m}`);
  }

  if (request.molecularMarkers) {
    parts.push(`\n**Molecular/Genomic Markers:** ${request.molecularMarkers}`);
  }

  const biomarkers = request.biomarkers;
  const hasBiomarkers = biomarkers && (
    biomarkers.nlr ||
    biomarkers.cea ||
    biomarkers.ca125 ||
    biomarkers.psa ||
    biomarkers.ldh
  );
  if (hasBiomarkers && biomarkers) {
    const biomarkerParts: string[] = [];
    if (biomarkers.nlr) biomarkerParts.push(`NLR: ${biomarkers.nlr}`);
    if (biomarkers.cea) biomarkerParts.push(`CEA: ${biomarkers.cea} ng/mL`);
    if (biomarkers.ca125) biomarkerParts.push(`CA-125: ${biomarkers.ca125} U/mL`);
    if (biomarkers.psa) biomarkerParts.push(`PSA: ${biomarkers.psa} ng/mL`);
    if (biomarkers.ldh) biomarkerParts.push(`LDH: ${biomarkers.ldh} U/L`);
    parts.push(`\n**Biomarkers:** ${biomarkerParts.join(', ')}`);
  }

  if (request.patientFactors) {
    const factorParts: string[] = [];
    if (request.patientFactors.ecog) factorParts.push(`ECOG: ${request.patientFactors.ecog}`);
    if (request.patientFactors.cci) factorParts.push(`Charlson Comorbidity Index: ${request.patientFactors.cci}`);
    if (request.patientFactors.mgps) factorParts.push(`mGPS: ${request.patientFactors.mgps}`);
    if (factorParts.length > 0) {
      parts.push(`\n**Patient Factors:** ${factorParts.join(', ')}`);
    }
  }

  parts.push(`\n\nPlease provide:
1. A brief educational summary of what these factors mean for prognosis
2. Factors that might improve or worsen outcomes
3. A reminder that survival statistics are population-level averages and individual outcomes vary significantly
4. Encourage discussion with their oncology team for personalized information`);

  return parts.join('');
}

function estimateConfidence(request: AIAnalysisRequest): 'low' | 'medium' | 'high' {
  let score = 0;
  
  // More complete data = higher confidence in analysis
  if (request.cancerType) score += 1;
  if (request.cancerStage) score += 1;
  if (request.treatmentGoals.length > 0) score += 1;
  if (request.treatments.length > 0) score += 1;
  if (request.tnmStage) score += 1;
  if (request.molecularMarkers) score += 1;
  if (request.biomarkers?.cea || request.biomarkers?.psa) score += 1;
  if (request.patientFactors?.ecog) score += 1;

  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}
