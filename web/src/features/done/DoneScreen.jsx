// Screen 2: علّم المقررات اللي خلصتها (HANDOFF §2, design HiDone + StatesDone).
// States: default (tick bar + count) · empty · loading · search not found · all ticked · full (> 60, dense bar).
import { useState } from 'react';
import { useStore } from '../../store/StoreProvider.jsx';
import { navigate } from '../../App.jsx';
import { PrimaryButton, SecondaryButton } from '../../components/Button.jsx';
import { SearchField } from '../../components/Field.jsx';
import { CheckRow } from '../../components/CourseRow.jsx';
import { Skeleton } from '../../components/Feedback.jsx';
import { TickBar } from '../../components/TickBar.jsx';
import { Screen, StepRow, Footer } from '../../components/Screen.jsx';
import { CheckIcon, PlusIcon } from '../../components/Icons.jsx';
import { looksLikeCode, normalizeCode, searchCourses } from '../../lib/courses.js';
import { t } from '../../lib/strings.js';
import './done.css';

const SEARCH_THRESHOLD = 20; // decision 7
const DENSE_THRESHOLD = 60;  // above this many ticks, the bar uses 1px gaps (HANDOFF §4: 72 courses)

export default function DoneScreen() {
  const { status, courses, toggleCompleted, setDraft } = useStore();
  const [query, setQuery] = useState('');
  const loading = status === 'loading';

  const total = courses.length;
  const completed = courses.filter((c) => c.completed).length;
  const remaining = total - completed;
  const isEmpty = !loading && total === 0;
  const allDone = !loading && total > 0 && remaining === 0;
  const dense = total > DENSE_THRESHOLD;
  // Design: no search once everything is ticked (StatesDone ٤).
  const showSearch = !allDone && (loading || total > SEARCH_THRESHOLD);
  const visible = searchCourses(courses, query);
  const q = query.trim();
  const notFound = q !== '' && visible.length === 0;
  const shownQuery = looksLikeCode(q) ? normalizeCode(q) : q;

  function addMissing() {
    setDraft(looksLikeCode(q) ? { code: shownQuery } : { name: q });
    navigate('/input');
  }

  return (
    <Screen>
      <StepRow step={2} total={2} backLabel={t('done.back')} onBack={() => navigate('/input')} />

      <header className="done-header">
        <h1 className="title done-title">{t('done.title')}</h1>
        {loading && (
          <>
            <Skeleton block={12} />
            <p className="caption" aria-live="polite">{t('done.loading', { n: total })}</p>
          </>
        )}
        {!loading && !isEmpty && (
          <>
            <TickBar total={total} filled={completed} size="small" dense={dense} label={t('done.count', { n: completed, total })} />
            <p className="caption" aria-live="polite">
              {t('done.count', { n: completed, total })}
              {dense && `، ${t('done.longHint')}`}
            </p>
          </>
        )}
      </header>

      {isEmpty ? (
        <section className="done-empty">
          <div className="done-empty__row" aria-hidden="true">
            <span className="done-empty__box" />
            <span className="course-row__code">— — —</span>
            <span>— — — — —</span>
          </div>
          <h2 className="section-heading">{t('done.empty.title')}</h2>
          <p className="subtitle">{t('done.empty.body')}</p>
        </section>
      ) : (
        <>
          {showSearch && (
            <div className="done-search">
              <SearchField
                value={query} onChange={setQuery} disabled={loading}
                label={t('done.search.label')}
                placeholder={dense ? t('input.search', { n: total }) : t('done.search')}
              />
            </div>
          )}

          {allDone && (
            <div className="done-note" role="status">
              <CheckIcon size={24} stroke={2} />
              <div className="done-note__text">
                <strong className="section-heading">{t('done.success.title')}</strong>
                <span className="caption">{t('done.success.body')}</span>
              </div>
            </div>
          )}

          {loading && (
            <ul className="done-list" aria-busy="true">
              {['100%', '55%', '70%', '45%'].map((w) => (
                <li key={w} className="course-row"><Skeleton inline={24} block={24} /><Skeleton inline={64} /><Skeleton inline={w} /></li>
              ))}
            </ul>
          )}

          {notFound && (
            <section className="done-notfound" role="status">
              <h2 className="section-heading">{t('done.error.title', { query: shownQuery })}</h2>
              <p className="subtitle">{t('done.error.body')}</p>
              <SecondaryButton icon={<PlusIcon />} onClick={addMissing}>{t('done.error.button', { query: shownQuery })}</SecondaryButton>
            </section>
          )}

          {!loading && !notFound && (
            <ul className="done-list">
              {visible.map((c) => (
                <CheckRow key={c.code} code={c.code} name={c.name} checked={c.completed} onChange={() => toggleCompleted(c.code)} />
              ))}
            </ul>
          )}
        </>
      )}

      <Footer>
        {isEmpty ? (
          <PrimaryButton onClick={() => navigate('/input')}>{t('done.empty.button')}</PrimaryButton>
        ) : loading ? (
          <PrimaryButton disabled>{t('done.next.loading')}</PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => navigate('/remaining')}>{t('done.next', { n: remaining })}</PrimaryButton>
        )}
      </Footer>
    </Screen>
  );
}
