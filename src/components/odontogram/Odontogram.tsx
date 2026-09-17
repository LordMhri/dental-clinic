import { useState, useMemo } from 'react'
import {
  universalToFDI,
  getToothName,
  type ToothCondition,
  type ToothData,
} from './odontogramUtils'
import { ToothCell } from './ToothCell'

interface OdontogramProps {
  chart: Record<number, ToothData>
  selectedTooth?: number | null
  selectedTeeth?: number[]
  selectedSurfaces: string[]
  onSelectTooth: (num: number) => void
  onSelectMultipleTeeth?: (nums: number[]) => void
  onToggleSurface: (surface: string) => void
  onUpdateCondition: (toothNumbers: number[], condition: ToothCondition) => void
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
  selectedTeeth,
  selectedSurfaces,
  onSelectTooth,
  onSelectMultipleTeeth,
  onToggleSurface,
  onUpdateCondition,
  readOnly = false,
}: OdontogramProps) {
  const [notation, setNotation] = useState<'FDI' | 'Universal'>('FDI')

  const activeSelectedTeeth = useMemo(() => {
    if (selectedTeeth !== undefined) return selectedTeeth
    if (selectedTooth !== null && selectedTooth !== undefined) return [selectedTooth]
    return []
  }, [selectedTeeth, selectedTooth])

  function getDisplayNumber(univ: number): number {
    return notation === 'FDI' ? universalToFDI(univ) : univ
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      {/* Header with System Switcher & Multi-Select Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">Adult Dental Chart (Odontogram)</h2>
            {activeSelectedTeeth.length > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-[#2563EB]">
                {activeSelectedTeeth.length} selected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Click teeth to select multiple, or select surfaces (M, O, D, B, L) to chart procedures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Multi-Tooth Quick Selection Bar */}
          {!readOnly && onSelectMultipleTeeth && (
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() =>
                  onSelectMultipleTeeth(Array.from({ length: 16 }, (_, i) => i + 1))
                }
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                title="Select all upper teeth (1–16)"
              >
                Upper Arch
              </button>
              <button
                type="button"
                onClick={() =>
                  onSelectMultipleTeeth(Array.from({ length: 16 }, (_, i) => i + 17))
                }
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                title="Select all lower teeth (17–32)"
              >
                Lower Arch
              </button>
              {activeSelectedTeeth.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectMultipleTeeth([])}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 font-medium text-rose-600 hover:bg-rose-100 transition-colors"
                  title="Clear tooth selection"
                >
                  Clear ({activeSelectedTeeth.length})
                </button>
              )}
            </div>
          )}

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
              FDI (11–48)
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
                  const isSel = activeSelectedTeeth.includes(univ)
                  return (
                    <ToothCell
                      key={univ}
                      universalNumber={univ}
                      displayNumber={getDisplayNumber(univ)}
                      condition={data?.condition || 'Sound'}
                      activeSurfaces={isSel ? selectedSurfaces : []}
                      isSelected={isSel}
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
                  const isSel = activeSelectedTeeth.includes(univ)
                  return (
                    <ToothCell
                      key={univ}
                      universalNumber={univ}
                      displayNumber={getDisplayNumber(univ)}
                      condition={data?.condition || 'Sound'}
                      activeSurfaces={isSel ? selectedSurfaces : []}
                      isSelected={isSel}
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
                  const isSel = activeSelectedTeeth.includes(univ)
                  return (
                    <ToothCell
                      key={univ}
                      universalNumber={univ}
                      displayNumber={getDisplayNumber(univ)}
                      condition={data?.condition || 'Sound'}
                      activeSurfaces={isSel ? selectedSurfaces : []}
                      isSelected={isSel}
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
                  const isSel = activeSelectedTeeth.includes(univ)
                  return (
                    <ToothCell
                      key={univ}
                      universalNumber={univ}
                      displayNumber={getDisplayNumber(univ)}
                      condition={data?.condition || 'Sound'}
                      activeSurfaces={isSel ? selectedSurfaces : []}
                      isSelected={isSel}
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

      {/* Selected Teeth Multi-Tooth Controls & Batch Condition Setter */}
      {activeSelectedTeeth.length > 0 && !readOnly && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
          <div className="flex flex-col gap-3">
            {/* Top row: Selected Teeth Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100/80 pb-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">
                  {activeSelectedTeeth.length === 1
                    ? 'Selected Tooth:'
                    : `Selected Teeth (${activeSelectedTeeth.length}):`}
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {activeSelectedTeeth.map((num) => (
                    <span
                      key={num}
                      className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs font-semibold text-[#2563EB] shadow-sm ring-1 ring-blue-200"
                    >
                      <span>#{getDisplayNumber(num)}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({getToothName(num)})
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectTooth(num)}
                        className="ml-0.5 text-slate-400 hover:text-rose-600"
                        title={`Deselect tooth #${getDisplayNumber(num)}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              {onSelectMultipleTeeth && activeSelectedTeeth.length > 1 && (
                <button
                  type="button"
                  onClick={() => onSelectMultipleTeeth([])}
                  className="text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Bottom row: Surfaces and Batch Condition Setter */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
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
                          : 'bg-white text-slate-700 hover:bg-blue-100 ring-1 ring-slate-200'
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

              {/* Quick Condition Setter (Applies to all selected teeth simultaneously) */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-600">
                  {activeSelectedTeeth.length === 1
                    ? 'Set Condition:'
                    : `Set Condition (${activeSelectedTeeth.length} teeth):`}
                </span>
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
                  const isAll = activeSelectedTeeth.every((t) => chart[t]?.condition === cond)
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => onUpdateCondition(activeSelectedTeeth, cond)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                        isAll
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
