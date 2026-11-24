// Field.jsx: text input with label above, and the error line (DESIGN.md §6 Input).
import { useId } from 'react';
import { AlertIcon, ChevronDownIcon, SearchIcon } from './Icons.jsx';

// latin: true for course codes → dir="ltr" but still aligned to the right (DESIGN.md).
export function TextField({ label, value, onChange, invalid = false, latin = false, placeholder, inputRef, describedBy, ...rest }) {
  const id = useId();
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <input
        id={id}
        ref={inputRef}
        type="text"
        className="field__input"
        dir={latin ? 'ltr' : 'auto'}
        data-latin={latin || undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        spellCheck={false}
        {...rest}
      />
    </div>
  );
}

// Error text: 13px error-ink with a 16px alert icon at the start. role="alert" so screen readers announce it.
export function FieldError({ id, children }) {
  return (
    <p id={id} className="field-error" role="alert">
      <AlertIcon />
      <span>{children}</span>
    </p>
  );
}

// Search field: 48px, search icon at the start. label is for screen readers.
export function SearchField({ value, onChange, placeholder, label, disabled = false }) {
  return (
    <label className="search">
      <SearchIcon />
      <span className="sr-only">{label}</span>
      <input
        type="search" dir="auto" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete="off" spellCheck={false} disabled={disabled}
      />
    </label>
  );
}

// Select field: a native <select>, so phones show their own picker (a scroll wheel on iPhone).
// options: [{ value, label }]. The first, empty option is the placeholder.
export function SelectField({ label, value, onChange, placeholder, options }) {
  const id = useId();
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      <div className="select">
        <select id={id} className="field__input select__input" data-empty={value === "" || undefined} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{placeholder}</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDownIcon />
      </div>
    </div>
  );
}
