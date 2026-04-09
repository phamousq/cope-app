import { useState } from 'react';
import { Mic, Square, Copy, Trash2, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useWhisperSTT } from '@/hooks/useWhisperSTT';

type STTProvider = 'webspeech' | 'whisper';

export function VoiceInput() {
  const [sttProvider, setSttProvider] = useState<STTProvider>('webspeech');
  const [transcript, setTranscript] = useState('');
  const [copied, setCopied] = useState(false);

  // Web Speech API hook
  const webSpeech = useSpeechRecognition();

  // Whisper STT hook
  const whisper = useWhisperSTT();

  // Determine which provider is active
  const displayTranscript = sttProvider === 'webspeech' 
    ? (webSpeech.transcript || transcript)
    : (whisper.transcript || transcript);
  
  const isRecording = sttProvider === 'webspeech' 
    ? webSpeech.recordingState === 'recording'
    : whisper.status === 'recording';
  
  const isProcessing = sttProvider === 'webspeech'
    ? webSpeech.recordingState === 'processing'
    : whisper.status === 'processing' || whisper.status === 'loading';
  
  const isDisabled = isProcessing || (sttProvider === 'whisper' && whisper.status === 'loading');
  
  const activeError = sttProvider === 'webspeech' ? webSpeech.error : whisper.error;

  // Check if Web Speech failed with network error and offer Whisper fallback
  const showWhisperFallback = webSpeech.error?.toLowerCase().includes('network') ||
    webSpeech.error?.toLowerCase().includes('service not allowed') ||
    !webSpeech.isSupported;

  const handleStartRecording = async () => {
    if (sttProvider === 'webspeech') {
      await webSpeech.startRecording();
    } else {
      await whisper.startRecording();
    }
  };

  const handleStopRecording = () => {
    if (sttProvider === 'webspeech') {
      webSpeech.stopRecording();
    } else {
      whisper.stopRecording();
    }
  };

  const handleCopy = async () => {
    const textToCopy = sttProvider === 'webspeech'
      ? (webSpeech.transcript || transcript)
      : (whisper.transcript || transcript);
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (sttProvider === 'webspeech') {
      webSpeech.resetTranscript();
    } else {
      whisper.resetTranscript();
    }
    setTranscript('');
  };

  // Both not supported
  if (!webSpeech.isSupported && !whisper.isSupported) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Voice Input</h2>
          <p className="text-slate-600 mt-1">
            Hands-free data entry using speech recognition.
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-700">
            Speech recognition is not supported in this browser. Please use Chrome or Edge.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Voice Input</h2>
        <p className="text-slate-600 mt-1">
          Hands-free data entry using speech recognition.
        </p>
      </div>

      {/* Provider selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSttProvider('webspeech')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            sttProvider === 'webspeech'
              ? 'bg-purple-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Browser Speech (Fast)
        </button>
        <button
          onClick={() => setSttProvider('whisper')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            sttProvider === 'whisper'
              ? 'bg-purple-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <WifiOff className="w-4 h-4" />
          Whisper AI (Works Offline)
        </button>
      </div>

      {/* Whisper model loading indicator */}
      {sttProvider === 'whisper' && whisper.status === 'loading' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <p className="text-blue-700">
            Loading Whisper AI model (~75MB, downloaded once and cached)...
          </p>
        </div>
      )}

      {/* Error display */}
      {activeError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700">{activeError}</p>
          {sttProvider === 'webspeech' && showWhisperFallback && (
            <button
              onClick={() => setSttProvider('whisper')}
              className="mt-2 text-sm text-purple-600 hover:text-purple-800 underline"
            >
              Switch to Whisper AI (works offline/in China)
            </button>
          )}
        </div>
      )}

      {/* Recording UI */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 mb-6">
        <div className="flex flex-col items-center">
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isDisabled || (sttProvider === 'whisper' && whisper.status === 'loading')}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center transition-all
              ${isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-purple-500 hover:bg-purple-600'}
              ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
              text-white shadow-lg
            `}
          >
            {isRecording ? (
              <Square className="w-8 h-8 fill-current" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </button>
          <p className="mt-4 text-slate-600 font-medium">
            {isRecording 
              ? 'Recording...' 
              : isProcessing 
                ? 'Processing...' 
                : sttProvider === 'whisper' && whisper.status === 'loading'
                  ? 'Loading model...'
                  : 'Click to start recording'}
          </p>
          {isRecording && (
            <div className="flex items-center gap-2 mt-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-slate-500">Speak now</span>
            </div>
          )}
          {sttProvider === 'whisper' && whisper.status === 'ready' && !isRecording && (
            <p className="mt-2 text-xs text-slate-400">
              Whisper model ready
            </p>
          )}
        </div>
      </div>

      {/* Transcript display */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Transcript
        </label>
        <textarea
          value={displayTranscript + (sttProvider === 'webspeech' && webSpeech.interimTranscript ? ` ${webSpeech.interimTranscript}` : '')}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={
            sttProvider === 'whisper' 
              ? "Your transcript will appear here after recording..." 
              : "Your transcript will appear here..."
          }
          className="w-full min-h-[200px] p-4 border border-slate-200 rounded-lg resize-y focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          readOnly={isRecording}
        />
        <div className="flex gap-3 mt-4">
          <Button
            onClick={handleCopy}
            disabled={!displayTranscript}
            variant="outline"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
          {displayTranscript && (
            <button
              onClick={handleClear}
              className="inline-flex items-center justify-center px-4 py-2.5 text-base font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
