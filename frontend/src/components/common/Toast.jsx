import { useEffect } from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'
import './Toast.css'

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      if (onClose) onClose()
    }, 3500)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={16} />
      case 'warning':
        return <AlertTriangle size={16} />
      case 'error':
        return <AlertCircle size={16} />
      case 'info':
      default:
        return <Info size={16} />
    }
  }

  return (
    <div className="resilience-toast-container" role="status" aria-live="polite">
      <div className={`resilience-toast-item toast-type-${toast.type || 'info'}`}>
        <div className="toast-icon-wrap">{getIcon()}</div>
        <span className="toast-msg-text">{toast.message}</span>
        <button
          type="button"
          className="toast-dismiss-btn"
          onClick={onClose}
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
