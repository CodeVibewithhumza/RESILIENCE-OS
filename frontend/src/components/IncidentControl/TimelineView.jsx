import { Clock, AlertTriangle, CheckCircle2, Circle } from 'lucide-react'

export default function TimelineView({
  timeline = [],
  isIncidentActive = false,
  activeCheckpointIndex = 0,
  onSelectCheckpoint
}) {
  return (
    <div className="timeline-panel">
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
          {isIncidentActive ? 'Cascade Unfolding (T+0 → T+20)' : 'Deterministic Standby'}
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

          const scoreColor = step.system_resilience_score >= 70
            ? 'var(--status-stable)'
            : step.system_resilience_score >= 50
            ? 'var(--status-warning)'
            : 'var(--status-critical)'

          return (
            <div
              key={step.t_offset_min}
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
                      T+{step.t_offset_min} MIN
                    </span>
                    <span className="timeline-title">{step.title}</span>
                  </div>

                  <div className="timeline-resilience-badge" style={{ color: scoreColor }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PREDICTED:</span>
                    <span>{step.system_resilience_score.toFixed(1)}</span>
                  </div>
                </div>

                <p className="timeline-description">
                  {step.description}
                </p>

                {/* Affected Nodes Badges */}
                {step.affected_node_ids && step.affected_node_ids.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                    {step.affected_node_ids.map((nodeId) => (
                      <span
                        key={nodeId}
                        className="badge badge-offline font-mono"
                        style={{ fontSize: '9px', padding: '1px 5px' }}
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
