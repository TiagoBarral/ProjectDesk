export default function NotesTab({ project, onUpdateNotes, onShowSaved }) {
  return (
    <>
      <div className="section-header">
        <div className="section-label">Notes</div>
        <button className="add-btn" type="button" onClick={onShowSaved}>Save</button>
      </div>
      <div className="notes-box">
        <textarea
          className="notes-ta"
          value={project.notes}
          onChange={(event) => onUpdateNotes(event.target.value)}
          placeholder="Write anything about this project..."
        />
      </div>
    </>
  );
}
