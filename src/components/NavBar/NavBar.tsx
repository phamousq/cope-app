import { Link, useLocation } from 'react-router-dom';
import { FileText, User, Mic, Database } from 'lucide-react';

const navItems = [
  { path: '/voice', label: 'Voice Input', icon: Mic },
  { path: '/provider', label: 'Provider View', icon: User },
  { path: '/', label: 'Patient View', icon: FileText },
  { path: '/form-data', label: 'Form Data', icon: Database },
];

export function NavBar() {
  const location = useLocation();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Digital COPE</h1>
              <p className="text-sm text-slate-500">Cancer Outcomes & Prognosis Evaluation</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}