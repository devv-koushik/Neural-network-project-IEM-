import { ChevronDown } from 'lucide-react';

export default function Select({ label, id, options = [], className = '', ...rest }) {
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <div className="relative">
        <select id={id} className="input appearance-none pr-9 cursor-pointer" {...rest}>
          {options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400" />
      </div>
    </div>
  );
}
