export default function Input({ label, id, error, hint, className = '', ...rest }) {
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="label">{label}</label>}
      <input id={id} className={`input ${error ? '!border-coral-500 !ring-2 !ring-coral-500/20' : ''}`} {...rest} />
      {error && <p className="mt-1 text-xs text-coral-500">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
