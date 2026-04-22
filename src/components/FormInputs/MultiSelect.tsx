interface MultiSelectProps {
  label: string;
  selected: string[];
  onChange: (selected: string[]) => void;
  options: readonly string[];
  className?: string;
}

export function MultiSelect({ label, selected, onChange, options, className = '' }: MultiSelectProps) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selected.includes(opt)
                ? 'bg-teal-600 text-white dark:bg-teal-500'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
