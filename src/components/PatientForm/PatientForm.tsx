import { useState } from 'react';
import { DemographicsSection } from './DemographicsSection';
import { DiagnosisSection } from './DiagnosisSection';
import { TreatmentPlanSection } from './TreatmentPlanSection';
import { LikelihoodExpectationsSection } from './LikelihoodExpectationsSection';
import { PrognosisSection } from './PrognosisSection';
import { Button } from '@/components/ui/Button';
import { FileDown, Loader2, AlertCircle, Clipboard, Check } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import type { LikelihoodExpectations, SurvivalWithoutTreatment } from '@/types';
import { COPEDocument } from '@/components/PDF/COPEDocument';
import { useProviderData } from '@/contexts/ProviderDataContext';

const initialLikelihoodExpectations: LikelihoodExpectations = {
  sixMonth: null,
  oneYear: null,
  twoYear: null,
  fiveYear: null,
};

const initialSurvivalWithoutTreatment: SurvivalWithoutTreatment = {
  sixMonth: null,
  oneYear: null,
  twoYear: null,
  fiveYear: null,
};

interface PatientFormProps {
  onComplete: () => void;
}

export function PatientForm({ onComplete }: PatientFormProps) {
  const { formData, setFormData } = useProviderData();
  const [likelihoodExpectations, setLikelihoodExpectations] = useState<LikelihoodExpectations>(initialLikelihoodExpectations);
  const [survivalWithoutTreatment, setSurvivalWithoutTreatment] = useState<SurvivalWithoutTreatment>(initialSurvivalWithoutTreatment);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSurvivalData = formData.prognosisData.survivalSources.length > 0;

  const handleGeneratePDF = async () => {
    setError(null);
    setIsGenerating(true);

    try {
      const doc = <COPEDocument {...{
        demographics: formData.demographics,
        cancerDetails: formData.cancerDetails,
        treatmentPlan: formData.treatmentPlan,
        likelihoodExpectations,
        survivalWithoutTreatment,
        prognosisData: formData.prognosisData,
      }} />;
      const blob = await pdf(doc).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `COPE-Report-${formData.cancerDetails.typeOfCancer || 'Patient'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Clear form after successful generation
      setFormData({
        ...formData,
        demographics: { ...formData.demographics, sex: 'Male', ageGroup: '50-59', ethnicity: '' },
        cancerDetails: { ...formData.cancerDetails, typeOfCancer: '', cancerStage: 'Stage 1 - Localized', scientificName: '', whereSpread: '' },
        treatmentPlan: { ...formData.treatmentPlan, goals: [], treatments: [] },
        prognosisData: { ...formData.prognosisData, survivalSources: [], additionalContext: '' },
      });
      setLikelihoodExpectations(initialLikelihoodExpectations);
      setSurvivalWithoutTreatment(initialSurvivalWithoutTreatment);
      onComplete();
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = hasSurvivalData;

  const generatePlainText = () => {
    const lines: string[] = [];
    const { demographics, cancerDetails, treatmentPlan, prognosisData } = formData;

    lines.push('Demographics');
    lines.push(`Sex: ${demographics.sex || 'Not specified'}`);
    lines.push(`Age: ${demographics.ageGroup || 'Not specified'}`);
    lines.push(`Ethnicity: ${demographics.ethnicity || 'Not specified'}`);
    lines.push('');

    // Diagnosis
    lines.push('Diagnosis');
    lines.push(`Type of Cancer (where it started): ${cancerDetails.typeOfCancer || 'Not specified'}`);
    lines.push(`Cancer Stage: ${cancerDetails.cancerStage || 'Not specified'}`);
    lines.push(`Scientific Name for Cancer Cell Type: ${cancerDetails.scientificName || 'Not specified'}`);
    lines.push(`Where It Has Spread: ${cancerDetails.whereSpread || 'Not specified'}`);
    lines.push('');

    // Treatment
    lines.push('Treatment');
    lines.push('Goals of Treatment:');
    lines.push(treatmentPlan.goals.length > 0 ? treatmentPlan.goals.join(', ') : 'No goals specified');
    lines.push('');
    lines.push('Planned Cancer Treatments:');
    lines.push(treatmentPlan.treatments.length > 0 ? treatmentPlan.treatments.join(', ') : 'No treatments specified');
    lines.push('');

    // Likelihood of Survival
    lines.push('Likelihood of Survival');
    lines.push('With the most effective cancer treatment, how likely is it that I will live...');
    lines.push('');
    const likelihoodLevels = ['Very unlikely (<1%)', 'Unlikely (<25%)', 'Possible (25-75%)', 'Likely (>75%)'];
    lines.push(`"6 Months" "${likelihoodLevels.join('" "')}"`);
    ['sixMonth', 'oneYear', 'twoYear', 'fiveYear'].forEach((tf) => {
      const label = tf === 'sixMonth' ? '6 Months' : tf === 'oneYear' ? '1 Year' : tf === 'twoYear' ? '2 Years' : '5 Years';
      const cells = likelihoodLevels.map((level) =>
        likelihoodExpectations[tf as keyof typeof likelihoodExpectations] === level ? '[X]' : '[ ]'
      );
      lines.push(`${label.padEnd(10)}${cells.join('         ')}`);
    });
    lines.push('');

    // Survival Without Treatment
    lines.push('Survival Without Treatment');
    lines.push('Without any cancer treatment, how likely is it that I will live...');
    lines.push('');
    lines.push(`"6 Months" "${likelihoodLevels.join('" "')}"`);
    ['sixMonth', 'oneYear', 'twoYear', 'fiveYear'].forEach((tf) => {
      const label = tf === 'sixMonth' ? '6 Months' : tf === 'oneYear' ? '1 Year' : tf === 'twoYear' ? '2 Years' : '5 Years';
      const cells = likelihoodLevels.map((level) =>
        survivalWithoutTreatment[tf as keyof typeof survivalWithoutTreatment] === level ? '[X]' : '[ ]'
      );
      lines.push(`${label.padEnd(10)}${cells.join('         ')}`);
    });
    lines.push('');

    if (prognosisData.additionalContext) {
      lines.push('Additional Context:');
      lines.push(prognosisData.additionalContext);
      lines.push('');
    }

    return lines.join('\n');
  };

  const handleCopyToClipboard = async () => {
    const text = generatePlainText();
    console.log(text);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <DemographicsSection
        data={formData.demographics}
        onChange={(d) => setFormData({ ...formData, demographics: { ...formData.demographics, ...d } })}
      />
      <DiagnosisSection
        data={formData.cancerDetails}
        onChange={(d) => setFormData({ ...formData, cancerDetails: { ...formData.cancerDetails, ...d } })}
      />
      <TreatmentPlanSection
        data={formData.treatmentPlan}
        onChange={(d) => setFormData({ ...formData, treatmentPlan: { ...formData.treatmentPlan, ...d } })}
      />
      <LikelihoodExpectationsSection
        likelihoodData={likelihoodExpectations}
        survivalWithoutTreatmentData={survivalWithoutTreatment}
        onLikelihoodChange={setLikelihoodExpectations}
        onSurvivalWithoutTreatmentChange={setSurvivalWithoutTreatment}
      />
      <PrognosisSection
        data={formData.prognosisData}
        demographics={formData.demographics}
        cancerDetails={formData.cancerDetails}
        clipboardText={generatePlainText()}
        onChange={(d) => setFormData({ ...formData, prognosisData: { ...formData.prognosisData, ...d } })}
      />

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-4">
        <Button
          variant="secondary"
          onClick={handleCopyToClipboard}
          className="min-w-[200px]"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Clipboard className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </>
          )}
        </Button>
        <Button
          variant="primary"
          onClick={handleGeneratePDF}
          disabled={!isFormValid || isGenerating}
          className="min-w-[200px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4 mr-2" />
              Generate PDF Report
            </>
          )}
        </Button>
      </div>

      {!hasSurvivalData && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          Note: Add at least one survival estimate in the Prognosis section to enable PDF generation.
        </p>
      )}
    </div>
  );
}
