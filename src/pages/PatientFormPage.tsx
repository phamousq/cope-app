import { PatientForm } from '@/components/PatientForm/PatientForm';

export function PatientFormPage() {
  const handleComplete = () => {
    // Patient form completed - could show success message or redirect
    console.log('Patient form submitted');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <PatientForm onComplete={handleComplete} />
    </div>
  );
}
