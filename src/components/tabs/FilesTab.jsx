import { useRef, useState } from 'react';
import { fileIcon, fmtSize } from '../helpers.js';
import { uploadProjectFile } from '../../lib/fileStorage.js';

const uid = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).slice(2, 9));

export default function FilesTab({ project, onAddFiles, onDeleteFile, onUpdateFile, openModal }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const activeFiles = project.files.filter((file) => !file.deleted_at);

  const handleFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);
    setUploadError('');

    try {
      const uploadedFiles = [];
      for (const file of files) {
        uploadedFiles.push(await uploadProjectFile(project.id, file));
      }
      onAddFiles(uploadedFiles);
    } catch (error) {
      setUploadError(error.message || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="section-header">
        <div className="section-label">Files</div>
        <div className="btn-row">
          <button className="ghost-btn" type="button" onClick={() => openModal(({ onClose }) => <LinkFileModal onClose={onClose} onSubmit={onAddFiles} />)}>🔗 Link File</button>
          <button className="add-btn" type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>{uploading ? 'Uploading...' : '⬆ Upload'}</button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          handleFiles(Array.from(event.target.files || []));
          event.target.value = '';
        }}
      />
      <div
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          handleFiles(Array.from(event.dataTransfer.files || []));
        }}
      >
        <div className="drop-icon">📂</div>
        <strong>{uploading ? 'Uploading files...' : 'Drag & drop files here'}</strong>
        <p>Or click to browse · Files sync with Supabase Storage</p>
      </div>
      <div className="warn-note">💡 Uploaded files are stored in Supabase Storage so they can be opened from desktop or mobile.</div>
      {uploadError && <div className="warn-note danger-note">{uploadError}</div>}
      {!activeFiles.length ? (
        <div className="empty">No files yet.</div>
      ) : (
        <div className="file-grid">
          {activeFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onDelete={() => onDeleteFile(file.id)}
              onEdit={() => openModal(({ onClose }) => (
                <EditFileModal file={file} onClose={onClose} onSubmit={(updates) => onUpdateFile(file.id, updates)} />
              ))}
            />
          ))}
        </div>
      )}
    </>
  );
}

function FileCard({ file, onDelete, onEdit }) {
  const fileUrl = file.public_url || file.path;
  const meta = file.kind === 'link' ? file.path : fmtSize(file.size);
  const openFile = () => {
    if (file.kind === 'link') {
      const target = /^https?:\/\//i.test(file.path) || /^file:/i.test(file.path) ? file.path : `file:///${file.path.replace(/\\/g, '/')}`;
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }
    if (fileUrl) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="file-card"
      role="button"
      tabIndex={0}
      title={file.kind === 'link' ? file.path : fileUrl || file.name}
      onClick={openFile}
      onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && openFile()}
    >
      <button className="file-edit" type="button" onClick={(event) => { event.stopPropagation(); onEdit(); }}>✎</button>
      <button className="file-del" type="button" onClick={(event) => { event.stopPropagation(); onDelete(); }}>✕</button>
      <div className="file-icon">{fileIcon(file.mimeType, file.name)}</div>
      <div className="file-name">{file.name.length > 20 ? `${file.name.slice(0, 18)}...` : file.name}</div>
      <span className={`file-badge ${file.kind === 'link' ? 'file-badge-link' : 'file-badge-up'}`}>{file.kind === 'link' ? 'LINK' : 'UPLOAD'}</span>
      <div className="file-meta">{meta?.length > 28 ? `...${meta.slice(-26)}` : meta}</div>
      <div className="file-meta">{file.date || ''}</div>
    </div>
  );
}

function EditFileModal({ file, onClose, onSubmit }) {
  const [name, setName] = useState(file.name);
  const [path, setPath] = useState(file.path || '');

  const submit = () => {
    if (!name.trim()) return;
    const updates = { name: name.trim() };
    if (file.kind === 'link') updates.path = path.trim();
    onSubmit(updates);
    onClose();
  };

  return (
    <>
      <h2>Edit File</h2>
      <div className="field">
        <label>Display Name</label>
        <input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} />
      </div>
      {file.kind === 'link' && (
        <div className="field">
          <label>File Path or URL</label>
          <input value={path} onChange={(event) => setPath(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} />
          <small>Full path on your computer or an https link</small>
        </div>
      )}
      {file.kind !== 'link' && <p className="modal-note">Uploaded file data stays the same. This only changes the display name.</p>}
      <div className="modal-actions">
        <button className="mbtn mbtn-sec" type="button" onClick={onClose}>Cancel</button>
        <button className="mbtn mbtn-pri" type="button" onClick={submit}>Save File</button>
      </div>
    </>
  );
}

function LinkFileModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');

  const submit = () => {
    if (!path.trim()) return;
    const displayName = name.trim() || path.trim().split(/[\\/]/).pop();
    const timestamp = new Date();
    onSubmit([{
      id: uid(),
      name: displayName,
      kind: 'link',
      path: path.trim(),
      date: timestamp.toLocaleDateString(),
      updated_at: timestamp.toISOString(),
      deleted_at: null,
      sync_pending: true,
    }]);
    onClose();
  };

  return (
    <>
      <h2>Link a File</h2>
      <p className="modal-note">Enter a URL or the full path to a file on your computer.</p>
      <div className="field">
        <label>Display Name</label>
        <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Project Brief" />
      </div>
      <div className="field">
        <label>File Path or URL</label>
        <input value={path} onChange={(event) => setPath(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && submit()} placeholder="C:\\Users\\you\\Documents\\brief.pdf" />
        <small>Full path on your computer or an https link</small>
      </div>
      <div className="modal-actions">
        <button className="mbtn mbtn-sec" type="button" onClick={onClose}>Cancel</button>
        <button className="mbtn mbtn-pri" type="button" onClick={submit}>Add Link</button>
      </div>
    </>
  );
}
