// AddCourseSheet.jsx: «أضف مقرر» bottom sheet (design NewInput, state ٣).
// Same fields, validation and error texts as the old inline form (HANDOFF rules 1–3).
// After a successful add the sheet STAYS OPEN: fields clear, focus goes back to رمز المقرر,
// and a toast says «انضاف … أضف اللي بعده» with «تراجع».
import { useEffect, useRef, useState } from 'react';
import { PrimaryButton } from '../../components/Button.jsx';
import { TextField, FieldError } from '../../components/Field.jsx';
import { Toast } from '../../components/Feedback.jsx';
import { BottomSheet } from '../../components/BottomSheet.jsx';
import { PlusIcon } from '../../components/Icons.jsx';
import { makeCourse, validateNewCourse } from '../../lib/courses.js';
import { t } from '../../lib/strings.js';

const TOAST_MS = 5000;

const ERROR_TEXT = {
  bothEmpty: () => t('input.error.bothEmpty'),
  noCode: () => t('input.error.noCode'),
  noName: () => t('input.error.noName'),
  duplicate: (e) => t('input.error.duplicate', { code: e.existing.code, name: e.existing.name }),
};
const ERROR_FIELD = { bothEmpty: 'both', noCode: 'code', noName: 'name', duplicate: 'code' };

// initial: { code?, name? } prefill (from screen 2, or the dev duplicate state).
// submitOnOpen: dev-only, presses «أضف المقرر» once with the prefill (?state=duplicate).
export default function AddCourseSheet({ courses, initial = null, submitOnOpen = false, onAdd, onUndo, onDuplicate, onClose }) {
  const [form, setForm] = useState({ code: initial?.code ?? '', pre: '', name: initial?.name ?? '' });
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null); // { code, name }
  const codeRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  // Tell the screen which row to pin and highlight behind the sheet (duplicate code).
  useEffect(() => {
    onDuplicate(error?.kind === 'duplicate' ? error.existing.code : null);
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (field !== 'pre') setError(null);
  }

  function add(values = form) {
    const problem = validateNewCourse(courses, values);
    if (problem) {
      setError(problem);
      (problem.kind === 'noName' ? nameRef : codeRef).current?.focus();
      return;
    }
    const course = makeCourse({ code: values.code, name: values.name, prerequisite: values.pre });
    onAdd(course);
    setForm({ code: '', pre: '', name: '' });
    setError(null);
    setToast({ code: course.code, name: course.name });
    codeRef.current?.focus();
  }

  // Dev-only: ?state=duplicate presses «أضف المقرر» once with the prefill.
  const ran = useRef(false);
  useEffect(() => {
    if (!submitOnOpen || ran.current) return;
    ran.current = true;
    add();
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // When prefilled with a code (screen 2's «أضف CS 501 لخطتك»), start in the name field.
  const firstFocus = initial?.code && !submitOnOpen ? nameRef : codeRef;
  const errField = error && ERROR_FIELD[error.kind];
  const errorId = 'add-course-error';
  const errorLine = error && <FieldError id={errorId}>{ERROR_TEXT[error.kind](error)}</FieldError>;
  const codeBad = errField === 'code' || errField === 'both';
  const nameBad = errField === 'name' || errField === 'both';

  return (
    <BottomSheet title={t('input.sheet.title')} closeLabel={t('input.sheet.close')} onClose={onClose} initialFocusRef={firstFocus}>
      {toast && (
        <Toast actionLabel={t('common.undo')} onAction={() => { onUndo(toast.code); setToast(null); codeRef.current?.focus(); }}>
          {t('input.success.next', { code: toast.code, name: toast.name })}
        </Toast>
      )}
      <form className="sheet-form" noValidate onSubmit={(e) => { e.preventDefault(); add(); }}>
        <div className="sheet-form__row">
          <TextField
            label={t('input.field.code')} latin value={form.code} placeholder="CS 310"
            onChange={(v) => setField('code', v)} inputRef={codeRef}
            invalid={codeBad} describedBy={codeBad ? errorId : undefined}
          />
          <TextField
            label={t('input.field.pre')} latin value={form.pre} placeholder={t('input.placeholder.pre')}
            onChange={(v) => setField('pre', v)}
          />
        </div>
        {errField === 'code' && errorLine}
        <TextField
          label={t('input.field.name')} value={form.name} placeholder={t('input.placeholder.name')}
          onChange={(v) => setField('name', v)} inputRef={nameRef}
          invalid={nameBad} describedBy={nameBad ? errorId : undefined}
        />
        {(errField === 'name' || errField === 'both') && errorLine}
        <PrimaryButton type="submit" icon={<PlusIcon />}>{t('input.add')}</PrimaryButton>
      </form>
    </BottomSheet>
  );
}
