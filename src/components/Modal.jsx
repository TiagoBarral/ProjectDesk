export default function Modal({ modal, onClose }) {
  if (!modal) return null;

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal">{modal({ onClose })}</div>
    </div>
  );
}
