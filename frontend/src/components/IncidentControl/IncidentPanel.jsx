import { AlertOctagon, ZapOff, RotateCcw, ShieldAlert, ArrowRight, Workflow } from 'lucide-react'

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
    <div className={`incident-panel ${isActive ? 'is-active-incident' : ''}`}>
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
          className={`badge font-mono ${isActive ? 'badge-critical' : 'badge-normal'
            }`}
        >
          {isActive ? 'OUTAGE ACTIVE' : 'SYSTEM NORMAL'}
        </span>
      </div>

      {/* Panel Body */}
      <div className="incident-panel-body">
        {/* Scenario Specification */}
        <div className="incident-spec-box">
          <div className="incident-scenario-name">
            <ShieldAlert size={14} style={{ color: isActive ? 'var(--status-critical)' : 'var(--accent-cyan)' }} />
            <span>Catastrophic Main Grid Outage</span>
          </div>

          <div className="incident-meta-grid">
            <div className="incident-meta-cell">
              <span className="incident-meta-key">Target Asset</span>
              <span className="incident-meta-val">{targetAsset}</span>
            </div>
            <div className="incident-meta-cell">
              <span className="incident-meta-key">Failure Type</span>
              <span className="incident-meta-val font-mono">complete_outage</span>
            </div>
            <div className="incident-meta-cell">
              <span className="incident-meta-key">Severity</span>
              <span className="incident-meta-val" style={{ color: 'var(--status-critical)' }}>
                {severity.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Affected Infrastructure Badges */}
        <div className="affected-group">
          <span className="affected-group-title">
            Affected Infrastructure Nodes ({isActive ? affectedAssets.length : 0})
          </span>
          <div className="affected-badges-wrap">
            {isActive ? (
              affectedAssets.map((assetId) => (
                <span key={assetId} className="affected-badge affected-badge-asset">
                  {assetId}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                None — All 11 assets operating at nominal capacity
              </span>
            )}
          </div>
        </div>

        {/* Affected Services Badges */}
        <div className="affected-group">
          <span className="affected-group-title">
            Degraded Hospital Services ({isActive ? affectedServices.length : 0})
          </span>
          <div className="affected-badges-wrap">
            {isActive ? (
              affectedServices.map((svcId) => (
                <span key={svcId} className="affected-badge affected-badge-service">
                  {svcId.replace('SERVICE_', '')}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                None — All 5 care services delivering 100% continuity
              </span>
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
                className="btn btn-secondary"
                onClick={onOpenExplainability}
                style={{ height: '34px', fontWeight: 600, width: '100%' }}
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
                  className="btn btn-cyan"
                  onClick={onNextCheckpoint}
                  style={{ height: '36px', fontWeight: 700, width: '100%' }}
                  title="Step timeline forward to next cascade milestone"
                >
                  <span>Advance Cascade Step</span>
                  <ArrowRight size={14} />
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onOpenExplainability}
                style={{ height: '34px', fontWeight: 600, width: '100%' }}
                title="Inspect causal graph traversal and dependency explanation"
              >
                <Workflow size={14} style={{ color: 'var(--accent-cyan)' }} />
                <span>Explain This Cascade</span>
              </button>
              <button
                type="button"
                className="btn-reset-baseline"
                onClick={onReset}
                title="Restore normal hospital baseline"
              >
                <RotateCcw size={14} />
                <span>Reset Baseline</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
