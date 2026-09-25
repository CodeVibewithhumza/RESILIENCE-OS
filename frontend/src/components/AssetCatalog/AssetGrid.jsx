import { Zap, BatteryCharging, Wind, Flame, Droplets, Server, HeartPulse } from 'lucide-react'
import AssetCard from './AssetCard'
import './AssetCatalog.css'

const SUBSYSTEM_CONFIGS = [
  {
    key: 'clinical',
    name: 'Clinical Life-Support & Patient Units (ICU / OT / ED / Wards)',
    icon: HeartPulse,
    types: ['icu_bed', 'operating_theatre', 'emergency_bay', 'ward_room', 'nurse_station', 'ambulance_bay', 'admin_hub']
  },
  {
    key: 'power',
    name: 'Electrical Distribution & Grid',
    icon: Zap,
    types: ['grid', 'transformer', 'main_bus', 'emergency_bus']
  },
  {
    key: 'backup',
    name: 'Backup Generation & Battery Reserves',
    icon: BatteryCharging,
    types: ['generator', 'ups', 'battery']
  },
  {
    key: 'hvac',
    name: 'HVAC & Environmental Cooling',
    icon: Wind,
    types: ['chiller_hvac']
  },
  {
    key: 'gas',
    name: 'Medical Gas & Cryogenic O2',
    icon: Flame,
    types: ['oxygen_system']
  },
  {
    key: 'water',
    name: 'Potable & Booster Water',
    icon: Droplets,
    types: ['water_pump']
  }
]

export default function AssetGrid({ assets = [], selectedAssetId, onSelectAsset }) {
  // Aggregate dynamic status counts derived from active state
  const normalCount = assets.filter((a) => a.status === 'normal').length
  const offlineCount = assets.filter((a) => a.status === 'offline').length
  const degradedCount = assets.filter((a) => a.status === 'degraded' || a.status === 'starting').length
  const failedCount = assets.filter((a) => a.status === 'failed' || a.status === 'critical').length

  return (
    <div className="panel asset-catalog-container" id="assets-module">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title">
          <Server size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span>Infrastructure Asset Catalog ({assets.length} Nodes)</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-normal font-mono">
            {normalCount} Normal
          </span>
          {offlineCount > 0 && (
            <span className="badge badge-offline font-mono">
              {offlineCount} Standby
            </span>
          )}
          {degradedCount > 0 && (
            <span className="badge badge-warning font-mono">
              {degradedCount} Degraded
            </span>
          )}
          {failedCount > 0 && (
            <span className="badge badge-critical font-mono">
              {failedCount} Critical / Failed
            </span>
          )}
        </div>
      </div>

      {/* Subsystem Categorized Sections */}
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {SUBSYSTEM_CONFIGS.map((subsys) => {
          const SubsystemIcon = subsys.icon
          const matchingAssets = assets.filter((a) => subsys.types.includes(a.type))

          if (matchingAssets.length === 0) return null

          return (
            <div key={subsys.key} className="asset-subsystem-section">
              <div className="subsystem-heading">
                <SubsystemIcon size={14} style={{ color: 'var(--accent-cyan)' }} />
                <span>{subsys.name}</span>
                <span className="subsystem-count font-mono">{matchingAssets.length} Assets</span>
              </div>

              <div className="asset-cards-grid">
                {matchingAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedAssetId === asset.id}
                    onSelect={onSelectAsset}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
