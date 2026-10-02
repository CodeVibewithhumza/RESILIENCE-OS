import { useState, useMemo } from 'react'
import {
  Search,
  AlertTriangle,
  SlidersHorizontal,
  CheckCircle2,
  Box,
  Layers,
  Activity,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react'
import { STATUS_COLORS } from '../DigitalTwin3D/twinConstants'
import './StartSimulationView.css'

export default function SimulationTelemetryTable({
  matrixRows = [],
  crisisAssetCount = 0,
  selectedAssetId = null,
  onSelectAsset,
  onSelectFloor,
  compactMode = true
}) {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Filtered rows by search and tab
  const filteredRows = useMemo(() => {
    let rows = matrixRows

    // 1. Tab filter
    if (activeTab === 'critical') {
      rows = rows.filter(
        (r) => r.status === 'failed' || r.status === 'critical' || r.status === 'degraded'
      )
    } else if (activeTab === 'floor_3') {
      rows = rows.filter((r) => r.floorId === 'floor_3')
    } else if (activeTab === 'floor_2') {
      rows = rows.filter((r) => r.floorId === 'floor_2')
    } else if (activeTab === 'floor_1') {
      rows = rows.filter((r) => r.floorId === 'floor_1')
    } else if (activeTab === 'floor_0') {
      rows = rows.filter((r) => r.floorId === 'floor_0')
    }

    // 2. Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      rows = rows.filter(
        (r) =>
          r.shortName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          (r.subsystem && r.subsystem.toLowerCase().includes(q)) ||
          (r.telemetryText && r.telemetryText.toLowerCase().includes(q)) ||
          r.status.toLowerCase().includes(q)
      )
    }

    return rows
  }, [matrixRows, activeTab, searchQuery])

  const handleTabClick = (tabKey, floorId = null) => {
    setActiveTab(tabKey)
    if (onSelectFloor) {
      onSelectFloor(floorId || 'all')
    }
  }

  const handleRowClick = (row) => {
    if (onSelectAsset) {
      onSelectAsset(row.id)
    }
    if (onSelectFloor && row.floorId) {
      onSelectFloor(row.floorId)
    }
  }

  return (
    <div className={`sim-telemetry-matrix-card ${compactMode ? 'is-compact' : 'is-fullwidth'}`}>
      {/* Header Bar */}
      <div className="telemetry-card-header">
        <div className="telemetry-header-title-col">
          <div className="telemetry-title-badge-row">
            <span className="telemetry-card-title">Live Telemetry Matrix</span>
            {crisisAssetCount > 0 ? (
              <span className="telemetry-alert-badge">
                <AlertTriangle size={11} />
                <span>{crisisAssetCount} Distressed</span>
              </span>
            ) : (
              <span className="telemetry-nominal-badge">
                <CheckCircle2 size={11} />
                <span>All Nominal</span>
              </span>
            )}
          </div>
          <span className="telemetry-card-subtitle">
            Synchronized Real-Time Node Health & Infrastructure Telemetry
          </span>
        </div>

        {/* Search Bar */}
        <div className="telemetry-search-wrap">
          <Search size={13} className="telemetry-search-icon" />
          <input
            type="text"
            className="telemetry-search-input font-mono"
            placeholder="Search asset, ID, subsystem..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="telemetry-search-clear"
              onClick={() => setSearchQuery('')}
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Floor & Filter Segment Tabs */}
      <div className="telemetry-filter-tabs">
        <button
          type="button"
          className={`telemetry-tab-pill ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabClick('all', 'all')}
        >
          <span>All</span>
          <span className="tab-count-badge font-mono">{matrixRows.length}</span>
        </button>

        <button
          type="button"
          className={`telemetry-tab-pill alert-tab ${activeTab === 'critical' ? 'active' : ''}`}
          onClick={() => handleTabClick('critical')}
        >
          <span>Alerts</span>
          <span className={`tab-count-badge font-mono ${crisisAssetCount > 0 ? 'badge-alert' : ''}`}>
            {crisisAssetCount}
          </span>
        </button>

        <button
          type="button"
          className={`telemetry-tab-pill ${activeTab === 'floor_3' ? 'active' : ''}`}
          onClick={() => handleTabClick('floor_3', 'floor_3')}
        >
          <span className="tab-floor-indicator red-dot" />
          <span>L3 ICU</span>
        </button>

        <button
          type="button"
          className={`telemetry-tab-pill ${activeTab === 'floor_2' ? 'active' : ''}`}
          onClick={() => handleTabClick('floor_2', 'floor_2')}
        >
          <span className="tab-floor-indicator purple-dot" />
          <span>L2 Wards</span>
        </button>

        <button
          type="button"
          className={`telemetry-tab-pill ${activeTab === 'floor_1' ? 'active' : ''}`}
          onClick={() => handleTabClick('floor_1', 'floor_1')}
        >
          <span className="tab-floor-indicator blue-dot" />
          <span>L1 ED</span>
        </button>

        <button
          type="button"
          className={`telemetry-tab-pill ${activeTab === 'floor_0' ? 'active' : ''}`}
          onClick={() => handleTabClick('floor_0', 'floor_0')}
        >
          <span className="tab-floor-indicator cyan-dot" />
          <span>L0 Plant</span>
        </button>
      </div>

      {/* Main Content Area */}
      {compactMode ? (
        /* COMPACT CARD LIST (Split View) */
        <div className="telemetry-compact-list-body">
          {filteredRows.length === 0 ? (
            <div className="telemetry-empty-state">
              <ShieldAlert size={24} style={{ color: 'var(--text-muted)' }} />
              <span>No telemetry records matching filter criteria</span>
            </div>
          ) : (
            filteredRows.map((row) => {
              const isSelected = selectedAssetId === row.id
              const statusColor = STATUS_COLORS[row.status] || '#10B981'
              const isFailed = row.status === 'failed'

              return (
                <div
                  key={row.id}
                  className={`telemetry-card-item status-${row.status} ${
                    isSelected ? 'is-selected' : ''
                  } ${row.isSourceFailure ? 'is-source-failure' : ''}`}
                  onClick={() => handleRowClick(row)}
                  title={`Focus ${row.shortName} in 3D Campus View`}
                >
                  <div className="item-left-cell">
                    <span
                      className={`status-pulse-beacon ${isFailed ? 'beacon-pulse-anim' : ''}`}
                      style={{
                        backgroundColor: statusColor,
                        boxShadow: `0 0 6px ${statusColor}`
                      }}
                    />
                    <div className="item-name-block">
                      <div className="item-title-row">
                        <span className="item-title">{row.shortName}</span>
                        <span className="item-floor-chip">{row.floorBadge}</span>
                      </div>
                      <span className="item-subsystem-label">{row.subsystem}</span>
                    </div>
                  </div>

                  <div className="item-right-cell">
                    <span className="item-metric-reading font-mono">{row.telemetryText}</span>
                    <div className="item-health-bar-track">
                      <div
                        className="item-health-bar-fill"
                        style={{
                          width: `${row.healthScore}%`,
                          backgroundColor: statusColor
                        }}
                      />
                    </div>
                    <span className={`item-status-pill status-${row.status} font-mono`}>
                      {row.status}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        /* FULL TABLE DATA GRID (Table Only View) */
        <div className="telemetry-full-grid-body">
          <div className="telemetry-grid-table-wrap">
            <table className="telemetry-data-table">
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '8%' }}>Floor</th>
                  <th style={{ width: '22%' }}>Asset Name & Identifier</th>
                  <th style={{ width: '20%' }}>Subsystem & Role</th>
                  <th style={{ width: '16%' }}>Live Telemetry</th>
                  <th style={{ width: '14%' }} title="Infrastructure resilience buffer and supply margin">Resilience Margin</th>
                  <th style={{ width: '10%' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="telemetry-empty-row">
                      No assets found matching current filter
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const isSelected = selectedAssetId === row.id
                    const statusColor = STATUS_COLORS[row.status] || '#10B981'

                    return (
                      <tr
                        key={row.id}
                        className={`telemetry-table-row status-${row.status} ${
                          isSelected ? 'is-selected' : ''
                        }`}
                        onClick={() => handleRowClick(row)}
                      >
                        <td>
                          <div className="table-status-cell">
                            <span
                              className="status-dot-sm"
                              style={{
                                backgroundColor: statusColor,
                                boxShadow: `0 0 6px ${statusColor}`
                              }}
                            />
                            <span className={`table-status-tag status-${row.status} font-mono`}>
                              {row.status.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="table-floor-badge font-mono">{row.floorBadge}</span>
                        </td>
                        <td>
                          <div className="table-name-cell">
                            <span className="table-asset-name">{row.shortName}</span>
                            <span className="table-asset-id font-mono">{row.id}</span>
                          </div>
                        </td>
                        <td>
                          <span className="table-subsystem-text">{row.subsystem}</span>
                        </td>
                        <td>
                          <span className="table-telemetry-val font-mono">{row.telemetryText}</span>
                        </td>
                        <td>
                          <div className="table-health-cell">
                            <div className="table-health-bar">
                              <div
                                className="table-health-fill"
                                style={{
                                  width: `${row.healthScore}%`,
                                  backgroundColor: statusColor
                                }}
                              />
                            </div>
                            <span className="table-health-pct font-mono">{row.healthScore}%</span>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="table-inspect-btn font-mono"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRowClick(row)
                            }}
                          >
                            <span>Inspect</span>
                            <ArrowUpRight size={11} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer Summary / Quick Stats */}
      <div className="telemetry-card-footer">
        <div className="telemetry-footer-stats">
          <span className="footer-stat-item">
            Total Assets: <strong className="font-mono">{matrixRows.length}</strong>
          </span>
          <span className="footer-stat-divider">•</span>
          <span className="footer-stat-item">
            Distressed: <strong className="font-mono text-red">{crisisAssetCount}</strong>
          </span>
          <span className="footer-stat-divider">•</span>
          <span className="footer-stat-item">
            Baseline: <strong className="font-mono text-green">{matrixRows.length - crisisAssetCount}</strong>
          </span>
        </div>
        <span className="telemetry-footer-hint">Click row to reticle & target node in 3D</span>
      </div>
    </div>
  )
}
