import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Check } from 'lucide-react';
import { SURVIVAL_SOURCES } from '@/constants/clinicalBins';
import type { PrognosisData, SurvivalSource, LikelihoodOfCure } from '@/types';

interface PrognosisSectionProps {
  data: PrognosisData;
  demographics: { sex: 'Male' | 'Female'; ageGroup: string };
  cancerDetails: { cancerStage: string; scientificName: string };
  clipboardText: string;
  onChange: (data: PrognosisData) => void;
}

export function PrognosisSection({ data, demographics, cancerDetails, clipboardText, onChange }: PrognosisSectionProps) {
  const [loadingSource, setLoadingSource] = useState<string | null>(null);
  const [copiedSource, setCopiedSource] = useState<string | null>(null);

  const initializeSourcesIfNeeded = () => {
    if (data.survivalSources.length === 0) {
      const initialSources: SurvivalSource[] = SURVIVAL_SOURCES.map(source => ({
        source,
        likelihoodOfCure: 'Possible (25-75%)',
        sixMonth: 0,
        oneYear: 0,
        twoYear: 0,
        fiveYear: 0,
      }));
      onChange({ survivalSources: initialSources });
    }
  };

  // Initialize sources on first render
  if (data.survivalSources.length === 0) {
    initializeSourcesIfNeeded();
  }

  const handleLikelihoodChange = (sourceIndex: number, value: LikelihoodOfCure) => {
    const newSources = [...data.survivalSources];
    newSources[sourceIndex] = { ...newSources[sourceIndex], likelihoodOfCure: value };
    onChange({ survivalSources: newSources });
  };

  const handleProviderChange = (field: keyof Omit<SurvivalSource, 'source' | 'likelihoodOfCure'>, value: number) => {
    const providerIndex = data.survivalSources.findIndex(s => s.source === 'Provider Estimate');
    if (providerIndex < 0) return;

    const newSources = [...data.survivalSources];
    newSources[providerIndex] = { ...newSources[providerIndex], [field]: value };
    onChange({ survivalSources: newSources });
  };

  const handleFetchSource = async (source: string) => {
    await navigator.clipboard.writeText(clipboardText);
    setCopiedSource(source);
    setTimeout(() => setCopiedSource(null), 2000);
  };

  const getSourceData = (sourceName: string): SurvivalSource | undefined => {
    return data.survivalSources.find(s => s.source === sourceName);
  };

  const getDisplayValues = (source: SurvivalSource | undefined): string => {
    if (!source) return 'No data fetched yet';
    if (source.sixMonth > 0 || source.oneYear > 0 || source.twoYear > 0 || source.fiveYear > 0) {
      return `${source.sixMonth}% / ${source.oneYear}% / ${source.twoYear}% / ${source.fiveYear}%`;
    }
    return 'No data fetched yet';
  };

  return (
    <Card title="Prognosis">
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-lg">
          <p className="text-sm text-slate-600 italic">
            Many cancers that cannot be cured can still be controlled for a period of time. No one can say how
            much time a person has left, but doctors can take what they know about you and your cancer and
            estimate how likely it is that a person will live a certain amount of time. These are very rough
            estimates, and are intended only to give a general idea of your prognosis.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-4">Estimates of Survival</h4>

          <div className="space-y-4">
            {/* Provider Estimate - Editable */}
            <div className="border border-slate-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-slate-800">Provider Estimate</span>
                <span className="text-xs text-slate-500">(Editable)</span>
              </div>

              <div className="mb-4">
                <label className="block text-xs text-slate-500 mb-1">Likelihood of Cure with Best Possible Treatment</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                  value={getSourceData('Provider Estimate')?.likelihoodOfCure || 'Possible (25-75%)'}
                  onChange={(e) => {
                    const idx = data.survivalSources.findIndex(s => s.source === 'Provider Estimate');
                    if (idx >= 0) handleLikelihoodChange(idx, e.target.value as LikelihoodOfCure);
                  }}
                >
                  <option value="Very unlikely (<1%)">Very unlikely (&lt;1%)</option>
                  <option value="Unlikely (<25%)">Unlikely (&lt;25%)</option>
                  <option value="Possible (25-75%)">Possible (25-75%)</option>
                  <option value="Likely (>75%)">Likely (&gt;75%)</option>
                </select>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">6 Months</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-center"
                    value={getSourceData('Provider Estimate')?.sixMonth || 0}
                    onChange={(e) => handleProviderChange('sixMonth', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">1 Year</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-center"
                    value={getSourceData('Provider Estimate')?.oneYear || 0}
                    onChange={(e) => handleProviderChange('oneYear', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">2 Years</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-center"
                    value={getSourceData('Provider Estimate')?.twoYear || 0}
                    onChange={(e) => handleProviderChange('twoYear', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">5 Years</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-center"
                    value={getSourceData('Provider Estimate')?.fiveYear || 0}
                    onChange={(e) => handleProviderChange('fiveYear', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* SEER Data - Button to fetch */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-slate-700">SEER Data</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFetchSource('SEER Data')}
                  disabled={loadingSource === 'SEER Data'}
                >
                  {copiedSource === 'SEER Data' ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : loadingSource === 'SEER Data' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    'Fetch Data'
                  )}
                </Button>
              </div>

              <div className="mb-3">
                <label className="block text-xs text-slate-500 mb-1">Likelihood of Cure with Best Possible Treatment</label>
                <div className="px-3 py-2 bg-slate-100 rounded border border-slate-200 text-slate-700">
                  {getSourceData('SEER Data')?.likelihoodOfCure || 'Not fetched'}
                </div>
              </div>

              <p className="text-xs text-slate-500">
                {getDisplayValues(getSourceData('SEER Data'))}
              </p>
            </div>

            {/* CancerSurvivalRates - Button to fetch */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-slate-700">CancerSurvivalRates</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFetchSource('CancerSurvivalRates')}
                  disabled={loadingSource === 'CancerSurvivalRates'}
                >
                  {copiedSource === 'CancerSurvivalRates' ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : loadingSource === 'CancerSurvivalRates' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    'Fetch Data'
                  )}
                </Button>
              </div>

              <div className="mb-3">
                <label className="block text-xs text-slate-500 mb-1">Likelihood of Cure with Best Possible Treatment</label>
                <div className="px-3 py-2 bg-slate-100 rounded border border-slate-200 text-slate-700">
                  {getSourceData('CancerSurvivalRates')?.likelihoodOfCure || 'Not fetched'}
                </div>
              </div>

              <p className="text-xs text-slate-500">
                {getDisplayValues(getSourceData('CancerSurvivalRates'))}
              </p>
            </div>

            {/* AI Analysis - Button to fetch */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-slate-700">AI Analysis</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFetchSource('AI Analysis')}
                  disabled={loadingSource === 'AI Analysis'}
                >
                  {copiedSource === 'AI Analysis' ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : loadingSource === 'AI Analysis' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    'Fetch Data'
                  )}
                </Button>
              </div>

              <div className="mb-3">
                <label className="block text-xs text-slate-500 mb-1">Likelihood of Cure with Best Possible Treatment</label>
                <div className="px-3 py-2 bg-slate-100 rounded border border-slate-200 text-slate-700">
                  {getSourceData('AI Analysis')?.likelihoodOfCure || 'Not fetched'}
                </div>
              </div>

              <p className="text-xs text-slate-500">
                {getDisplayValues(getSourceData('AI Analysis'))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
