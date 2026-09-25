import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function TimelineView({
  timeline = [],
  isIncidentActive = false,
  activeCheckpointIndex = 0,
  onSelectCheckpoint
}) {
  return (
    <div className="timeline-panel" id="cascade-timeline-module">
      {/* Panel Header */}
      <div className="timeline-panel-header">
        <div className="timeline-panel-title">
          <Clock size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span>Cascade Timeline Checkpoints ({timeline.length} Milestones)</span>
        </div>
        <span
          className={`badge font-mono ${
            isIncidentActive ? 'badge-critical' : 'badge-offline'
          }`}
        >
          {isIncidentActive ? (
            <>
              <span className="status-dot status-dot-pulse" style={{ backgroundColor: 'var(--status-critical)' }} />
              <span>
                Cascade Unfolding (T+{timeline[0]?.t_offset_min ?? 0} → T+{timeline[timeline.length - 1]?.t_offset_min ?? 20})
              </span>
            </>
          ) : (
            'Deterministic Standby'
          )}
        </span>
      </div>

      {/* Stepper View */}
      <div className="timeline-stepper">
        {timeline.map((step, idx) => {
          const isLast = idx === timeline.length - 1
          const isSelected = isIncidentActive && idx === activeCheckpointIndex
          const isCompleted = isIncidentActive && idx < activeCheckpointIndex
          const isActive = isIncidentActive && idx === activeCheckpointIndex

          let statusClass = ''
          if (isActive) statusClass = 'is-active'
          else if (isCompleted) statusClass = 'is-completed'

          const rawScore = typeof step.system_resilience_score === 'number'
            ? step.system_resilience_score
            : typeof step.resilience_score === 'number'
            ? step.resilience_score
            : null

          const scoreColor = rawScore !== null
            ? rawScore >= 70
              ? 'var(--status-stable)'
              : rawScore >= 50
              ? 'var(--status-warning)'
              : 'var(--status-critical)'
            : 'var(--status-warning)'

          return (
            <div
              key={step.t_offset_min !== undefined ? `milestone-${step.t_offset_min}` : `step-${idx}`}
              className={`timeline-step ${statusClass} ${isSelected ? 'is-selected' : ''}`}
              onClick={() => isIncidentActive && onSelectCheckpoint && onSelectCheckpoint(idx)}
              role="button"
              tabIndex={0}
            >
              {/* Stepper Line & Indicator */}
              <div className="timeline-indicator-col">
                <div className="timeline-dot">
                  {isCompleted ? (
                    <CheckCircle2 size={12} />
                  ) : isActive ? (
                    <AlertTriangle size={11} />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                {!isLast && <div className="timeline-line" />}
              </div>

              {/* Content Card */}
              <div className="timeline-card-content">
                <div className="timeline-card-top">
                  <div className="timeline-time-badge">
                    <span className="badge badge-cyan font-mono">
                      T+{step.t_offset_min ?? 0} MIN
                    </span>
                    <span className="timeline-title">{step.title}</span>
                  </div>

                  <div className="timeline-resilience-badge font-mono" style={{ color: scoreColor }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PREDICTED:</span>
                    <span>{rawScore !== null ? rawScore.toFixed(1) : '--'}</span>
                  </div>
                </div>

                <p className="timeline-description">
                  {step.description}
                </p>

                {/* Affected Nodes Badges */}
                {step.affected_node_ids && step.affected_node_ids.length > 0 && (
                  <div className="timeline-nodes-wrap">
                    {step.affected_node_ids.map((nodeId) => (
                      <span
                        key={nodeId}
                        className="badge badge-offline font-mono timeline-node-pill"
                      >
                        {nodeId}
                      </span>
                    ))}
                  </div>
                )}

                <div className="timeline-impact-footer">
                  <strong style={{ color: 'var(--text-secondary)' }}>Service Impact: </strong>
                  <span>{step.service_impact_summary}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
