import type { MouseEvent } from 'react'
import type { ToothCondition } from './odontogramUtils'

interface ToothCellProps {
  universalNumber: number
  displayNumber: number
  condition: ToothCondition
  activeSurfaces: string[] // e.g. ["M", "O", "D"]
  isSelected: boolean
  isUpper: boolean
  onSelectTooth: (num: number) => void
  onToggleSurface?: (surface: string) => void
}

export function ToothCell({
  universalNumber,
  displayNumber,
  condition,
  activeSurfaces,
  isSelected,
  isUpper,
  onSelectTooth,
  onToggleSurface,
}: ToothCellProps) {
  // Determine surface colors based on condition and active surfaces
  function getSurfaceFill(surfaceCode: string): string {
    if (activeSurfaces.includes(surfaceCode)) {
      return '#3B82F6' // Selected surface active blue
    }
    switch (condition) {
      case 'Decayed':
        return '#FEE2E2' // Light red for decayed surfaces
      case 'Restored':
        return '#DBEAFE' // Light blue for filled surfaces
      case 'Crown':
        return '#FEF3C7' // Warm amber for crown
      case 'RootCanal':
        return '#EDE9FE' // Purple tint for RCT
      case 'Implant':
        return '#CFFAFE' // Cyan tint
      case 'Missing':
        return '#F1F5F9' // Gray
      default:
        return '#FFFFFF' // Clean sound tooth
    }
  }

  function handleSurfaceClick(e: MouseEvent, surface: string) {
    e.stopPropagation()
    onSelectTooth(universalNumber)
    if (onToggleSurface) {
      onToggleSurface(surface)
    }
  }

  // Anterior teeth (canines & incisors) have Incisal edge (I), posterior have Occlusal (O)
  const isAnterior =
    (universalNumber >= 6 && universalNumber <= 11) ||
    (universalNumber >= 22 && universalNumber <= 27)
  const centerLabel = isAnterior ? 'I' : 'O'

  return (
    <div
      onClick={() => onSelectTooth(universalNumber)}
      className={`group relative flex flex-col items-center cursor-pointer rounded-lg p-1 transition-all ${
        isSelected
          ? 'bg-blue-50 ring-2 ring-[#2563EB] shadow-sm scale-105 z-10'
          : 'hover:bg-slate-50'
      }`}
      title={`Tooth #${displayNumber} (${condition})`}
    >
      {isSelected && (
        <div className="absolute -top-1 -right-1 z-20 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#2563EB] text-[9px] font-bold text-white shadow ring-1 ring-white">
          ✓
        </div>
      )}
      {/* Top Number Label (Upper Arch: display on top) */}
      {isUpper && (
        <span
          className={`mb-1 text-[11px] font-bold ${
            isSelected ? 'text-[#2563EB]' : 'text-slate-600 group-hover:text-slate-900'
          }`}
        >
          {displayNumber}
        </span>
      )}

      {/* Anatomical 5-Surface Interactive SVG */}
      <div className="relative h-11 w-11">
        <svg viewBox="0 0 100 100" className="h-full w-full select-none drop-shadow-sm">
          {/* Top Surface: Buccal (Upper) or Lingual (Lower) */}
          <polygon
            points="0,0 100,0 75,25 25,25"
            fill={getSurfaceFill('B')}
            stroke="#94A3B8"
            strokeWidth="2"
            onClick={(e) => handleSurfaceClick(e, 'B')}
            className="transition-colors hover:fill-blue-200"
          />

          {/* Bottom Surface: Lingual (Upper) or Buccal (Lower) */}
          <polygon
            points="25,75 75,75 100,100 0,100"
            fill={getSurfaceFill('L')}
            stroke="#94A3B8"
            strokeWidth="2"
            onClick={(e) => handleSurfaceClick(e, 'L')}
            className="transition-colors hover:fill-blue-200"
          />

          {/* Left Surface: Mesial / Distal */}
          <polygon
            points="0,0 25,25 25,75 0,100"
            fill={getSurfaceFill('M')}
            stroke="#94A3B8"
            strokeWidth="2"
            onClick={(e) => handleSurfaceClick(e, 'M')}
            className="transition-colors hover:fill-blue-200"
          />

          {/* Right Surface: Distal / Mesial */}
          <polygon
            points="75,25 100,0 100,100 75,75"
            fill={getSurfaceFill('D')}
            stroke="#94A3B8"
            strokeWidth="2"
            onClick={(e) => handleSurfaceClick(e, 'D')}
            className="transition-colors hover:fill-blue-200"
          />

          {/* Center Surface: Occlusal (O) / Incisal (I) */}
          <rect
            x="25"
            y="25"
            width="50"
            height="50"
            fill={getSurfaceFill('O')}
            stroke="#94A3B8"
            strokeWidth="2"
            onClick={(e) => handleSurfaceClick(e, 'O')}
            className="transition-colors hover:fill-blue-200"
          />

          {/* Center Surface Code Label */}
          <text
            x="50"
            y="55"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="22"
            fontWeight="bold"
            fill="#64748B"
            className="pointer-events-none"
          >
            {centerLabel}
          </text>

          {/* Overlay: Decayed Markings */}
          {condition === 'Decayed' && (
            <circle cx="50" cy="50" r="14" fill="#EF4444" opacity="0.8" className="pointer-events-none" />
          )}

          {/* Overlay: Crown Crosshatch */}
          {condition === 'Crown' && (
            <rect
              x="5"
              y="5"
              width="90"
              height="90"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="4"
              strokeDasharray="6,4"
              className="pointer-events-none"
            />
          )}

          {/* Overlay: Root Canal Vertical Line */}
          {condition === 'RootCanal' && (
            <line
              x1="50"
              y1="5"
              x2="50"
              y2="95"
              stroke="#8B5CF6"
              strokeWidth="5"
              strokeLinecap="round"
              className="pointer-events-none"
            />
          )}

          {/* Overlay: Implant Threaded Marker */}
          {condition === 'Implant' && (
            <g className="pointer-events-none">
              <circle cx="50" cy="50" r="16" fill="none" stroke="#06B6D4" strokeWidth="4" />
              <line x1="42" y1="50" x2="58" y2="50" stroke="#06B6D4" strokeWidth="3" />
            </g>
          )}

          {/* Overlay: Missing Tooth (Struck Out) */}
          {condition === 'Missing' && (
            <g className="pointer-events-none">
              <line x1="8" y1="8" x2="92" y2="92" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
              <line x1="92" y1="8" x2="8" y2="92" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
            </g>
          )}
        </svg>
      </div>

      {/* Bottom Number Label (Lower Arch: display below) */}
      {!isUpper && (
        <span
          className={`mt-1 text-[11px] font-bold ${
            isSelected ? 'text-[#2563EB]' : 'text-slate-600 group-hover:text-slate-900'
          }`}
        >
          {displayNumber}
        </span>
      )}
    </div>
  )
}
