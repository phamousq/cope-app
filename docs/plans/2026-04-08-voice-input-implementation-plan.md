# Voice Input — Implementation Plan

> **For the agent:** REQUIRED SUB-SKILL: Use `sp-executing-plans` to implement this plan task-by-task.

**Goal:** Implement Phase 1 voice input with browser Web Speech API — start/stop recording, editable transcript, copy to clipboard.

**Architecture:** Use browser's native SpeechRecognition API wrapped in a custom React hook. Recording state managed via React state, transcript persisted using existing useSessionState hook. Simple UI with record button, transcript area, and copy action.

**Tech Stack:** React 19, TypeScript, Web Speech API (SpeechRecognition), existing useSessionState hook, Lucide icons

---

## Task 1: Create Speech Recognition Hook

**Files:**
- Create: `src/hooks/useSpeechRecognition.ts`
- Test: `src/hooks/useSpeechRecognition.test.ts`

**Step 1: Write the failing test**

```typescript
import { renderHook, act } from '@testing-library/react';
import { useSpeechRecognition } from './useSpeechRecognition';

// Mock window.SpeechRecognition
const mockRecognition = {
  continuous: true,
  interimResults: true,
  lang: 'en-US',
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  onresult: null,
  onerror: null,
  onend: null,
  onstart: null,
};

window.SpeechRecognition = jest.fn(() => mockRecognition) as any;
window.webkitSpeechRecognition = jest.fn(() => mockRecognition) as any;

describe('useSpeechRecognition', () => {
  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    expect(result.current.recordingState).toBe('idle');
    expect(result.current.transcript).toBe('');
  });

  it('should start recording when startRecording is called', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => {
      result.current.startRecording();
    });
    expect(mockRecognition.start).toHaveBeenCalled();
    expect(result.current.recordingState).toBe('recording');
  });

  it('should stop recording when stopRecording is called', () => {
    const { result } = renderHook(() => useSpeechRecognition());
    act(() => {
      result.current.startRecording();
    });
    act(() => {
      result.current.stopRecording();
    });
    expect(mockRecognition.stop).toHaveBeenCalled();
    expect(result.current.recordingState).toBe('idle');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/hooks/useSpeechRecognition.test.ts`
Expected: FAIL — file does not exist

**Step 3: Write minimal implementation**

```typescript
import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechRecognitionReturn {
  recordingState: 'idle' | 'recording' | 'processing';
  transcript: string;
  interimTranscript: string;
  startRecording: () => void;
  stopRecording: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'processing'>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece;
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
      setInterimTranscript(interimTranscript);
    };

    recognitionRef.current.onerror = (event: any) => {
      setError(event.error);
      setRecordingState('idle');
    };

    recognitionRef.current.onend = () => {
      setRecordingState('idle');
      setInterimTranscript('');
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported]);

  const startRecording = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition not supported in this browser');
      return;
    }
    setError(null);
    setRecordingState('recording');
    setInterimTranscript('');
    recognitionRef.current?.start();
  }, [isSupported]);

  const stopRecording = useCallback(() => {
    setRecordingState('processing');
    recognitionRef.current?.stop();
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    recordingState,
    transcript,
    interimTranscript,
    startRecording,
    stopRecording,
    resetTranscript,
    isSupported,
    error,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/hooks/useSpeechRecognition.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useSpeechRecognition.ts src/hooks/useSpeechRecognition.test.ts
git commit -m "feat: add useSpeechRecognition hook for Web Speech API"
```

---

## Task 2: Implement Voice Input Page

**Files:**
- Modify: `src/pages/VoiceInput.tsx`
- Test: `src/pages/VoiceInput.test.tsx`

**Step 1: Write the failing test**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VoiceInput } from './VoiceInput';
import * as useSpeechRecognition from '../hooks/useSpeechRecognition';

jest.mock('../hooks/useSpeechRecognition');

const mockUseSpeechRecognition = useSpeechRecognition as jest.MockedFunction<typeof useSpeechRecognition.useSpeechRecognition>;

describe('VoiceInput', () => {
  beforeEach(() => {
    mockUseSpeechRecognition.mockReturnValue({
      recordingState: 'idle',
      transcript: '',
      interimTranscript: '',
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      resetTranscript: jest.fn(),
      isSupported: true,
      error: null,
    });
  });

  it('should show Start Recording button when idle', () => {
    render(<VoiceInput />);
    expect(screen.getByText('Start Recording')).toBeInTheDocument();
  });

  it('should show Stop Recording button when recording', () => {
    mockUseSpeechRecognition.mockReturnValue({
      ...mockUseSpeechRecognition(),
      recordingState: 'recording',
    });
    render(<VoiceInput />);
    expect(screen.getByText('Stop Recording')).toBeInTheDocument();
  });

  it('should call startRecording when Start button is clicked', () => {
    const startRecording = jest.fn();
    mockUseSpeechRecognition.mockReturnValue({
      ...mockUseSpeechRecognition(),
      startRecording,
    });
    render(<VoiceInput />);
    fireEvent.click(screen.getByText('Start Recording'));
    expect(startRecording).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test src/pages/VoiceInput.test.tsx`
Expected: FAIL — VoiceInput component does not export or test fails

**Step 3: Write minimal implementation**

```typescript
import { Mic, Square, Copy, Trash2 } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

export function VoiceInput() {
  const {
    recordingState,
    transcript,
    interimTranscript,
    startRecording,
    stopRecording,
    resetTranscript,
    isSupported,
    error,
  } = useSpeechRecognition();

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    resetTranscript();
  };

  if (!isSupported) {
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

  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';
  const isDisabled = isProcessing;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Voice Input</h2>
        <p className="text-slate-600 mt-1">
          Hands-free data entry using speech recognition.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-8 mb-6">
        <div className="flex flex-col items-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isDisabled}
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
            {isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'Click to start recording'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Transcript
        </label>
        <textarea
          value={transcript + (interimTranscript ? ` ${interimTranscript}` : '')}
          onChange={(e) => {/* User can edit */}}
          placeholder="Your transcript will appear here..."
          className="w-full min-h-[200px] p-4 border border-slate-200 rounded-lg resize-y focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          disabled={isRecording}
        />
        <div className="flex gap-3 mt-4">
          <Button
            onClick={handleCopy}
            disabled={!transcript}
            variant="outline"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
          {transcript && (
            <Button
              onClick={handleClear}
              variant="ghost"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test src/pages/VoiceInput.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/VoiceInput.tsx src/pages/VoiceInput.test.tsx
git commit -m "feat: implement voice input page with recording and transcript"
```

---

## Task 3: Build and Verify

**Step 1: Run build**

Run: `pnpm build`
Expected: SUCCESS with no errors

**Step 2: Run dev server and verify**

Run: `pnpm dev`
Expected: Server starts on port 5173

**Step 3: Test in browser**

1. Navigate to Voice Input page
2. Click Start Recording
3. Speak a few words
4. Click Stop Recording
5. Verify transcript appears
6. Click Copy to Clipboard
7. Verify "Copied!" message

**Step 4: Commit any final changes**

```bash
git push origin feature/voice-input
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Create `useSpeechRecognition` hook with Web Speech API |
| 2 | Implement `VoiceInput` page with UI components |
| 3 | Build, verify, and push |

**Total estimated time:** 30-45 minutes
