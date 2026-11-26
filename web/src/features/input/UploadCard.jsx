// UploadCard.jsx: the transcript card's states (DESIGN.md §6 Upload card, StatesUpload).
// reading → done | partial | failed. The reading is real and on the device (lib/transcript.js, decision 35).
// The idle state is the filled choice card on the start screen; the file picker lives in InputScreen,
// so every "choose a file" button opens the same one (onChooseFile).
import { SecondaryButton, TextLink } from '../../components/Button.jsx';
import { CourseRow } from '../../components/CourseRow.jsx';
import { AlertIcon, CheckIcon, SpinnerIcon } from '../../components/Icons.jsx';
import { t, tn } from '../../lib/strings.js';
import { MAX_MB } from '../../lib/transcript.js';

export default function UploadCard({ upload, onChooseFile, onAddUnmatched, onIgnoreUnmatched }) {
  const { status, fileName, result, reason } = upload;

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
        <p className="upload__error">{t(`input.upload.error.${reason ?? 'scan'}`, { mb: MAX_MB })}</p>
        <SecondaryButton onClick={onChooseFile}>{t('input.upload.error.retry')}</SecondaryButton>
      </div>
    );
  }

  if (status === 'partial') {
    const unmatched = result.unmatchedCourses.length;
    return (
      <div className="upload upload--done upload--stack" role="status">
        <div className="upload__head">
          <CheckIcon size={24} />
          <span className="upload__text">
            <span className="upload__title">{t('input.upload.done', { n: result.foundCodes.length })}</span>
            <span className="upload__sub">{t('input.upload.partial.sub', { matched: result.matchedCodes.length, unmatched })}</span>
          </span>
        </div>
        <ul>
          {result.unmatchedCourses.map((c) => <CourseRow key={c.code} code={c.code} name={c.name} />)}
        </ul>
        <SecondaryButton onClick={onAddUnmatched}>{tn('input.upload.partial.add', unmatched)}</SecondaryButton>
        <TextLink onClick={onIgnoreUnmatched}>{t('input.upload.partial.ignore')}</TextLink>
      </div>
    );
  }

  return null;
}

// The list state's one-line summary after an import: «سجلك مرفق، لقينا ٢٨ مقرر خلصتها · غيّر».
export function UploadSummary({ found, onChooseFile }) {
  return (
    <div className="upload-line" role="status">
      <CheckIcon size={20} />
      <span className="upload-line__text">{t('input.upload.attached', { n: found })}</span>
      <TextLink size="caption" onClick={onChooseFile}>{t('input.upload.changeShort')}</TextLink>
    </div>
  );
}
