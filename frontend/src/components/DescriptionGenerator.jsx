import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import HTMLparser from './HTMLparser';
import { WritingIcon, SavedIcon } from './Motion';
import {
  getDescribeModels, getDescriptionHistory, generateDescriptionFor, saveDescriptionToLibrary, getMe,
} from '../api/config';

const when = (iso) => {
  try {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch { return ''; }
};
const remember = (key, value) => { try { localStorage.setItem(key, value); } catch { /* private mode */ } };
const recall = (key) => { try { return localStorage.getItem(key); } catch { return null; } };

const sourceLabel = (g) => (g.source === 'library' ? 'Earlier library description' : g.model?.label || 'Unknown model');

// Generate descriptions for one library diagram with a chosen model. Every result is kept
// in the history; an admin can save one to the library (it replaces the library text,
// which itself stays in the history).
const DescriptionGenerator = ({ recordId, onSaved }) => {
  const id = useId();
  const [models, setModels] = useState(null);
  const [modelsError, setModelsError] = useState('');
  const [model, setModel] = useState('');
  const [history, setHistory] = useState([]);
  const [shownId, setShownId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [me, setMe] = useState(undefined); // undefined while checking, null when signed out
  const [dismissed, setDismissed] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  const draftRef = useRef(null);

  useEffect(() => {
    getDescribeModels()
      .then((list) => {
        setModels(list);
        const saved = recall('di-model');
        setModel(list.some((m) => m.id === saved) ? saved : list[0]?.id || '');
      })
      .catch((err) => {
        setModels([]);
        setModelsError(err.response?.data?.error || 'The description service is not available right now.');
      });
    getMe().then(setMe).catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (!recordId) return;
    getDescriptionHistory(recordId).then(setHistory).catch(() => setHistory([]));
  }, [recordId]);

  const shown = history.find((g) => g._id === shownId);
  const selectedModel = models?.find((m) => m.id === model);

  const handleGenerate = async () => {
    if (busy || !model) return;
    setBusy(true);
    setError('');
    setSaveMessage({ type: '', text: '' });
    try {
      const gen = await generateDescriptionFor(recordId, model);
      setHistory((h) => [gen, ...h]);
      setShownId(gen._id);
      // Move focus to the new draft so keyboard and screen reader users land on it
      setTimeout(() => draftRef.current?.focus(), 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!shown || saving) return;
    setSaving(true);
    setSaveMessage({ type: '', text: '' });
    try {
      await saveDescriptionToLibrary(recordId, shown._id);
      const savedAt = new Date().toISOString();
      setHistory((h) => h.map((g) => (g._id === shown._id ? { ...g, saved_to_library_at: savedAt } : g)));
      // The library text it replaced is now in the history too
      getDescriptionHistory(recordId).then(setHistory).catch(() => {});
      setSaveMessage({ type: 'success', text: 'Saved to the library.' });
      onSaved?.(shown);
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const canSave = me?.isAdmin;
  const showSavePrompt = shown && shown.source !== 'library' && !shown.saved_to_library_at && !dismissed[shown._id];

  return (
    <section aria-labelledby={`${id}-title`} className="card p-6">
      <h2 id={`${id}-title`} className="text-h2 mb-1">Generate a description</h2>
      <p className="text-small text-muted mb-5">Choose a model and generate. Every result is kept in the history below.</p>

      {models === null && <p className="text-muted">Loading models…</p>}
      {modelsError && <p role="alert" className="text-error font-bold">{modelsError}</p>}

      {models?.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 min-w-0">
            <label htmlFor={`${id}-model`} className="field-label">Model</label>
            <select
              id={`${id}-model`}
              value={model}
              onChange={(e) => { setModel(e.target.value); remember('di-model', e.target.value); }}
              aria-describedby={`${id}-model-note`}
              className="field"
            >
              {models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <button type="button" onClick={handleGenerate} aria-disabled={busy} className="btn-primary">
            {history.some((g) => g.source !== 'library') ? 'Generate again' : 'Generate'}
          </button>
        </div>
      )}
      {selectedModel?.note && <p id={`${id}-model-note`} className="mt-2 text-caption text-muted">{selectedModel.note}</p>}

      <div aria-live="polite" className="mt-4">
        {busy && (
          <p className="flex items-center gap-3 font-bold">
            <WritingIcon size={40} />
            Writing a description with {selectedModel?.label}… This usually takes 5 to 30 seconds.
          </p>
        )}
      </div>
      <div role="alert">{error && <p className="mt-2 text-error font-bold">{error}</p>}</div>

      {shown && (
        <article
          ref={draftRef}
          tabIndex={-1}
          aria-labelledby={`${id}-draft-title`}
          className="mt-5 rounded-card border-2 border-accent bg-accent-tint p-5 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent)]"
        >
          <h3 id={`${id}-draft-title`} className="text-h3">
            {shown.source === 'library' ? 'Earlier library description' : `Draft from ${shown.model?.label}`}
          </h3>
          <p className="text-caption text-muted mt-1">
            {[when(shown.created_at), shown.prompt_version && `prompt ${shown.prompt_version}`, shown.seconds && `${shown.seconds} s`]
              .filter(Boolean).join(' · ')}
          </p>

          {shown.alt_text && (
            <>
              <h4 className="font-bold mt-4 mb-1">Alt text</h4>
              <p>{shown.alt_text}</p>
            </>
          )}
          <h4 className="font-bold mt-4 mb-1">Long description</h4>
          <div className="prose-measure"><HTMLparser htmlString={shown.long_description} /></div>

          {shown.saved_to_library_at && (
            <p className="mt-4 flex items-center gap-2 font-bold text-success">
              <SavedIcon size={22} /> In the library since {when(shown.saved_to_library_at)}
            </p>
          )}

          {showSavePrompt && (
            <div className="mt-5 pt-4 border-t border-theme border-[var(--accent)]">
              <p className="font-bold">Save in the library?</p>
              {canSave ? (
                <>
                  <p className="text-small text-muted mt-1">This replaces the library description. The current one stays in the history.</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button type="button" onClick={handleSave} aria-disabled={saving} className="btn-primary">
                      {saving ? 'Saving…' : 'Save to library'}
                    </button>
                    <button type="button" onClick={() => setDismissed((d) => ({ ...d, [shown._id]: true }))} className="btn-secondary">
                      Not now
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-small mt-1">
                  Only admins can save to the library.{' '}
                  {me === null && <><Link to="/login">Log in</Link> with an admin account to save it.</>}
                  {me && !me.isAdmin && 'Your account is not an admin account.'}
                </p>
              )}
            </div>
          )}
          <div role="alert">
            {saveMessage.text && saveMessage.type === 'error' && <p className="mt-3 text-error font-bold">{saveMessage.text}</p>}
          </div>
          <p aria-live="polite" className="sr-only">{saveMessage.type === 'success' ? saveMessage.text : ''}</p>
        </article>
      )}

      {history.length > 0 && (
        <details className="mt-5" open={!shown && history.length > 0}>
          <summary className="cursor-pointer font-bold text-accent">History ({history.length})</summary>
          <ul className="mt-3 list-none p-0 m-0 divide-y divide-[var(--border)]">
            {history.map((g) => (
              <li key={g._id}>
                <button
                  type="button"
                  onClick={() => { setShownId(g._id); setTimeout(() => draftRef.current?.focus(), 0); }}
                  aria-current={g._id === shownId ? 'true' : undefined}
                  className={`w-full text-left min-h-[44px] py-2 px-2 rounded-control flex flex-wrap gap-x-3 gap-y-1 items-baseline hover:bg-accent-tint ${g._id === shownId ? 'bg-accent-tint' : ''}`}
                >
                  <span className="font-bold">{sourceLabel(g)}</span>
                  <span className="text-caption text-muted">{when(g.created_at)}</span>
                  {g.saved_to_library_at && <span className="chip border-[var(--success)] text-success">In library</span>}
                  {g._id === shownId && <span className="text-caption text-accent font-bold">Showing</span>}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
};

DescriptionGenerator.propTypes = {
  recordId: PropTypes.string.isRequired,
  onSaved: PropTypes.func,
};

export default DescriptionGenerator;
