export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onClose,
  onConfirm,
}) {
  const submit = () => {
    onConfirm();
    onClose();
  };

  return (
    <>
      <h2>{title}</h2>
      <p className="modal-copy">{message}</p>
      <div className="modal-actions">
        <button className="mbtn mbtn-sec" type="button" onClick={onClose}>{cancelLabel}</button>
        <button className="mbtn mbtn-danger" type="button" onClick={submit}>{confirmLabel}</button>
      </div>
    </>
  );
}
