import { useState, useEffect, useMemo } from 'react'
import {
  X,
  Workflow,
  ArrowRight,
  GitBranch,
  ShieldAlert,
  CheckCircle2,
  FileText,
  HelpCircle,
  Database,
  AlertTriangle
} from 'lucide-react'
import './CausalDrawer.css'

export default function CausalDrawer({
  isOpen = false,
  onClose,
  explanationData,
  isLoading = false,
  error = null
}) {
  const [activeKey, setActiveKey] = useState(null)

  // Keyboard accessibility: ESC to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Generate dynamic tabs from explanationData keys
  const tabs = useMemo(() => {
    if (!explanationData || typeof explanationData !== 'object') return []
    return Object.keys(explanationData).map((key) => {
      if (key === 'strategy_recommendation') {
        return { key, label: 'Strategy Rationale' }
      }
      const item = explanationData[key]
      const label = item?.service_name || key.replace(/^SERVICE_/, '') + ' Path'
      return { key, label }
    })
  }, [explanationData])

  // Active tab management: preserve activeKey if valid, or select the first available tab
  useEffect(() => {
    if (tabs.length === 0) {
      setActiveKey(null)
      return
    }
    if (!activeKey || !tabs.some((t) => t.key === activeKey)) {
      setActiveKey(tabs[0].key)
    }
  }, [tabs, activeKey])

  if (!isOpen) return null

  // Loading state
  if (isLoading && (!explanationData || Object.keys(explanationData).length === 0)) {
    return (
      <div className="causal-drawer-backdrop" onClick={onClose}>
        <div className="causal-drawer-panel" onClick={(e) => e.stopPropagation()}>
          <div className="causal-drawer-header">
            <div className="causal-header-titles">
              <span className="causal-main-title">
                <Workflow size={16} style={{ color: 'var(--accent-cyan)' }} />
                <span>WHY DID RESILIENCE CHANGE?</span>
              </span>
              <span className="causal-sub-title">Traceable dependency-path explanation</span>
            </div>
            <button type="button" className="causal-close-btn" onClick={onClose} title="Close explanation drawer (Esc)">
              <X size={16} />
            </button>
          </div>
          <div className="causal-drawer-body">
            <div className="causal-empty-state">
              <Workflow size={28} style={{ color: 'var(--accent-cyan)' }} />
              <span>Loading causal explanation...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && (!explanationData || Object.keys(explanationData).length === 0)) {
    return (
      <div className="causal-drawer-backdrop" onClick={onClose}>
        <div className="causal-drawer-panel" onClick={(e) => e.stopPropagation()}>
          <div className="causal-drawer-header">
            <div className="causal-header-titles">
              <span className="causal-main-title">
                <Workflow size={16} style={{ color: 'var(--accent-cyan)' }} />
                <span>WHY DID RESILIENCE CHANGE?</span>
              </span>
              <span className="causal-sub-title">Traceable dependency-path explanation</span>
            </div>
            <button type="button" className="causal-close-btn" onClick={onClose} title="Close explanation drawer (Esc)">
              <X size={16} />
            </button>
          </div>
          <div className="causal-drawer-body">
            <div className="causal-empty-state">
              <AlertTriangle size={28} style={{ color: 'var(--status-critical)' }} />
              <span>Unable to load causal explanation.</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Empty / Safe State protection
  if (!explanationData || Object.keys(explanationData).length === 0) {
    return (
      <div className="causal-drawer-backdrop" onClick={onClose}>
        <div className="causal-drawer-panel" onClick={(e) => e.stopPropagation()}>
          <div className="causal-drawer-header">
            <div className="causal-header-titles">
              <span className="causal-main-title">
                <Workflow size={16} style={{ color: 'var(--accent-cyan)' }} />
                <span>WHY DID RESILIENCE CHANGE?</span>
              </span>
              <span className="causal-sub-title">Traceable dependency-path explanation</span>
            </div>
            <button type="button" className="causal-close-btn" onClick={onClose} title="Close explanation drawer (Esc)">
              <X size={16} />
            </button>
          </div>
          <div className="causal-drawer-body">
            <div className="causal-empty-state">
              <HelpCircle size={28} />
              <span>No causal explanation is available for this selection.</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentKey = activeKey || (tabs.length > 0 ? tabs[0].key : null)
  const currentItem = currentKey ? explanationData[currentKey] : null
  const dependencyPath = currentItem?.dependency_path || []
  const causalSteps = currentItem?.causal_steps || []
  const decisionFactors = currentItem?.decision_factors || []
  const summaryText = currentItem?.summary || 'No summary available for this item.'

  return (
    <div className="causal-drawer-backdrop" onClick={onClose}>
      <div className="causal-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* 1. Header */}
        <div className="causal-drawer-header">
          <div className="causal-header-titles">
            <span className="causal-main-title">
              <Workflow size={16} style={{ color: 'var(--accent-cyan)' }} />
              <span>WHY DID RESILIENCE CHANGE?</span>
            </span>
            <span className="causal-sub-title">
              Traceable dependency-path explanation • Graph traversal causal reasoning
            </span>
          </div>
          <button
            type="button"
            className="causal-close-btn"
            onClick={onClose}
            title="Close explanation drawer (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* 2. Dynamic View Selection Tabs */}
        {tabs.length > 1 && (
          <div className="causal-tabs-row">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`causal-tab-btn ${currentKey === tab.key ? 'is-active-tab' : ''}`}
                onClick={() => setActiveKey(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* 3. Scrollable Body Content */}
        <div className="causal-drawer-body">
          {!currentItem ? (
            <div className="causal-empty-state">
              <HelpCircle size={28} />
              <span>No causal explanation is available for this selection.</span>
            </div>
          ) : (
            <>
              {/* Explanation Summary Banner */}
              {summaryText && (
                <div className="causal-summary-card">
                  <div className="causal-summary-label">
                    <FileText size={12} />
                    <span>Causal Explanation Synthesis</span>
                  </div>
                  <p className="causal-summary-text">{summaryText}</p>
                </div>
              )}

              {/* Explicit Dependency Path */}
              {dependencyPath.length > 0 && (
                <div className="causal-path-section">
                  <span className="causal-section-heading">
                    <GitBranch size={13} style={{ color: 'var(--accent-cyan)' }} />
                    <span>Observed Propagation Path</span>
                  </span>

                  <div className="dependency-path-flow">
                    {dependencyPath.map((node, idx) => {
                      const isSource = idx === 0
                      const isTarget = idx === dependencyPath.length - 1
                      const nodeClass = isSource
                        ? 'path-node-source'
                        : isTarget
                        ? 'path-node-target'
                        : 'path-node-inter'

                      return (
                        <div key={node} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={`path-node-chip ${nodeClass} font-mono`}>
                            {node}
                          </span>
                          {idx < dependencyPath.length - 1 && (
                            <ArrowRight size={12} className="path-arrow-icon" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Sequential Causal Chain */}
              {causalSteps.length > 0 && (
                <div className="causal-chain-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="causal-section-heading">
                      <ShieldAlert size={13} style={{ color: 'var(--status-warning)' }} />
                      <span>Sequential Disruption Chain</span>
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Propagation Stages: {causalSteps.length}
                    </span>
                  </div>

                  <div className="causal-chain-list">
                    {causalSteps.map((stepText, idx) => (
                      <div key={idx} className="causal-step-item">
                        <span className="causal-step-badge font-mono">
                          STEP {idx + 1}
                        </span>
                        <p className="causal-step-text">{stepText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision Factors */}
              {decisionFactors.length > 0 && (
                <div className="causal-chain-section">
                  <span className="causal-section-heading">
                    <CheckCircle2 size={13} style={{ color: 'var(--status-normal)' }} />
                    <span>Ranking Factors & Optimization Rationale</span>
                  </span>

                  <div className="decision-factors-list">
                    {decisionFactors.map((factor, fIdx) => (
                      <div key={fIdx} className="decision-factor-item">
                        <span style={{ color: 'var(--status-normal)', flexShrink: 0, fontWeight: 700 }}>✓</span>
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 4. Footer Source Metadata */}
        <div className="causal-drawer-footer">
          <span className="causal-source-label">
            <Database size={12} style={{ color: 'var(--accent-cyan)' }} />
            <span>Telemetry Graph Engine • Causal Trace</span>
          </span>
          <span className="badge badge-subtle font-mono" style={{ fontSize: '9px' }}>
            Synchronized
          </span>
        </div>
      </div>
    </div>
  )
}
