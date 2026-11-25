// Screen 3: المتبقي عليك, the main screen (HANDOFF §2, design HiRemaining + StatesRemaining).
// States: default (number, tick bar, available + locked) · 0 remaining · circular prerequisites ·
// loading · "updated" toast after editing · full (first-year student, 38 remaining).
import { useEffect, useState } from 'react';
import { useStore } from '../../store/StoreProvider.jsx';
import { navigate } from '../../App.jsx';
import { PrimaryButton, SecondaryButton } from '../../components/Button.jsx';
import { CourseRow, Badge } from '../../components/CourseRow.jsx';
import UnlockLists from './UnlockLists.jsx';
import { AlertCard, Toast, Skeleton } from '../../components/Feedback.jsx';
import { TickBar } from '../../components/TickBar.jsx';
import { Screen, Footer } from '../../components/Screen.jsx';
import { BackIcon, SpinnerIcon } from '../../components/Icons.jsx';
import { codeKey, findCycle, summarize } from '../../lib/courses.js';
import { fmtNumber } from '../../lib/format.js';
import { t } from '../../lib/strings.js';
import './remaining.css';

const TOAST_MS = 5000;
const DENSE_THRESHOLD = 60; // HANDOFF rule 19
const FIRST_YEAR_SHARE = 0.25; // under 25% completed: add «الخطة تقسمها لك على أترام» (HANDOFF §8)

export default function RemainingScreen() {
  const { status, major, courses, lastRemaining, setLastRemaining, storageError } = useStore();
  const loading = status === 'loading';
  const summary = summarize(courses);
  const cycle = loading ? null : findCycle(courses);
  const [toast, setToast] = useState(null); // { old, new }

  // «تحدّث المتبقي»: if the number changed since the last visit to this screen, say so once.
  useEffect(() => {
    if (loading) return;
    if (lastRemaining !== null && lastRemaining !== summary.remaining) {
      setToast({ old: lastRemaining, new: summary.remaining });
    }
    setLastRemaining(summary.remaining);
    // Runs when the screen opens (and once restore finishes), not on every render.
  }, [loading]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast]);

  const noCourses = !loading && summary.total === 0;
  const allDone = !loading && !noCourses && summary.remaining === 0;
  const ticksLabel = t('remaining.ticks.label', { done: summary.completed, total: summary.total });
  const cycleKeys = new Set((cycle ?? []).map(codeKey));
  const cycleCourses = courses.filter((c) => cycleKeys.has(codeKey(c.code)));

  return (
    <Screen>
      <div className="remaining-top">
        <button type="button" className="back-btn" aria-label={t('remaining.back')} onClick={() => navigate('/done')}>
          <BackIcon />
        </button>
        {major && <span className="remaining-top__major"><bdi>{major}</bdi></span>}
        <span className="remaining-top__spacer" aria-hidden="true" />
      </div>

      <section className={`remaining-summary${cycle ? ' remaining-summary--tight' : ''}`} aria-label={t('remaining.summary')} aria-live="polite">
        {loading ? (
          <>
            <p className="subtitle remaining-summary__loading"><SpinnerIcon size={16} />{t('remaining.loading')}</p>
            <div className="remaining-number">
              <Skeleton inline={120} block={112} />
              <Skeleton inline={56} block={24} />
            </div>
            <div className="remaining-ticks"><Skeleton block={28} /></div>
            <Skeleton inline={140} block={13} />
          </>
        ) : (
          <>
            <p className="subtitle">{t('remaining.label')}</p>
            <div className="remaining-number">
              <span className="remaining-number__value">{fmtNumber(summary.remaining)}</span>
              <span className="remaining-number__unit">{t('remaining.unit', { n: summary.remaining })}</span>
            </div>
            {summary.total > 0 && (
              <div className="remaining-ticks">
                <TickBar total={summary.total} filled={summary.completed} dense={summary.total > DENSE_THRESHOLD} label={ticksLabel} />
              </div>
            )}
            {!cycle && summary.total > 0 && (
              <p className="caption">
                {t('remaining.ticks', { done: summary.completed, total: summary.total })}
                {summary.completed < summary.total * FIRST_YEAR_SHARE && `، ${t('remaining.firstYearHint')}`}
              </p>
            )}
          </>
        )}
      </section>

      <section className="remaining-list">
        {loading && (
          <ul className="remaining-list__skeleton" aria-busy="true">
            <li className="course-row"><Skeleton inline={64} /><Skeleton /></li>
            <li className="course-row"><Skeleton inline={64} /><Skeleton inline="60%" /></li>
          </ul>
        )}

        {!loading && (storageError === 'blocked' || (storageError === 'broken' && noCourses)) && (
          // Storage blocked (always shown), or saved data broken: backed up, started fresh,
          // shown until the student adds courses again. Never a raw error.
          <div className="remaining-alert">
            <AlertCard title={t(`remaining.storage.${storageError}.title`)}>
              {t(`remaining.storage.${storageError}.body`)}
            </AlertCard>
          </div>
        )}

        {noCourses && (
          <div className="remaining-message">
            <h2 className="section-heading">{t('done.empty.title')}</h2>
            <p className="subtitle">{t('done.empty.body')}</p>
          </div>
        )}

        {allDone && (
          <div className="remaining-message">
            <h2 className="section-heading">{t('remaining.empty.title')}</h2>
            <p className="subtitle">{t('remaining.empty.body')}</p>
          </div>
        )}

        {cycle && (
          <>
            <div className="remaining-alert">
              <AlertCard title={t('remaining.error.title')}>
                {cycle.length === 2
                  ? t('remaining.error.body', { a: cycle[0], b: cycle[1] })
                  : t('remaining.error.bodyLong', { chain: [...cycle, cycle[0]] })}
              </AlertCard>
            </div>
            <ul>
              {cycleCourses.map((c) => (
                <CourseRow key={c.code} code={c.code} name={c.name}
                  trailing={<Badge kind="conflict">{t('remaining.error.badge')}</Badge>} />
              ))}
            </ul>
          </>
        )}

        {!loading && !cycle && summary.remaining > 0 && (
          <>
            <UnlockLists courses={courses} summary={summary} />
          </>
        )}
      </section>

      <Footer>
        {toast && (
          <div className="footer__toast">
            <Toast>{t('remaining.success', { new: toast.new, old: toast.old })}</Toast>
          </div>
        )}
        {noCourses ? (
          <PrimaryButton onClick={() => navigate('/input')}>{t('done.empty.button')}</PrimaryButton>
        ) : allDone ? (
          // Rule 11: no plan button when nothing remains.
          <PrimaryButton onClick={() => navigate('/input')}>{t('remaining.empty.button')}</PrimaryButton>
        ) : cycle ? (
          // Rule 5: stop; no plan until the loop is fixed.
          <PrimaryButton onClick={() => navigate('/input')}>{t('remaining.error.button')}</PrimaryButton>
        ) : (
          <>
            <PrimaryButton disabled={loading} onClick={() => navigate('/plan')}>{t('remaining.plan')}</PrimaryButton>
            <SecondaryButton disabled={loading} onClick={() => navigate('/input')}>{t('remaining.edit')}</SecondaryButton>
          </>
        )}
      </Footer>
    </Screen>
  );
}
