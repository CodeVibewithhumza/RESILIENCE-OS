import { Hospital } from 'lucide-react'
import ServiceCard from './ServiceCard'
import './ServiceStatus.css'

export default function ServiceList({ services = [], selectedServiceId, onSelectService }) {
  const atRiskCount = services.filter((s) => s.at_risk).length
  const operationalCount = services.filter((s) => s.status === 'full_operation').length

  return (
    <div className="panel service-list-container" id="services-module">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title">
          <Hospital size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span>Hospital Critical Care Services ({services.length} Clinical Units)</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-normal font-mono">
            {operationalCount} / {services.length} Full Continuity
          </span>
          {atRiskCount > 0 && (
            <span className="badge badge-critical font-mono">
              {atRiskCount} Compromised / At Risk
            </span>
          )}
        </div>
      </div>

      {/* Services Grid */}
      <div className="panel-body">
        <div className="service-cards-grid">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isSelected={selectedServiceId === service.id}
              onSelect={onSelectService}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
