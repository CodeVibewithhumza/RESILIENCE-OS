import { useState, useEffect } from 'react'
import {
  X,
  Workflow,
  ArrowRight,
  GitBranch,
  ShieldAlert,
  CheckCircle2,
  FileText,
  HelpCircle,
  Database
} from 'lucide-react'
import './CausalDrawer.css'

export default function CausalDrawer({
  isOpen = false,
  onClose,
  explanationData
}) {
  const [activeKey, setActiveKey] = useState('SERVICE_ICU')

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

  if (!isOpen) return null

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
            <button type="button" className="causal-close-btn" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
          <div className="causal-drawer-body">
            <div className="causal-empty-state">
              <HelpCircle size={28} />
              <span>Explainability data unavailable for this simulation state.</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentItem = explanationData[activeKey] || explanationData.SERVICE_ICU || Object.values(explanationData)[0]
  const dependencyPath = currentItem?.dependency_path || []
  const causalSteps = currentItem?.causal_steps || []
  const decisionFactors = currentItem?.decision_factors || []
  const summaryText = currentItem?.summary || 'No summary available for this item.'

  const tabs = [
    { key: 'SERVICE_ICU', label: 'ICU Cascade Path' },
    { key: 'SERVICE_OT', label: 'OT Thermal Path' },
    { key: 'strategy_recommendation', label: 'Strategy Rationale' }
  ].filter((tab) => explanationData[tab.key] !== undefined)

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
              Traceable dependency-path explanation • Simulated causal reasoning
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

        {/* 2. View Selection Tabs */}
        {tabs.length > 1 && (
          <div className="causal-tabs-row">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`causal-tab-btn ${activeKey === tab.key ? 'is-active-tab' : ''}`}
                onClick={() => setActiveKey(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* 3. Scrollable Body Content */}
        <div className="causal-drawer-body">
          {/* Explanation Summary Banner */}
          <div className="causal-summary-card">
            <div className="causal-summary-label">
              <FileText size={12} />
              <span>Simulated Causal Explanation Summary</span>
            </div>
            <p className="causal-summary-text">{summaryText}</p>
          </div>

          {/* Explicit Dependency Path (if present in fixture) */}
          {dependencyPath.length > 0 && (
            <div className="causal-path-section">
              <span className="causal-section-heading">
                <GitBranch size={13} style={{ color: 'var(--accent-cyan)' }} />
                <span>Observed Dependency Traversal Path</span>
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
                    <div key={node} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`path-node-chip ${nodeClass}`}>
                        {node}
                      </span>
                      {idx < dependencyPath.length - 1 && (
                        <ArrowRight size={13} className="path-arrow-icon" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Sequential Causal Chain (if present in fixture) */}
          {causalSteps.length > 0 && (
            <div className="causal-chain-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="causal-section-heading">
                  <ShieldAlert size={13} style={{ color: 'var(--status-warning)' }} />
                  <span>Sequential Disruption Chain</span>
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Failure ➔ Dependency ➔ Impact ➔ Service
                </span>
              </div>

              <div className="causal-chain-list">
                {causalSteps.map((stepText, idx) => (
                  <div key={idx} className="causal-step-item">
                    <span className="causal-step-badge">
                      STEP {idx + 1}
                    </span>
                    <p className="causal-step-text">{stepText}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision Factors (if present in fixture) */}
          {decisionFactors.length > 0 && (
            <div className="causal-chain-section">
              <span className="causal-section-heading">
                <CheckCircle2 size={13} style={{ color: 'var(--status-normal)' }} />
                <span>Simulated Decision Ranking Criteria</span>
              </span>

              <div className="decision-factors-list">
                {decisionFactors.map((factor, fIdx) => (
                  <div key={fIdx} className="decision-factor-item">
                    <span style={{ color: 'var(--status-normal)', flexShrink: 0 }}>✓</span>
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. Footer Source Metadata */}
        <div className="causal-drawer-footer">
          <span className="causal-source-label">
            <Database size={12} style={{ color: 'var(--accent-cyan)' }} />
            <span>Source: Simulated dependency graph + cascade fixture</span>
          </span>
          <span className="badge badge-offline font-mono" style={{ fontSize: '9px' }}>
            Prototype Trace
          </span>
        </div>
      </div>
    </div>
  )
}
