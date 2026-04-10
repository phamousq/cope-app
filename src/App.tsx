import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NavBar } from '@/components/NavBar/NavBar';
import { Landing, PatientView, PatientFormPage, ProviderView, VoiceInput, Backend } from '@/pages';
import { TranscriptContext, getGlobalTranscript, setGlobalTranscript } from '@/contexts/TranscriptContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

function App() {
  const [transcript, setTranscript] = useState<string>(getGlobalTranscript());

  const updateTranscript = (newTranscript: string) => {
    setGlobalTranscript(newTranscript);
    setTranscript(newTranscript);
  };

  return (
    <ThemeProvider>
      <TranscriptContext.Provider value={transcript}>
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
            <NavBar />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/patient" element={<PatientView />} />
              <Route path="/patient-form" element={<PatientFormPage />} />
              <Route path="/provider" element={<ProviderView />} />
              <Route path="/voice" element={<VoiceInput onTranscriptChange={updateTranscript} />} />
              <Route path="/backend" element={<Backend />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TranscriptContext.Provider>
    </ThemeProvider>
  );
}

export default App;
