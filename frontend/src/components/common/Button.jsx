import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  ...rest
}) {
  return (
    <button type={type} className={`${VARIANTS[variant]} ${className}`} disabled={loading || rest.disabled} {...rest}>
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        Icon && iconPosition === 'left' && <Icon size={16} />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon size={16} />}
    </button>
  );
}
