// Button.jsx: primary button, secondary button, text link (DESIGN.md §6).
import { CheckIcon, SpinnerIcon } from './Icons.jsx';

// Primary: one per screen, in the footer. 56px tall, full width.
// status: 'default' | 'loading' | 'done'. `disabled` shows the grey state;
// its label must say what is missing (e.g. «أضف مقرر واحد على الأقل»).
export function PrimaryButton({ status = 'default', disabled = false, onClick, children, ...rest }) {
  const busy = status === 'loading';
  return (
    <button
      type="button"
      className="btn-primary"
      disabled={disabled}
      aria-busy={busy || undefined}
      onClick={busy || status === 'done' ? undefined : onClick}
      {...rest}
    >
      {busy && <SpinnerIcon />}
      {status === 'done' && <CheckIcon />}
      <span>{children}</span>
    </button>
  );
}

// Secondary (outlined): 48px tall, optional 20px icon on the start (right) side.
export function SecondaryButton({ icon = null, onClick, children, className = '', ...rest }) {
  return (
    <button type="button" className={`btn-secondary ${className}`} onClick={onClick} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

// Text link: looks like a link, behaves like a button. size: 'body' (16px) | 'caption' (13px, inside lists).
export function TextLink({ size = 'body', onClick, children, ...rest }) {
  return (
    <button type="button" className={`text-link text-link--${size}`} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}
