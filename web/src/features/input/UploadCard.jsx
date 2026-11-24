// UploadCard.jsx: «ارفق سجلك الأكاديمي» and its states (DESIGN.md §6 Upload card, StatesUpload).
// idle → reading → done | partial | failed. The reading is simulated (lib/transcript.js).
import { useRef } from 'react';
import { SecondaryButton, TextLink } from '../../components/Button.jsx';
import { CourseRow } from '../../components/CourseRow.jsx';
import { AlertIcon, CheckIcon, FileUploadIcon, SpinnerIcon } from '../../components/Icons.jsx';
import { t } from '../../lib/strings.js';

export default function UploadCard({ upload, onPick, onReset, onAddUnmatched, onIgnoreUnmatched }) {
  const fileRef = useRef(null);
  const openPicker = () => fileRef.current?.click();
  const { status, fileName, result } = upload;

  // Results are announced by role="status" / role="alert" on each card.
  const input = (
    <input
      ref={fileRef}
      type="file"
      accept="application/pdf"
      hidden
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // so picking the same file again still fires
        if (file) onPick(file);
      }}
    />
  );

  if (status === 'reading') {
    return (
      <div className="upload upload--reading" role="status" aria-live="polite">
        <SpinnerIcon size={24} />
        <span className="upload__text">
          <span className="upload__title">{t('input.upload.reading')}</span>
          <span className="upload__sub code" dir="ltr">{fileName}</span>
        </span>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="upload upload--failed upload--stack" role="alert">
        <div className="upload__head">
          <AlertIcon size={24} />
          <span className="upload__text">
            <span className="upload__title">{t('input.upload.error.title')}</span>
            <span className="upload__sub code" dir="ltr">{fileName}</span>
          </span>
        </div>
        <p className="upload__error">{t('input.upload.error.scan')}</p>
        <SecondaryButton onClick={openPicker}>{t('input.upload.error.retry')}</SecondaryButton>
        {input}
      </div>
    );
  }

  if (status === 'done' || status === 'partial') {
    const found = result.foundCodes.length;
    const unmatched = result.unmatchedCourses.length;
    const partial = status === 'partial';
    return (
      <div className={`upload upload--done${partial ? ' upload--stack' : ''}`} role="status">
        <div className="upload__head">
          <CheckIcon size={24} />
          <span className="upload__text">
            <span className="upload__title">{t('input.upload.done', { n: found })}</span>
            <span className="upload__sub">
              {partial
                ? t('input.upload.partial.sub', { matched: result.matchedCodes.length, unmatched })
                : t('input.upload.done.sub')}
            </span>
          </span>
          {!partial && (
            <TextLink size="caption" onClick={() => { onReset(); openPicker(); }}>{t('input.upload.change')}</TextLink>
          )}
        </div>
        {partial && (
          <>
            <ul>
              {result.unmatchedCourses.map((c) => <CourseRow key={c.code} code={c.code} name={c.name} />)}
            </ul>
            <SecondaryButton onClick={onAddUnmatched}>{t('input.upload.partial.add', { unmatched })}</SecondaryButton>
            <TextLink onClick={onIgnoreUnmatched}>{t('input.upload.partial.ignore')}</TextLink>
          </>
        )}
        {input}
      </div>
    );
  }

  // idle: the whole card is one button.
  return (
    <>
      <button type="button" className="upload upload--idle" onClick={openPicker}>
        <FileUploadIcon />
        <span className="upload__text">
          <span className="upload__title">{t('input.upload')}</span>
          <span className="upload__sub">{t('input.upload.sub')}</span>
        </span>
      </button>
      {input}
    </>
  );
}

