/// <reference types="vite/client" />

import { useState, useCallback, useRef, useEffect } from 'react'

export type RecordingState = 'idle' | 'recording' | 'processing'

interface StreamingRecognitionResult {
  transcript: string
  isFinal: boolean
}

export function useGoogleCloudSTT() {
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'recording' | 'error'>('idle')

  const websocketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null)

  const isSupported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  // Clean up function
  const cleanup = useCallback(() => {
    console.log('[GoogleCloudSTT] Cleaning up...');
    
    if (websocketRef.current) {
      websocketRef.current.close()
      websocketRef.current = null
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    mediaRecorderRef.current = null
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
    }
    audioContextRef.current = null
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    audioChunksRef.current = []
    
    audioWorkletNodeRef.current = null
  }, [])

  const startRecording = useCallback(async () => {
    console.log('[GoogleCloudSTT] Starting recording...');
    
    if (!isSupported) {
      const err = 'Microphone access not supported in this browser'
      console.error('[GoogleCloudSTT]', err)
      setError(err)
      return
    }

    try {
      setError(null)
      setTranscript('')
      setInterimTranscript('')
      setStatus('loading')

      // Get microphone access
      console.log('[GoogleCloudSTT] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      })
      streamRef.current = stream
      console.log('[GoogleCloudSTT] Got microphone access ✓');

      // Create AudioContext for processing
      const audioContext = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = audioContext

      // Create WebSocket connection
      const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_SPEECH_API_KEY
      if (!apiKey) {
        throw new Error('Google Cloud Speech API key not configured. Make sure VITE_GOOGLE_CLOUD_SPEECH_API_KEY is set in your .env file.')
      }

      const wsUrl = `wss://speech.googleapis.com/v1/speech:streamingRecognize?key=${apiKey}`
      console.log('[GoogleCloudSTT] Connecting to WebSocket:', wsUrl.replace(apiKey, '***'));
      
      const ws = new WebSocket(wsUrl)
      websocketRef.current = ws

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.error('[GoogleCloudSTT] WebSocket connection timeout');
          ws.close();
          setError('Connection timeout. Your network may be blocking speech.googleapis.com. Try using a VPN or switch to Browser Speech provider.');
        }
      }, 10000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('[GoogleCloudSTT] WebSocket connected ✓');
        
        // Send the streaming config first
        const config = {
          config: {
            encoding: 'WEBM_OPUS' as const,
            sampleRateHertz: 16000,
            languageCode: 'en-US',
            enableWordTimeOffsets: false,
            enableAutomaticPunctuation: true,
            model: 'default',
          },
          interimResults: true,
        }
        
        ws.send(JSON.stringify(config))
        console.log('[GoogleCloudSTT] Sent streaming config');
        
        setStatus('recording')
        setRecordingState('recording')
      }

      ws.onmessage = (event) => {
        console.log('[GoogleCloudSTT] Received message:', event.data);
        
        try {
          const response = JSON.parse(event.data)
          
          if (response.error) {
            console.error('[GoogleCloudSTT] API error:', response.error)
            setError(`API error: ${response.error.message || response.error}`)
            return
          }
          
          if (response.results) {
            for (const result of response.results) {
              const alternative = result.alternatives?.[0]
              if (alternative?.transcript) {
                const transcriptText = alternative.transcript
                
                if (result.isFinal) {
                  console.log('[GoogleCloudSTT] Final transcript:', transcriptText)
                  setTranscript(prev => {
                    const newTranscript = prev + transcriptText
                    console.log('[GoogleCloudSTT] Updated transcript:', newTranscript)
                    return newTranscript
                  })
                  setInterimTranscript('')
                } else {
                  console.log('[GoogleCloudSTT] Interim transcript:', transcriptText)
                  setInterimTranscript(transcriptText)
                }
              }
            }
          }
        } catch (err) {
          console.error('[GoogleCloudSTT] Error parsing response:', err)
        }
      }

      ws.onerror = (event) => {
        clearTimeout(connectionTimeout);
        console.error('[GoogleCloudSTT] WebSocket error:', event)
        // Don't set error here - onclose will handle it
      }

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('[GoogleCloudSTT] WebSocket closed:', event.code, event.reason)
        
        if (event.code === 1006) {
          // Abnormal closure - typically network issue
          const networkError = 'Network error: Could not connect to speech.googleapis.com. Your network is likely blocking Google services. Options: 1) Use a VPN, 2) Use Browser Speech provider (if available), 3) Deploy to Cloudflare Pages with HTTPS';
          console.error('[GoogleCloudSTT]', networkError);
          setError(networkError);
        } else if (event.code === 1000) {
          // Normal closure
          console.log('[GoogleCloudSTT] Normal connection closure');
        } else {
          setError(`Connection closed: ${event.reason || event.code}`)
        }
        
        setRecordingState('idle')
        setStatus('idle')
      }

      // Set up audio processing using AudioWorkletNode (modern) with ScriptProcessor fallback
      const source = audioContext.createMediaStreamSource(stream)
      
      // Try to use AudioWorkletNode first (modern approach)
      try {
        // Create a simple passthrough processor inline
        const audioWorkletCode = `
          class PassthroughProcessor extends AudioWorkletProcessor {
            constructor() {
              super();
              this.port.onmessage = (event) => {
                if (event.data.type === 'stop') {
                  this.port.close();
                }
              };
            }
            
            process(inputs, outputs, parameters) {
              const input = inputs[0];
              const output = outputs[0];
              
              if (input.length > 0 && output.length > 0) {
                const inputChannel = input[0];
                const outputChannel = output[0];
                
                if (inputChannel && outputChannel) {
                  // Apply simple gain and pass through
                  for (let i = 0; i < inputChannel.length; i++) {
                    outputChannel[i] = inputChannel[i];
                  }
                }
              }
              
              return true;
            }
          }
          
          registerProcessor('passthrough-processor', PassthroughProcessor);
        `;
        
        const blob = new Blob([audioWorkletCode], { type: 'application/javascript' });
        const audioWorkletUrl = URL.createObjectURL(blob);
        
        await audioContext.audioWorklet.addModule(audioWorkletUrl);
        
        const workletNode = new AudioWorkletNode(audioContext, 'passthrough-processor');
        audioWorkletNodeRef.current = workletNode;
        
        // Route audio through worklet to capture samples
        const scriptProcessorForCapture = audioContext.createScriptProcessor(4096, 1, 1);
        
        source.connect(scriptProcessorForCapture);
        source.connect(workletNode);
        workletNode.connect(audioContext.destination);
        
        // Send audio data via WebSocket
        scriptProcessorForCapture.onaudioprocess = (audioEvent) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = audioEvent.inputBuffer.getChannelData(0)
            
            // Convert Float32Array to Int16Array (LINEAR16 PCM)
            const int16Array = new Int16Array(inputData.length)
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]))
              int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
            }
            
            // Convert Int16Array to base64
            const uint8Array = new Uint8Array(int16Array.buffer)
            let binary = ''
            for (let i = 0; i < uint8Array.length; i++) {
              binary += String.fromCharCode(uint8Array[i])
            }
            const base64 = btoa(binary)
            
            const audioContent = {
              audio: {
                content: base64,
              }
            }
            
            ws.send(JSON.stringify(audioContent))
          }
        };
        
        // Keep reference to prevent garbage collection
        mediaRecorderRef.current = scriptProcessorForCapture as any;
        
        console.log('[GoogleCloudSTT] Using AudioWorkletNode + ScriptProcessor (hybrid mode)');
        
      } catch (workletError) {
        console.warn('[GoogleCloudSTT] AudioWorkletNode failed, using ScriptProcessor fallback:', workletError);
        
        // Fallback to deprecated but functional ScriptProcessor
        const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
        
        source.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);
        
        scriptProcessor.onaudioprocess = (audioEvent) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = audioEvent.inputBuffer.getChannelData(0)
            
            // Convert Float32Array to Int16Array (LINEAR16 PCM)
            const int16Array = new Int16Array(inputData.length)
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]))
              int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
            }
            
            // Convert Int16Array to base64
            const uint8Array = new Uint8Array(int16Array.buffer)
            let binary = ''
            for (let i = 0; i < uint8Array.length; i++) {
              binary += String.fromCharCode(uint8Array[i])
            }
            const base64 = btoa(binary)
            
            const audioContent = {
              audio: {
                content: base64,
              }
            }
            
            ws.send(JSON.stringify(audioContent))
          }
        };
        
        mediaRecorderRef.current = scriptProcessor as any;
        console.log('[GoogleCloudSTT] Using deprecated ScriptProcessor (browser may show warning)');
      }

      console.log('[GoogleCloudSTT] Recording started');

    } catch (err: any) {
      console.error('[GoogleCloudSTT] Error starting recording:', err)
      const errorMessage = err.message || String(err)
      setError(`Failed to start: ${errorMessage}`)
      cleanup()
    }
  }, [isSupported, cleanup])

  const stopRecording = useCallback(() => {
    console.log('[GoogleCloudSTT] Stopping recording...')
    
    cleanup()
    setRecordingState('idle')
    setStatus('idle')
    
    console.log('[GoogleCloudSTT] Recording stopped')
  }, [cleanup])

  const resetTranscript = useCallback(() => {
    console.log('[GoogleCloudSTT] Resetting transcript')
    setTranscript('')
    setInterimTranscript('')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    transcript,
    interimTranscript,
    recordingState,
    startRecording,
    stopRecording,
    resetTranscript,
    isSupported,
    error,
    status,
  }
}
