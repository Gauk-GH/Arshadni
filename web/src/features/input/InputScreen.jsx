// Screen 1: أدخل خطتك الدراسية (HANDOFF §2, design HiInput + StatesInput + StatesUpload).
// States: default list · empty · loading (restore) · field errors · duplicate · added toast + undo ·
// long plan with search (> 20 courses) · upload card (idle, reading, done, failed, partial).
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/StoreProvider.jsx';
import { navigate } from '../../App.jsx';
import { PrimaryButton, SecondaryButton, TextLink } from '../../components/Button.jsx';
import { TextField, FieldError, SearchField, SelectField } from '../../components/Field.jsx';
import { CourseRow } from '../../components/CourseRow.jsx';
import { Toast, Skeleton } from '../../components/Feedback.jsx';
import { Screen, StepIndicator, Footer } from '../../components/Screen.jsx';
import { CheckIcon, CloseIcon, PlusIcon, SpinnerIcon } from '../../components/Icons.jsx';
import { codeKey, makeCourse, searchCourses, validateNewCourse } from '../../lib/courses.js';
import { readTranscript } from '../../lib/transcript.js';
import { devState, devUpload } from '../../lib/devState.js';
import { t } from '../../lib/strings.js';
import { OTHER_UNIVERSITY, UNIVERSITIES } from '../../lib/universities.js';
import UploadCard from './UploadCard.jsx';
import './input.css';

const SEARCH_THRESHOLD = 20; // decision 7 (HANDOFF rule 12)
const TOAST_MS = 5000;
const EMPTY_TICKS = 8;

const ERROR_TEXT = {
  bothEmpty: () => t('input.error.bothEmpty'),
  noCode: () => t('input.error.noCode'),
  noName: () => t('input.error.noName'),
  duplicate: (e) => t('input.error.duplicate', { code: e.existing.code, name: e.existing.name }),
};

export default function InputScreen() {
  const {
    status, courses, addCourse, addCourses, removeCourse, markCompleted, draft, setDraft,
    university, setUniversity, loadSample, resetAll,
  } = useStore();
  const loading = status === 'loading';

  const [form, setForm] = useState({ code: '', pre: '', name: '' });
  const [error, setError] = useState(null); // { kind, existing? }
  const [toast, setToast] = useState(null); // { code, name }
  const [newCode, setNewCode] = useState(null);
  const [query, setQuery] = useState('');
  const [upload, setUpload] = useState({ status: 'idle', fileName: '', result: null });

  const codeRef = useRef(null);
  const nameRef = useRef(null);

  // Toast disappears by itself after 5 seconds.
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  // Arrived from screen 2's «أضف CS 501 لخطتك»: prefill the form, then focus the next empty field.
  useEffect(() => {
    if (!draft || loading) return;
    setForm({ code: draft.code ?? '', pre: '', name: draft.name ?? '' });
    setDraft(null);
    (draft.code ? nameRef : codeRef).current?.focus();
  }, [draft, loading, setDraft]);

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (field !== 'pre') setError(null); // the error clears as soon as the user fixes the field
  }

  function add(values = form) {
    const problem = validateNewCourse(courses, values);
    if (problem) {
      setError(problem);
      (problem.kind === 'noName' ? nameRef : codeRef).current?.focus();
      return;
    }
    const course = makeCourse({ code: values.code, name: values.name, prerequisite: values.pre });
    addCourse(course);
    setForm({ code: '', pre: '', name: '' });
    setError(null);
    setQuery('');
    setNewCode(course.code);
    setToast({ code: course.code, name: course.name });
    codeRef.current?.focus();
  }

  // «امسح كل المقررات وابدأ من جديد»: asks first, then clears this device's plan (keeps the university).
  function resetPlan() {
    if (!window.confirm(t('input.reset.confirm'))) return;
    resetAll();
    setForm({ code: '', pre: '', name: '' });
    setError(null);
    setToast(null);
    setQuery('');
    setNewCode(null);
    setUpload({ status: 'idle', fileName: '', result: null });
  }

  function undoAdd() {
    if (toast) removeCourse(toast.code);
    setToast(null);
  }

  // Dev-only: ?state=duplicate types "cs210" and presses «أضف المقرر» once.
  const devRan = useRef(false);
  useEffect(() => {
    if (!import.meta.env.DEV || loading || devRan.current || devState() !== 'duplicate') return;
    devRan.current = true;
    const values = { code: 'cs210', pre: '', name: 'هياكل بيانات' };
    setForm(values);
    add(values);
  });

  async function pickFile(file) {
    setUpload({ status: 'reading', fileName: file.name, result: null });
    const result = await readTranscript(file, courses, import.meta.env.DEV ? devUpload() : null);
    if (result.status === 'failed') {
      setUpload({ status: 'failed', fileName: file.name, result: null });
      return;
    }
    markCompleted(result.matchedCodes);
    setUpload({ status: result.unmatchedCourses.length ? 'partial' : 'done', fileName: file.name, result });
  }

  function addUnmatched() {
    const added = upload.result.unmatchedCourses.map((c) => ({ ...makeCourse(c), completed: true }));
    addCourses(added);
    setUpload((u) => ({ ...u, status: 'done' }));
  }

  const reading = upload.status === 'reading';
  const isEmpty = !loading && courses.length === 0;
  const showSearch = courses.length > SEARCH_THRESHOLD;
  // Duplicate: the existing course is pinned to the top of the list (as in the design), right under
  // the form, so the error and the highlighted row are seen together without scrolling away.
  const dupKey = error?.kind === 'duplicate' ? codeKey(error.existing.code) : null;
  const found = searchCourses(courses, query);
  const visible = dupKey
    ? [...found.filter((c) => codeKey(c.code) === dupKey), ...found.filter((c) => codeKey(c.code) !== dupKey)]
    : found;
  const errField = error && { bothEmpty: 'both', noCode: 'code', noName: 'name', duplicate: 'code' }[error.kind];
  const errorId = 'add-course-error';
  const errorLine = error && <FieldError id={errorId}>{ERROR_TEXT[error.kind](error)}</FieldError>;

  return (
    <Screen>
      <header className="screen__header">
        <StepIndicator step={1} total={2} />
        <h1 className="title input-title">{t('input.title')}</h1>
        <p className="subtitle">{t('input.subtitle')}</p>
        {/* Decision 2: the paste link «الصقها مرة وحدة» is hidden this round. */}
      </header>

      <div className="input-university">
        <SelectField
          label={t('input.university.label')}
          placeholder={t('input.university.placeholder')}
          value={university}
          onChange={setUniversity}
          options={[
            ...UNIVERSITIES.map((u) => ({ value: u.id, label: u.name })),
            { value: OTHER_UNIVERSITY, label: t('input.university.other') },
          ]}
        />
      </div>

      <div className="input-upload">
        <UploadCard
          upload={upload}
          onPick={pickFile}
          onReset={() => setUpload({ status: 'idle', fileName: '', result: null })}
          onAddUnmatched={addUnmatched}
          onIgnoreUnmatched={() => setUpload((u) => ({ ...u, status: 'done' }))}
        />
      </div>

      <form className="input-form" noValidate onSubmit={(e) => { e.preventDefault(); add(); }}>
        <div className="input-form__row">
          <TextField
            label={t('input.field.code')} latin value={form.code} placeholder="CS 310"
            onChange={(v) => setField('code', v)} inputRef={codeRef}
            invalid={errField === 'code' || errField === 'both'}
            describedBy={errField === 'code' || errField === 'both' ? errorId : undefined}
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
          invalid={errField === 'name' || errField === 'both'}
          describedBy={errField === 'name' || errField === 'both' ? errorId : undefined}
        />
        {(errField === 'name' || errField === 'both') && errorLine}
        <SecondaryButton type="submit" icon={<PlusIcon />}>{t('input.add')}</SecondaryButton>
      </form>

      {loading && (
        <section className="input-list" aria-live="polite" aria-busy="true">
          <h2 className="section-heading input-list__loading"><SpinnerIcon size={16} />{t('input.loading')}</h2>
          <ul>
            {['100%', '60%', '75%', '50%'].map((w) => (
              <li key={w} className="course-row"><Skeleton inline={64} /><Skeleton inline={w} /></li>
            ))}
          </ul>
        </section>
      )}

      {isEmpty && (
        <section className="input-list input-empty">
          <div className="input-empty__ticks" aria-hidden="true">
            {Array.from({ length: EMPTY_TICKS }, (_, i) => <span key={i} />)}
          </div>
          <h2 className="section-heading">{t('input.empty.title')}</h2>
          <p className="subtitle">{t('input.empty.body')}</p>
          <TextLink onClick={loadSample}>{t('input.sample')}</TextLink>
        </section>
      )}

      {!loading && !isEmpty && (
        <section className="input-list">
          <div className="input-list__head">
            <h2 className="section-heading" aria-live="polite">{t('input.count', { n: courses.length })}</h2>
            {showSearch && <span className="caption">{t('input.newestFirst')}</span>}
          </div>
          {showSearch && (
            <SearchField
              value={query} onChange={setQuery}
              label={t('input.search', { n: courses.length })} placeholder={t('input.search', { n: courses.length })}
            />
          )}
          {visible.length === 0 && <p className="caption input-list__none">{t('done.error.title', { query: query.trim() })}</p>}
          <ul>
            {visible.map((c) => {
              const isTarget = codeKey(c.code) === dupKey;
              return (
                <CourseRow
                  key={c.code}
                  code={c.code}
                  name={c.name}
                  highlight={isTarget ? 'target' : c.code === newCode ? 'new' : null}
                  sub={c.prerequisites.length > 0 && t('input.row.needs', { code: c.prerequisites.join('، ') })}
                  trailing={
                    <button type="button" className="row-delete" aria-label={t('input.row.delete', { code: c.code })} onClick={() => removeCourse(c.code)}>
                      <CloseIcon />
                    </button>
                  }
                />
              );
            })}
          </ul>
          <TextLink size="caption" onClick={resetPlan}>{t('input.reset')}</TextLink>
        </section>
      )}

      <Footer>
        {toast && (
          <div className="footer__toast">
            <Toast actionLabel={t('common.undo')} onAction={undoAdd}>
              {t('input.success', { code: toast.code, name: toast.name })}
            </Toast>
          </div>
        )}
        {isEmpty ? (
          <PrimaryButton disabled>{t('input.empty.button')}</PrimaryButton>
        ) : (
          <>
            <span className="caption footer__note"><CheckIcon size={16} stroke={2} />{t('input.saved')}</span>
            <PrimaryButton disabled={loading || reading} onClick={() => navigate('/done')}>{t('input.next')}</PrimaryButton>
          </>
        )}
      </Footer>
    </Screen>
  );
}
