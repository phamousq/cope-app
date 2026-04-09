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

// Convert audio blob to the format Whisper expects
async function audioToWhisperFormat(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  
  // Create audio context for resampling
  const audioContext = new AudioContext();
  
  try {
    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const rawData = audioBuffer.getChannelData(0); // Get mono channel
    const sourceSampleRate = audioBuffer.sampleRate;
    
    // Whisper expects 16kHz
    const targetSampleRate = 16000;
    
    if (sourceSampleRate === targetSampleRate) {
      audioContext.close();
      return rawData;
    }
    
    // Resample to 16kHz using linear interpolation
    const duration = rawData.length / sourceSampleRate;
    const targetLength = Math.floor(duration * targetSampleRate);
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
  } catch (err) {
    audioContext.close();
    // If decodeAudioData fails, try to use the raw data directly
    // This might work for some formats
    return new Float32Array(new Int16Array(arrayBuffer).slice(0));
  }
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
      
      console.log('Loading Whisper model...');
      
      // Load Whisper tiny model for faster loading
      transcriptionPipelineRef.current = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny',
        {
          progress_callback: (progress: any) => {
            if (progress.progress !== undefined) {
              console.log(`Model loading: ${Math.round(progress.progress)}%`);
            }
          },
        }
      );
      
      isModelLoadedRef.current = true;
      setStatus('ready');
      console.log('Whisper model loaded successfully');
      console.log('Pipeline type after load:', typeof transcriptionPipelineRef.current);
    } catch (err: any) {
      console.error('Failed to load Whisper model:', err);
      setError(`Failed to load model: ${err.message || 'Unknown error'}`);
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
        setStatus('loading');
        await loadModel();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to use a format that works better with Whisper
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/wav';
      }
      
      console.log('Using mime type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event);
        setError(`Recording error: ${event.error?.message || 'Unknown error'}`);
        setStatus('error');
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.onstop = async () => {
        setStatus('processing');
        stream.getTracks().forEach((track) => track.stop());
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log('Audio blob size:', audioBlob.size, 'bytes');
          
          const audioData = await audioToWhisperFormat(audioBlob);
          console.log('Audio data length:', audioData.length, 'samples');
          
          console.log('Pipeline type:', typeof transcriptionPipelineRef.current);
          console.log('Pipeline is function:', typeof transcriptionPipelineRef.current === 'function');
          
          if (audioData.length === 0) {
            throw new Error('No audio data captured');
          }
          
          // Run transcription
          console.log('Calling pipeline with audio data...');
          const result = await transcriptionPipelineRef.current(audioData, {
            max_new_tokens: 512,
            return_timestamps: false,
          });
          
          console.log('Transcription result:', result);
          console.log('Result type:', typeof result);
          console.log('Result keys:', result ? Object.keys(result) : 'none');
          
          // Handle different result formats
          let transcription = '';
          if (typeof result === 'string') {
            transcription = result.trim();
          } else if (result && typeof result === 'object') {
            transcription = (result.text || result.text || '').trim();
          }
          
          if (transcription) {
            setTranscript((prev) => (prev + ' ' + transcription).trim());
          }
        } catch (err: any) {
          console.error('Transcription error:', err);
          setError(`Transcription failed: ${err.message || 'Unknown error'}`);
        }
        
        setStatus('ready');
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setStatus('recording');
      setError(null);
      console.log('Recording started');
    } catch (err: any) {
      console.error('Failed to start recording:', err);
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
