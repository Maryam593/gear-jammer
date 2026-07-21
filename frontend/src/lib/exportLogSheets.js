import { jsPDF } from 'jspdf'
import { categoricalColors, LOG_STATUS_COLOR_KEY } from '../theme/vizColors'

// Drawn straight from data with jsPDF's vector API — not a screenshot of the
// DOM. Two reasons: (1) the on-screen card's header/legend/recap live outside
// the <svg> element, so rasterizing just the SVG silently dropped them; (2)
// screenshotting would also capture whatever theme (light/dark) happens to be
// active on screen, and dark-mode text is light gray — unreadable once pasted
// onto a plain white PDF page. Drawing directly sidesteps both: the PDF always
// gets the full content, in fixed colors chosen to be readable on white.

const ROWS = [
  { key: 'off_duty', label: '1. Off Duty' },
  { key: 'sleeper', label: '2. Sleeper Berth' },
  { key: 'driving', label: '3. Driving' },
  { key: 'on_duty', label: '4. On Duty (not driving)' },
]

const INK = [30, 41, 59] // slate-800
const MUTED = [100, 116, 139] // slate-500
const LABEL = [51, 65, 85] // slate-700
const GRID_LINE = [148, 163, 184] // slate-400
const BORDER = [251, 146, 60] // orange-400

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function hourLabel(h) {
  if (h === 0 || h === 24) return 'Mid'
  if (h === 12) return 'Noon'
  return h > 12 ? String(h - 12) : String(h)
}

function formatHours(h) {
  if (h == null) return '—'
  return h % 1 === 0 ? `${h}` : h.toFixed(2)
}

function totalsByStatus(segments) {
  const totals = { off_duty: 0, sleeper: 0, driving: 0, on_duty: 0 }
  segments.forEach((seg) => {
    totals[seg.status] = (totals[seg.status] || 0) + (seg.end_hour - seg.start_hour)
  })
  return totals
}

function drawDaySheet(pdf, { date_offset: dayIndex, segments, recap }, { tripMeta, driverName, pageWidth, margin }) {
  const colors = categoricalColors(false) // always light-mode hex — this is a white page
  const availW = pageWidth - margin * 2

  const date = new Date()
  date.setDate(date.getDate() + dayIndex)

  let y = margin

  pdf.setFont(undefined, 'bold')
  pdf.setFontSize(14)
  pdf.setTextColor(...INK)
  pdf.text("Driver's Daily Log (24 hours)", margin, y)

  pdf.setFont(undefined, 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(...MUTED)
  pdf.text(
    `${date.toLocaleDateString(undefined, { month: 'short' })} / ${date.getDate()} / ${date.getFullYear()} · Day ${dayIndex + 1}`,
    margin,
    y + 14,
  )

  const rightX = margin + availW
  pdf.setFontSize(9)
  pdf.setTextColor(...LABEL)
  pdf.text(`Driver: ${driverName?.trim() || '—'}`, rightX, y - 6, { align: 'right' })
  if (tripMeta) {
    pdf.text(`From: ${tripMeta.currentLocation}   To: ${tripMeta.dropoffLocation}`, rightX, y + 6, { align: 'right' })
  }
  pdf.text(
    `Total miles driving today: ${recap.miles_driven_today != null ? `${recap.miles_driven_today} mi` : '—'}`,
    rightX,
    y + 18,
    { align: 'right' },
  )

  y += 30
  pdf.setDrawColor(...BORDER)
  pdf.setLineWidth(1.5)
  pdf.line(margin, y, margin + availW, y)

  // Legend
  y += 16
  let lx = margin
  ROWS.forEach((row) => {
    const [r, g, b] = hexToRgb(colors[LOG_STATUS_COLOR_KEY[row.key]])
    pdf.setFillColor(r, g, b)
    pdf.rect(lx, y - 6, 7, 7, 'F')
    pdf.setFont(undefined, 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(...LABEL)
    pdf.text(row.label, lx + 10, y)
    lx += 10 + pdf.getTextWidth(row.label) + 18
  })

  // Grid
  const gridTop = y + 16
  const labelColW = 105
  const totalsColW = 42
  const gridW = availW - labelColW - totalsColW
  const hourColW = gridW / 24
  const rowH = 26
  const gridH = rowH * 4
  const headerRowH = 13
  const gridX = margin + labelColW
  const gridY = gridTop + headerRowH

  const xForHour = (h) => gridX + h * hourColW
  const yForRow = (i) => gridY + i * rowH + rowH / 2
  const rowIndexForStatus = (status) => Math.max(0, ROWS.findIndex((r) => r.key === status))

  pdf.setFont(undefined, 'normal')
  pdf.setFontSize(6.5)
  pdf.setTextColor(...MUTED)
  for (let h = 0; h <= 24; h++) {
    pdf.text(hourLabel(h), xForHour(h), gridTop + headerRowH - 3, { align: 'center' })
  }
  pdf.text('Total', gridX + gridW + totalsColW / 2, gridTop + headerRowH - 3, { align: 'center' })

  pdf.setDrawColor(...GRID_LINE)
  pdf.setLineWidth(0.75)
  pdf.rect(gridX, gridY, gridW, gridH, 'S')
  for (let h = 0; h <= 24; h++) {
    pdf.setLineWidth(h % 1 === 0 ? 0.5 : 0.25)
    pdf.line(xForHour(h), gridY, xForHour(h), gridY + gridH)
  }

  const totals = totalsByStatus(segments)
  pdf.setFontSize(8)
  ROWS.forEach((row, i) => {
    const rowY = gridY + i * rowH
    pdf.setDrawColor(...GRID_LINE)
    pdf.setLineWidth(0.4)
    pdf.line(gridX, rowY, gridX + gridW, rowY)
    pdf.setTextColor(...LABEL)
    pdf.text(row.label, margin, yForRow(i) + 3)
    pdf.text(formatHours(totals[row.key]), gridX + gridW + totalsColW / 2, yForRow(i) + 3, { align: 'center' })
  })

  // Duty-status trace
  segments.forEach((seg, i) => {
    const rowY = yForRow(rowIndexForStatus(seg.status))
    const [r, g, b] = hexToRgb(colors[LOG_STATUS_COLOR_KEY[seg.status]] || '#1e293b')
    pdf.setDrawColor(r, g, b)
    pdf.setLineWidth(2.4)
    pdf.line(xForHour(seg.start_hour), rowY, xForHour(seg.end_hour), rowY)

    const next = segments[i + 1]
    if (next) {
      pdf.setDrawColor(...GRID_LINE)
      pdf.setLineWidth(0.8)
      pdf.line(xForHour(seg.end_hour), rowY, xForHour(next.start_hour), yForRow(rowIndexForStatus(next.status)))
    }
  })

  // Recap box
  const recapY = gridY + gridH + 16
  const recapH = 56
  pdf.setDrawColor(...BORDER)
  pdf.setLineWidth(1)
  pdf.rect(margin, recapY, availW, recapH, 'S')

  pdf.setFont(undefined, 'bold')
  pdf.setFontSize(7.5)
  pdf.setTextColor(...MUTED)
  pdf.text('RECAP — 70-HOUR / 8-DAY RULE', margin + 10, recapY + 14)

  const hoursAvailableTomorrow = recap.cycle_hours_used != null ? Math.max(0, 70 - recap.cycle_hours_used) : null
  const stats = [
    ['On-duty today', `${formatHours(recap.on_duty_hours_today)}h`],
    ['Driving today', `${formatHours(recap.driving_hours_today)}h`],
    ['A. On-duty last 8 days', `${formatHours(recap.cycle_hours_used)}h`],
    ['B. Available tomorrow (70 - A)', hoursAvailableTomorrow != null ? `${hoursAvailableTomorrow.toFixed(2)}h` : '—'],
  ]
  const statColW = availW / stats.length
  stats.forEach(([label, value], i) => {
    const sx = margin + 10 + i * statColW
    pdf.setFont(undefined, 'normal')
    pdf.setFontSize(7.5)
    pdf.setTextColor(...MUTED)
    pdf.text(label, sx, recapY + 28)
    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(...INK)
    pdf.text(value, sx, recapY + 42)
  })

  pdf.setFont(undefined, 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(...MUTED)
  pdf.text('If you took 34 consecutive hours off duty, you have 70 hours available.', margin + 10, recapY + recapH - 5)
}

/**
 * Builds a multi-page PDF (one page per day) directly from the trip's
 * daily_logs data — no DOM/screenshot involved, see note above.
 */
export async function exportLogSheetsPDF({ daily_logs, tripMeta, driverName }) {
  if (!daily_logs?.length) return

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 36

  daily_logs.forEach((day, i) => {
    if (i > 0) pdf.addPage()
    drawDaySheet(pdf, day, { tripMeta, driverName, pageWidth, margin })
  })

  const stamp = new Date().toISOString().slice(0, 10)
  pdf.save(`eld-daily-logs-${stamp}.pdf`)
}
