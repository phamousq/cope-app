import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NavBar } from '@/components/NavBar/NavBar';
import { Landing, PatientView, ProviderView, VoiceInput, Backend } from '@/pages';
import { TranscriptContext, getGlobalTranscript, setGlobalTranscript } from '@/contexts/TranscriptContext';

function App() {
  const [transcript, setTranscript] = useState<string>(getGlobalTranscript());

  const updateTranscript = (newTranscript: string) => {
    setGlobalTranscript(newTranscript);
    setTranscript(newTranscript);
  };

  return (
    <TranscriptContext.Provider value={transcript}>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
          <NavBar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/patient" element={<PatientView />} />
            <Route path="/provider" element={<ProviderView />} />
            <Route path="/voice" element={<VoiceInput onTranscriptChange={updateTranscript} />} />
            <Route path="/backend" element={<Backend />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TranscriptContext.Provider>
  );
}

export default App;
