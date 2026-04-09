import { useState, useRef, useCallback, useEffect } from 'react';
import { pipeline } from '@xenova/transformers';

export type WhisperStatus = 'idle' | 'loading' | 'ready' | 'recording' | 'processing' | 'error';

export interface UseWhisperSTTReturn {
  transcript: string;
  interimTranscript: string;
  status: WhisperStatus;
  isSupported: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetTranscript: () => void;
}

// Convert audio blob to Float32Array at 16kHz mono
async function audioBlobToFloat32(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Get the mono channel data at 16kHz
  const rawData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  // Resample to 16kHz if needed
  if (sampleRate !== 16000) {
    const duration = rawData.length / sampleRate;
    const targetLength = Math.floor(duration * 16000);
    const resampled = new Float32Array(targetLength);
    for (let i = 0; i < targetLength; i++) {
      const srcIndex = (i / targetLength) * rawData.length;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, rawData.length - 1);
      const t = srcIndex - srcIndexFloor;
      resampled[i] = (1 - t) * rawData[srcIndexFloor] + t * rawData[srcIndexCeil];
    }
    audioContext.close();
    return resampled;
  }
  
  audioContext.close();
  return rawData;
}

export function useWhisperSTT(): UseWhisperSTTReturn {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [status, setStatus] = useState<WhisperStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const transcriptionPipelineRef = useRef<any>(null);
  const isModelLoadedRef = useRef(false);

  const isSupported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  const loadModel = useCallback(async () => {
    if (isModelLoadedRef.current) return;
    
    try {
      setStatus('loading');
      setError(null);
      
      // Load Whisper tiny model for faster loading (can switch to small.en later)
      transcriptionPipelineRef.current = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny', // Using tiny for faster initial load
        {
          progress_callback: (progress: any) => {
            if (progress.progress !== undefined) {
              console.log(`Loading model: ${Math.round(progress.progress)}%`);
            }
          },
        }
      );
      
      isModelLoadedRef.current = true;
      setStatus('ready');
    } catch (err) {
      console.error('Failed to load Whisper model:', err);
      setError('Failed to load speech recognition model. Please check your connection.');
      setStatus('error');
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Audio recording is not supported in this browser');
      return;
    }

    try {
      // Load model if not already loaded
      if (!isModelLoadedRef.current) {
        await loadModel();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setStatus('processing');
        stream.getTracks().forEach((track) => track.stop());
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioData = await audioBlobToFloat32(audioBlob);
          
          const result = await transcriptionPipelineRef.current(audioData, {
            max_new_tokens: 512,
            return_timestamps: false,
          });
          
          const transcription = result.text?.trim() || '';
          if (transcription) {
            setTranscript((prev) => (prev + ' ' + transcription).trim());
          }
        } catch (err) {
          console.error('Transcription error:', err);
          setError('Failed to transcribe audio');
        }
        
        setStatus('ready');
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setStatus('recording');
      setError(null);
    } catch (err: any) {
      console.error('Recording error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow microphone access.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found.');
      } else {
        setError(`Failed to start recording: ${err.message}`);
      }
      setStatus('error');
    }
  }, [isSupported, loadModel]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return {
    transcript,
    interimTranscript,
    status,
    isSupported,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
  };
}
