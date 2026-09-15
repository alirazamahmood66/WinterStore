import { useEffect, useRef } from "react";
import * as bootstrap from "bootstrap";

function AdminModal({ modalId, show, title, icon = "bi-tags", size = "", onClose, children, footer }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const modal = bootstrap.Modal.getOrCreateInstance(ref.current);
    if (show) modal.show();
    else modal.hide();
  }, [show]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onHidden = () => onClose();
    el.addEventListener("hidden.bs.modal", onHidden);
    return () => el.removeEventListener("hidden.bs.modal", onHidden);
  }, [onClose]);

  return (
    <div className="modal fade" id={modalId} ref={ref} tabIndex="-1" aria-hidden="true">
      <div className={`modal-dialog modal-dialog-centered ${size ? `modal-${size}` : ""}`}>
        <div className="modal-content admin-modal">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title">
              <i className={`bi ${icon} me-2`}></i>
              {title}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>
          <div className="modal-body pt-2">
            {children}
          </div>
          {footer && <div className="modal-footer border-0 pt-0">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export default AdminModal;