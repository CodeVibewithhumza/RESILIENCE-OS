import { AlertOctagon, ZapOff, RotateCcw, ShieldAlert, ArrowRight, Workflow, CheckCircle2 } from 'lucide-react'

export default function IncidentPanel({
  incident,
  onTriggerFailure,
  onReset,
  activeCheckpointIndex = 0,
  onNextCheckpoint,
  onOpenExplainability
}) {
  const isActive = incident?.is_active || false
  const targetAsset = incident?.source_asset_id || 'GRID_MAIN'
  const severity = incident?.severity || 'HIGH'
  const affectedAssets = incident?.affected_asset_ids || []
  const affectedServices = incident?.affected_service_ids || []

  return (
    <div className={`incident-panel ${isActive ? 'is-active-incident' : ''}`} id="incident-module">
      {/* Panel Header */}
      <div className="incident-panel-header">
        <div className="incident-panel-title">
          <AlertOctagon
            size={16}
            style={{ color: isActive ? 'var(--status-critical)' : 'var(--accent-cyan)' }}
          />
          <span>Incident Injection & Control</span>
        </div>
        <span
          className={`badge font-mono ${
            isActive ? 'badge-critical' : 'badge-normal'
          }`}
        >
          <span className="status-dot status-dot-pulse" style={{ backgroundColor: isActive ? 'var(--status-critical)' : 'var(--status-normal)' }} />
          {isActive ? 'OUTAGE ACTIVE' : 'SYSTEM NORMAL'}
        </span>
      </div>

      {/* Panel Body */}
      <div className="incident-panel-body">
        {/* Scenario Specification Box */}
        <div className="incident-spec-box">
          <div className="incident-scenario-name">
            <ShieldAlert size={15} style={{ color: isActive ? 'var(--status-critical)' : 'var(--accent-cyan)' }} />
            <span>Catastrophic Main Grid Outage</span>
          </div>

          <div className="incident-meta-grid">
            <div className="incident-meta-cell">
              <span className="incident-meta-key">Target Asset</span>
              <span className="incident-meta-val font-mono">{targetAsset}</span>
            </div>
            <div className="incident-meta-cell">
              <span className="incident-meta-key">Failure Type</span>
              <span className="incident-meta-val font-mono">complete_outage</span>
            </div>
            <div className="incident-meta-cell">
              <span className="incident-meta-key">Severity</span>
              <span className="incident-meta-val font-mono" style={{ color: 'var(--status-critical)', fontWeight: 700 }}>
                {severity.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Affected Infrastructure Badges */}
        <div className="affected-group">
          <div className="affected-group-header">
            <span className="affected-group-title">
              Affected Infrastructure Nodes
            </span>
            <span className="badge badge-subtle font-mono">
              {isActive ? affectedAssets.length : 0} / 11
            </span>
          </div>
          <div className="affected-badges-wrap">
            {isActive ? (
              affectedAssets.map((assetId) => (
                <span key={assetId} className="affected-badge affected-badge-asset font-mono">
                  {assetId}
                </span>
              ))
            ) : (
              <div className="affected-empty-hint">
                <CheckCircle2 size={12} style={{ color: 'var(--status-normal)' }} />
                <span>All 11 assets operating within nominal boundaries</span>
              </div>
            )}
          </div>
        </div>

        {/* Affected Hospital Services Badges */}
        <div className="affected-group">
          <div className="affected-group-header">
            <span className="affected-group-title">
              Degraded Hospital Services
            </span>
            <span className="badge badge-subtle font-mono">
              {isActive ? affectedServices.length : 0} / 5
            </span>
          </div>
          <div className="affected-badges-wrap">
            {isActive ? (
              affectedServices.map((svcId) => (
                <span key={svcId} className="affected-badge affected-badge-service font-mono">
                  {svcId.replace('SERVICE_', '')}
                </span>
              ))
            ) : (
              <div className="affected-empty-hint">
                <CheckCircle2 size={12} style={{ color: 'var(--status-normal)' }} />
                <span>All 5 care units delivering 100% continuous care</span>
              </div>
            )}
          </div>
        </div>

        {/* Failure Injection & Transition Actions */}
        <div className="incident-actions-box">
          {!isActive ? (
            <>
              <button
                type="button"
                className="btn-trigger-outage"
                onClick={onTriggerFailure}
                title="Inject simulated primary grid outage"
              >
                <ZapOff size={15} />
                <span>Trigger Grid Failure</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary action-explain-btn"
                onClick={onOpenExplainability}
                title="Inspect simulated causal dependency paths"
              >
                <Workflow size={14} style={{ color: 'var(--accent-cyan)' }} />
                <span>Explain This Cascade</span>
              </button>
            </>
          ) : (
            <>
              {activeCheckpointIndex < 3 && (
                <button
                  type="button"
                  className="btn btn-cyan action-advance-btn"
                  onClick={onNextCheckpoint}
                  title="Step timeline forward to next cascade milestone"
                >
                  <span>Advance Cascade Step</span>
                  <ArrowRight size={14} />
                </button>
              )}
              <div className="incident-active-btn-row">
                <button
                  type="button"
                  className="btn btn-secondary action-explain-btn"
                  onClick={onOpenExplainability}
                  title="Inspect causal graph traversal and dependency explanation"
                >
                  <Workflow size={14} style={{ color: 'var(--accent-cyan)' }} />
                  <span>Explain This Cascade</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary action-reset-btn"
                  onClick={onReset}
                  title="Restore normal hospital baseline"
                >
                  <RotateCcw size={14} />
                  <span>Reset Baseline</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
