// BottomSheet.jsx: a modal sheet that slides up from the bottom (DESIGN.md §6 Bottom sheet).
// Accessibility: role="dialog" + aria-modal, focus moves inside on open, Tab is trapped inside,
// Escape / ✕ / tapping the scrim close it, and focus returns to whatever opened it.
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons.jsx';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

// initialFocusRef: the element to focus when the sheet opens (e.g. the first field).
export function BottomSheet({ title, closeLabel, onClose, initialFocusRef, children }) {
  const sheetRef = useRef(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement;
    // Page behind: no scrolling, and hidden from screen readers and Tab (the "inert" attribute).
    const app = document.querySelector('.app');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    app?.setAttribute('inert', '');
    (initialFocusRef?.current ?? sheetRef.current?.querySelector(FOCUSABLE))?.focus();

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = [...sheetRef.current.querySelectorAll(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      app?.removeAttribute('inert');
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
    // Runs once per opening.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div className="sheet-layer">
      <div className="sheet-scrim" aria-hidden="true" onClick={() => onCloseRef.current()} />
      <section ref={sheetRef} className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <span className="sheet__handle" aria-hidden="true" />
        <div className="sheet__head">
          <h2 id={titleId} className="title">{title}</h2>
          <button type="button" className="sheet__close" aria-label={closeLabel} onClick={() => onCloseRef.current()}>
            <CloseIcon size={24} />
          </button>
        </div>
        {children}
      </section>
    </div>,
    document.body,
  );
}
