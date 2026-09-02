import { useState } from 'react'
import {
  universalToFDI,
  getToothName,
  type ToothCondition,
  type ToothData,
} from './odontogramUtils'
import { ToothCell } from './ToothCell'

interface OdontogramProps {
  chart: Record<number, ToothData>
  selectedTooth: number | null
  selectedSurfaces: string[]
  onSelectTooth: (num: number) => void
  onToggleSurface: (surface: string) => void
  onUpdateCondition: (toothNumber: number, condition: ToothCondition) => void
  readOnly?: boolean
}

// Universal numbering arches
const UPPER_RIGHT = [1, 2, 3, 4, 5, 6, 7, 8]
const UPPER_LEFT = [9, 10, 11, 12, 13, 14, 15, 16]
const LOWER_LEFT = [17, 18, 19, 20, 21, 22, 23, 24]
const LOWER_RIGHT = [32, 31, 30, 29, 28, 27, 26, 25]

export function Odontogram({
  chart,
  selectedTooth,
  selectedSurfaces,
  onSelectTooth,
  onToggleSurface,
  onUpdateCondition,
  readOnly = false,
}: OdontogramProps) {
  const [notation, setNotation] = useState<'FDI' | 'Universal'>('FDI')

  function getDisplayNumber(univ: number): number {
    return notation === 'FDI' ? universalToFDI(univ) : univ
  }

  const selectedData = selectedTooth ? chart[selectedTooth] : null

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      {/* Header with System Switcher */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">Adult Dental Chart (Odontogram)</h2>
          <p className="text-xs text-slate-500">
            Click teeth or surfaces (M, O, D, B, L) to chart procedures and conditions.
          </p>
        </div>

        {/* Notation Selector */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setNotation('FDI')}
            className={`rounded-lg px-3 py-1 transition-all ${
              notation === 'FDI'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            FDI Two-Digit (11–48)
          </button>
          <button
            type="button"
            onClick={() => setNotation('Universal')}
            className={`rounded-lg px-3 py-1 transition-all ${
              notation === 'Universal'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Universal (1–32)
          </button>
        </div>
      </div>

      {/* Anatomical Upper & Lower Dental Arches */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[620px] space-y-4">
          {/* Upper Arch (Maxillary) */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-400 px-2">
              <span>Maxillary Right (UR)</span>
              <span className="font-bold text-slate-500 uppercase tracking-wide">Upper Arch</span>
              <span>Maxillary Left (UL)</span>
            </div>
            <div className="flex justify-center gap-6">
              {/* Upper Right (1-8) */}
              <div className="flex gap-1">
                {UPPER_RIGHT.map((univ) => {
                  const data = chart[univ]
                  return (
                    <ToothCell
                      key={univ}
                      universalNumber={univ}
                      displayNumber={getDisplayNumber(univ)}
                      condition={data?.condition || 'Sound'}
                      activeSurfaces={selectedTooth === univ ? selectedSurfaces : []}
                      isSelected={selectedTooth === univ}
                      isUpper={true}
                      onSelectTooth={onSelectTooth}
                      onToggleSurface={readOnly ? undefined : onToggleSurface}
                    />
                  )
                })}
              </div>

              {/* Midline Divider */}
              <div className="w-px bg-slate-300 my-1 self-stretch" title="Midline" />

              {/* Upper Left (9-16) */}
              <div className="flex gap-1">
                {UPPER_LEFT.map((univ) => {
                  const data = chart[univ]
                  return (
                    <ToothCell
                      key={univ}
                      universalNumber={univ}
                      displayNumber={getDisplayNumber(univ)}
                      condition={data?.condition || 'Sound'}
                      activeSurfaces={selectedTooth === univ ? selectedSurfaces : []}
                      isSelected={selectedTooth === univ}
                      isUpper={true}
                      onSelectTooth={onSelectTooth}
                      onToggleSurface={readOnly ? undefined : onToggleSurface}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* Lower Arch (Mandibular) */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <div className="flex justify-center gap-6">
              {/* Lower Right (32-25) */}
              <div className="flex gap-1">
                {LOWER_RIGHT.map((univ) => {
                  const data = chart[univ]
                  return (
                    <ToothCell
                      key={univ}
                      universalNumber={univ}
                      displayNumber={getDisplayNumber(univ)}
                      condition={data?.condition || 'Sound'}
                      activeSurfaces={selectedTooth === univ ? selectedSurfaces : []}
                      isSelected={selectedTooth === univ}
                      isUpper={false}
                      onSelectTooth={onSelectTooth}
                      onToggleSurface={readOnly ? undefined : onToggleSurface}
                    />
                  )
                })}
              </div>

              {/* Midline Divider */}
              <div className="w-px bg-slate-300 my-1 self-stretch" title="Midline" />

              {/* Lower Left (17-24) */}
              <div className="flex gap-1">
                {LOWER_LEFT.map((univ) => {
                  const data = chart[univ]
                  return (
                    <ToothCell
                      key={univ}
                      universalNumber={univ}
                      displayNumber={getDisplayNumber(univ)}
                      condition={data?.condition || 'Sound'}
                      activeSurfaces={selectedTooth === univ ? selectedSurfaces : []}
                      isSelected={selectedTooth === univ}
                      isUpper={false}
                      onSelectTooth={onSelectTooth}
                      onToggleSurface={readOnly ? undefined : onToggleSurface}
                    />
                  )
                })}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-400 px-2">
              <span>Mandibular Right (LR)</span>
              <span className="font-bold text-slate-500 uppercase tracking-wide">Lower Arch</span>
              <span>Mandibular Left (LL)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Tooth Surface Controls & Condition Setter */}
      {selectedTooth && !readOnly && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-800">
                Selected: Tooth #{getDisplayNumber(selectedTooth)}{' '}
                <span className="text-xs font-normal text-slate-500">
                  ({getToothName(selectedTooth)})
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                <span className="font-semibold">Surfaces:</span>
                {['M', 'O', 'D', 'B', 'L'].map((s) => {
                  const active = selectedSurfaces.includes(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onToggleSurface(s)}
                      className={`h-6 w-6 rounded font-bold transition-colors ${
                        active
                          ? 'bg-[#2563EB] text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-blue-100'
                      }`}
                    >
                      {s}
                    </button>
                  )
                })}
                {selectedSurfaces.length > 0 && (
                  <span className="ml-1 rounded bg-blue-100 px-1.5 py-0.5 font-bold text-[#2563EB]">
                    {selectedSurfaces.join('')}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Condition Setter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Set Condition:</span>
              {(
                [
                  'Sound',
                  'Decayed',
                  'Restored',
                  'Crown',
                  'RootCanal',
                  'Missing',
                  'Implant',
                ] as ToothCondition[]
              ).map((cond) => {
                const isCurrent = selectedData?.condition === cond
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => onUpdateCondition(selectedTooth, cond)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      isCurrent
                        ? 'bg-[#2563EB] text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 ring-1 ring-slate-200'
                    }`}
                  >
                    {cond}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Chart Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-slate-300 bg-white" /> Sound
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-rose-500" /> Decayed (Caries)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-blue-500" /> Restored / Filled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border-2 border-dashed border-amber-500 bg-amber-100" /> Crown
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-purple-500" /> Root Canal (RCT)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-cyan-400" /> Implant
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-slate-300 text-rose-600 font-bold leading-none text-center">✕</span> Missing
          </span>
        </div>
      </div>
    </div>
  )
}
