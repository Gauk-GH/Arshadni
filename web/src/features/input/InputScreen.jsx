// Screen 1: أدخل خطتك (redesign: design NewInput · بداية · قائمة · إضافة; HANDOFF §4 + §8).
// States: start (no courses: two choice cards) · list (has courses) · add sheet ·
// loading (restore) · upload card (reading, failed, partial) · «سجلك مرفق» line after an import ·
// long plan with search (> 20 courses) · reset with confirmation and «تراجع».
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/StoreProvider.jsx';
import { navigate } from '../../App.jsx';
import { PrimaryButton, SecondaryButton, TextLink } from '../../components/Button.jsx';
import { SearchField, SelectField } from '../../components/Field.jsx';
import { CourseRow } from '../../components/CourseRow.jsx';
import { Toast, Skeleton } from '../../components/Feedback.jsx';
import { ChoiceCard } from '../../components/ChoiceCard.jsx';
import { BottomSheet } from '../../components/BottomSheet.jsx';
import { Screen, StepIndicator, Footer } from '../../components/Screen.jsx';
import { CheckIcon, CloseIcon, FileUploadIcon, PencilIcon, PlusIcon, SpinnerIcon } from '../../components/Icons.jsx';
import { codeKey, makeCourse, searchCourses } from '../../lib/courses.js';
import { readTranscript } from '../../lib/transcript.js';
import { devState, devUpload } from '../../lib/devState.js';
import { t, tn } from '../../lib/strings.js';
import { OTHER_UNIVERSITY, UNIVERSITIES } from '../../lib/universities.js';
import UploadCard, { UploadSummary } from './UploadCard.jsx';
import AddCourseSheet from './AddCourseSheet.jsx';
import './input.css';

const SEARCH_THRESHOLD = 20; // decision 7 (HANDOFF rule 12)
const TOAST_MS = 5000;
const GHOST_TICKS = 10;

export default function InputScreen() {
  const {
    status, courses, addCourse, addCourses, removeCourse, markCompleted, draft, setDraft,
    university, setUniversity, loadSample, resetAll, restorePlan, transcript, setTranscript,
  } = useStore();
  const loading = status === 'loading';

  const [sheet, setSheet] = useState(null); // null | { initial, submitOnOpen }
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState(null); // floating toast: { text, onUndo }
  const [newCode, setNewCode] = useState(null);
  const [dupCode, setDupCode] = useState(null);
  const [query, setQuery] = useState('');
  const [upload, setUpload] = useState({ status: 'idle', fileName: '', result: null });
  const fileRef = useRef(null);
  const toastRef = useRef(null);
  const addBtnRef = useRef(null);

  useEffect(() => {
    // Bring the whole bottom block (toast + link) into view on short phones.
    toastRef.current?.parentElement?.scrollIntoView({ block: 'nearest' });
  }, [toast]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  // Arrived from screen 2's «أضف CS 501 لخطتك»: open the sheet prefilled.
  useEffect(() => {
    if (!draft || loading) return;
    setSheet({ initial: draft, submitOnOpen: false });
    setDraft(null);
  }, [draft, loading, setDraft]);

  // Dev-only: ?state=duplicate opens the sheet with "cs210" and presses «أضف المقرر» once.
  const devRan = useRef(false);
  useEffect(() => {
    if (!import.meta.env.DEV || loading || devRan.current || devState() !== 'duplicate') return;
    devRan.current = true;
    setSheet({ initial: { code: 'cs210', name: 'هياكل بيانات' }, submitOnOpen: true });
  }, [loading]);

  function openSheet() {
    setSheet({ initial: null, submitOnOpen: false });
  }

  // Focus goes back to «+ أضف مقرر». (If the sheet was opened from the start screen's choice card,
  // that card is gone once the first course is added, so the add button is the only sensible target.)
  function closeSheet() {
    setSheet(null);
    setDupCode(null);
    requestAnimationFrame(() => addBtnRef.current?.focus());
  }

  function onAdded(course) {
    addCourse(course);
    setQuery('');
    setNewCode(course.code);
  }

  function chooseFile() {
    fileRef.current?.click();
  }

  async function pickFile(file) {
    setUpload({ status: 'reading', fileName: file.name, result: null });
    const result = await readTranscript(file, courses, import.meta.env.DEV ? devUpload() : null);
    if (result.status === 'failed') {
      setUpload({ status: 'failed', fileName: file.name, result: null });
      return;
    }
    markCompleted(result.matchedCodes);
    if (result.unmatchedCourses.length) {
      setUpload({ status: 'partial', fileName: file.name, result });
    } else {
      finishImport(result);
    }
  }

  // Import finished: the card collapses to the «سجلك مرفق» line (kept in memory across screens).
  function finishImport(result) {
    setTranscript({ found: result.foundCodes.length });
    setUpload({ status: 'idle', fileName: '', result: null });
  }

  function addUnmatched() {
    const added = upload.result.unmatchedCourses.map((c) => ({ ...makeCourse(c), completed: true }));
    addCourses(added);
    finishImport(upload.result);
  }

  function ignoreUnmatched() {
    finishImport(upload.result);
  }

  // «امسح كل المقررات»: confirm first, then clear, then offer «تراجع».
  function doReset() {
    const count = courses.length;
    const snapshot = resetAll();
    setConfirmReset(false);
    setQuery('');
    setNewCode(null);
    setUpload({ status: 'idle', fileName: '', result: null });
    setToast({ text: tn('input.reset.done', count), onUndo: () => restorePlan(snapshot) });
  }

  const reading = upload.status === 'reading';
  const cardOpen = ['reading', 'failed', 'partial'].includes(upload.status);
  const isStart = !loading && courses.length === 0;
  const showSearch = courses.length > SEARCH_THRESHOLD;

  // Duplicate in the sheet: the existing course is pinned to the top of the list behind it.
  const dupKey = dupCode ? codeKey(dupCode) : null;
  const found = searchCourses(courses, query);
  const visible = dupKey
    ? [...found.filter((c) => codeKey(c.code) === dupKey), ...found.filter((c) => codeKey(c.code) !== dupKey)]
    : found;

  const fileInput = (
    <input
      ref={fileRef} type="file" accept="application/pdf" hidden
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // picking the same file again still fires
        if (file) pickFile(file);
      }}
    />
  );

  const universityPicker = (
    <SelectField
      label={<>{t('input.university.label')} <span className="caption">{t('input.university.optional')}</span></>}
      placeholder={t('input.university.placeholder')}
      value={university}
      onChange={setUniversity}
      options={[
        ...UNIVERSITIES.map((u) => ({ value: u.id, label: u.name })),
        { value: OTHER_UNIVERSITY, label: t('input.university.other') },
      ]}
    />
  );

  // On the start screen the toast sits in the page, just ABOVE «جرّب ببيانات تجريبية», so it never
  // covers that link; on short phones it is scrolled into view. Elsewhere it floats above the content.
  const toastBody = toast && (
    <Toast actionLabel={t('common.undo')} onAction={() => { toast.onUndo(); setToast(null); }}>{toast.text}</Toast>
  );
  const floatingToast = toast && !isStart && (
    <div className="floating-toast">{toastBody}</div>
  );

  // ---------- Start: no courses yet ----------
  const startContent = (
      <>
        <header className="start-header">
          <StepIndicator step={1} total={2} />
          <div className="ghost-ticks" aria-hidden="true">
            {Array.from({ length: GHOST_TICKS }, (_, i) => <span key={i} />)}
          </div>
          <h1 className="title start-title">{t('input.start.title')}</h1>
          <p className="subtitle">{t('input.start.body')}</p>
        </header>

        <div className="start-choices">
          {cardOpen ? (
            <UploadCard upload={upload} onChooseFile={chooseFile} onAddUnmatched={addUnmatched} onIgnoreUnmatched={ignoreUnmatched} />
          ) : (
            <ChoiceCard
              variant="filled" icon={<FileUploadIcon />} tag={t('input.start.fastest')}
              title={t('input.upload')} sub={t('input.upload.sub')} onClick={chooseFile}
            />
          )}
          <ChoiceCard
            variant="outlined" icon={<PencilIcon />}
            title={t('input.start.manual')} sub={t('input.start.manual.sub')} onClick={openSheet}
          />
        </div>

        <div className="start-university">{universityPicker}</div>

        <div className="start-bottom">
          {toast && <div ref={toastRef} className="start-bottom__toast">{toastBody}</div>}
          <TextLink onClick={loadSample}>{t('input.sample')}</TextLink>
          <span className="caption start-bottom__note"><CheckIcon size={16} stroke={2} />{t('input.start.local')}</span>
        </div>

      </>
  );

  // ---------- List: has courses (or restoring) ----------
  const listContent = (
    <>
      <header className="list-header">
        <StepIndicator step={1} total={2} />
        <h1 className="title list-title">{t('input.list.title')}</h1>
        {loading ? (
          <p className="caption list-header__loading" aria-live="polite"><SpinnerIcon size={16} />{t('input.loading')}</p>
        ) : (
          <>
            {/* One outlined tick per course; the one just added fills (design: newest tick filled). */}
            <div className="added-ticks" role="img" aria-label={t('input.list.count', { n: courses.length })}>
              {courses.map((c, i) => (
                <span key={c.code} className={newCode && i === courses.length - 1 ? 'is-new' : undefined} />
              ))}
            </div>
            <p className="caption" aria-live="polite">{t('input.list.count', { n: courses.length })}</p>
          </>
        )}
      </header>

      {cardOpen && (
        <div className="list-upload">
          <UploadCard upload={upload} onChooseFile={chooseFile} onAddUnmatched={addUnmatched} onIgnoreUnmatched={ignoreUnmatched} />
        </div>
      )}
      {!cardOpen && transcript && (
        <div className="list-upload"><UploadSummary found={transcript.found} onChooseFile={chooseFile} /></div>
      )}

      {showSearch && (
        <div className="list-search">
          <SearchField value={query} onChange={setQuery}
            label={t('input.search', { n: courses.length })} placeholder={t('input.search', { n: courses.length })} />
        </div>
      )}

      <section className="list-courses">
        {loading ? (
          <ul aria-busy="true">
            {['100%', '60%', '75%', '50%'].map((w) => (
              <li key={w} className="course-row"><Skeleton inline={64} /><Skeleton inline={w} /></li>
            ))}
          </ul>
        ) : (
          <>
            {visible.length === 0 && <p className="caption list-courses__none">{t('done.error.title', { query: query.trim() })}</p>}
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
            <TextLink size="caption" onClick={() => setConfirmReset(true)}>{t('input.reset')}</TextLink>
          </>
        )}
      </section>

      <Footer>
        <SecondaryButton ref={addBtnRef} icon={<PlusIcon />} disabled={loading} onClick={openSheet}>{t('input.addOne')}</SecondaryButton>
        <PrimaryButton disabled={loading || reading} onClick={() => navigate('/done')}>{t('input.next')}</PrimaryButton>
      </Footer>

    </>
  );

  // The file picker, toast and sheets sit OUTSIDE both layouts, at a fixed place. Adding the first
  // course switches start → list; if the sheet lived inside a layout it would be rebuilt and lose
  // its toast and focus.
  return (
    <Screen>
      {isStart ? startContent : listContent}
      {fileInput}
      {floatingToast}
      {sheet && (
        <AddCourseSheet courses={courses} initial={sheet.initial} submitOnOpen={sheet.submitOnOpen}
          onAdd={onAdded} onUndo={removeCourse} onDuplicate={setDupCode} onClose={closeSheet} />
      )}
      {confirmReset && (
        <BottomSheet title={tn('input.reset.confirm', courses.length)} closeLabel={t('input.reset.no')} onClose={() => setConfirmReset(false)}>
          <div className="sheet__actions">
            <PrimaryButton onClick={doReset}>{t('input.reset.yes')}</PrimaryButton>
            <SecondaryButton onClick={() => setConfirmReset(false)}>{t('input.reset.no')}</SecondaryButton>
          </div>
        </BottomSheet>
      )}
    </Screen>
  );
}
