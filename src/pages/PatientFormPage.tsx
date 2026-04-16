import { PatientForm } from '@/components/PatientForm/PatientForm';

export function PatientFormPage() {
  const handleComplete = () => {
    // Patient form completed - could show success message or redirect
    console.log('Patient form submitted');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <PatientForm onComplete={handleComplete} />
    </div>
  );
}
