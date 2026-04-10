/// <reference types="vite/client" />

import { useState, useCallback, useRef, useEffect } from 'react'

export type RecordingState = 'idle' | 'recording' | 'processing'

export function useAssemblyAI() {
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'recording' | 'error'>('idle')

  const websocketRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)

  const isSupported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  const cleanup = useCallback(() => {
    console.log('[AssemblyAI] Cleaning up...');
    
    if (websocketRef.current) {
      websocketRef.current.close()
      websocketRef.current = null
    }
    
    if (processorRef.current) {
      try {
        processorRef.current.disconnect()
      } catch (e) {}
      processorRef.current = null
    }
    
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect()
      } catch (e) {}
      sourceRef.current = null
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const startRecording = useCallback(async () => {
    console.log('[AssemblyAI] Starting recording...');
    
    if (!isSupported) {
      const err = 'Microphone access not supported in this browser'
      console.error('[AssemblyAI]', err)
      setError(err)
      return
    }

    try {
      setError(null)
      setTranscript('')
      setInterimTranscript('')
      setStatus('loading')

      // Get microphone access
      console.log('[AssemblyAI] Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      })
      streamRef.current = stream
      console.log('[AssemblyAI] Got microphone access ✓');

      // Create AudioContext
      const audioContext = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = audioContext

      // Create WebSocket connection to AssemblyAI
      const apiKey = import.meta.env.VITE_ASSEMBLYAI_API_KEY
      if (!apiKey) {
        throw new Error('AssemblyAI API key not configured. Set VITE_ASSEMBLYAI_API_KEY in your .env file.')
      }

      // AssemblyAI streaming endpoint - pass API key as query param for browser WebSocket
      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?api_key=${apiKey}`
      console.log('[AssemblyAI] Connecting to WebSocket:', wsUrl.replace(apiKey, '***'));
      
      const ws = new WebSocket(wsUrl)
      websocketRef.current = ws

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.error('[AssemblyAI] WebSocket connection timeout');
          ws.close();
          setError('Connection timeout. Check your network and API key.');
        }
      }, 15000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('[AssemblyAI] WebSocket connected ✓');
        
        // Send audio streaming config
        const config = {
          audio: {
            sample_rate: 16000,
            bit_rate: 128000,
            language_code: 'en_us',
            codec: 'pcm_s16le',
          },
          streaming_model: 'nano',
          bilingual_optimization_enabled: false,
          language_detection_enabled: false,
        }
        
        ws.send(JSON.stringify(config))
        console.log('[AssemblyAI] Sent streaming config');
        
        setStatus('recording')
        setRecordingState('recording')
      }

      ws.onmessage = (event) => {
        console.log('[AssemblyAI] Received message:', event.data);
        
        try {
          const data = JSON.parse(event.data)
          
          if (data.error) {
            console.error('[AssemblyAI] API error:', data.error)
            setError(`API error: ${data.error}`)
            return
          }
          
          if (data.message_type === 'FinalTranscript') {
            const text = data.text || ''
            console.log('[AssemblyAI] Final transcript:', text)
            if (text) {
              setTranscript(prev => {
                const newTranscript = prev + (prev ? ' ' : '') + text
                console.log('[AssemblyAI] Updated transcript:', newTranscript)
                return newTranscript
              })
            }
            setInterimTranscript('')
          } else if (data.message_type === 'PartialTranscript') {
            const text = data.text || ''
            console.log('[AssemblyAI] Interim transcript:', text)
            setInterimTranscript(text)
          } else if (data.message_type === 'SessionBegins') {
            console.log('[AssemblyAI] Session started, audio duration:', data.audio_duration, 'seconds')
          }
        } catch (err) {
          console.error('[AssemblyAI] Error parsing response:', err)
        }
      }

      ws.onerror = (event) => {
        clearTimeout(connectionTimeout);
        console.error('[AssemblyAI] WebSocket error:', event)
      }

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('[AssemblyAI] WebSocket closed:', event.code, event.reason)
        
        if (event.code === 1006) {
          setError('Network error: Could not connect to AssemblyAI servers. Check your network connection.')
        } else if (event.code !== 1000) {
          setError(`Connection closed: ${event.reason || event.code}`)
        }
        
        setRecordingState('idle')
        setStatus('idle')
      }

      // Set up audio capture using ScriptProcessor
      // Note: In production, AudioWorklet would be preferred, but ScriptProcessor is more widely supported
      const source = audioContext.createMediaStreamSource(stream)
      sourceRef.current = source

      // Create processor to capture audio chunks
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (audioEvent) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = audioEvent.inputBuffer.getChannelData(0)
          
          // Convert Float32Array to Int16Array (LINEAR16 PCM)
          const int16Array = new Int16Array(inputData.length)
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]))
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
          }
          
          // Send as binary message
          ws.send(int16Array.buffer)
        }
      }

      // Connect audio pipeline
      source.connect(processor)
      processor.connect(audioContext.destination)

      console.log('[AssemblyAI] Recording started');

    } catch (err: any) {
      console.error('[AssemblyAI] Error starting recording:', err)
      const errorMessage = err.message || String(err)
      setError(`Failed to start: ${errorMessage}`)
      cleanup()
    }
  }, [isSupported, cleanup])

  const stopRecording = useCallback(() => {
    console.log('[AssemblyAI] Stopping recording...')
    cleanup()
    setRecordingState('idle')
    setStatus('idle')
    console.log('[AssemblyAI] Recording stopped')
  }, [cleanup])

  const resetTranscript = useCallback(() => {
    console.log('[AssemblyAI] Resetting transcript')
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
