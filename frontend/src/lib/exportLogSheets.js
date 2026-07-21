import { jsPDF } from 'jspdf'

const EXPORT_SCALE = 2

// currentColor on the SVG's grid lines/text only resolves via the page's
// Tailwind stylesheet, which isn't present once the SVG is serialized to a
// standalone data URI. Resolve it from the live element and bake it into an
// explicit inline style on the clone so the rasterized PNG matches what's on
// screen regardless of light/dark mode.
async function svgToPngDataUrl(svgEl) {
  const computedColor = getComputedStyle(svgEl).color || '#1e293b'
  const clone = svgEl.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.style.color = computedColor

  const viewBox = svgEl.viewBox.baseVal
  const width = viewBox && viewBox.width ? viewBox.width : svgEl.clientWidth
  const height = viewBox && viewBox.height ? viewBox.height : svgEl.clientHeight

  const xml = new XMLSerializer().serializeToString(clone)
  const svg64 = btoa(unescape(encodeURIComponent(xml)))
  const imgSrc = `data:image/svg+xml;base64,${svg64}`

  const dataUrl = await new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * EXPORT_SCALE
      canvas.height = height * EXPORT_SCALE
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(EXPORT_SCALE, EXPORT_SCALE)
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('Could not rasterize log sheet SVG'))
    img.src = imgSrc
  })

  return { dataUrl, width, height }
}

/**
 * Renders every [data-log-sheet-svg] SVG inside `containerEl` (in DOM order,
 * one per day) into a downloadable multi-page PDF, one day per page.
 */
export async function exportLogSheetsPDF(containerEl, tripMeta) {
  if (!containerEl) return
  const svgEls = Array.from(containerEl.querySelectorAll('[data-log-sheet-svg]'))
  if (svgEls.length === 0) return

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 28
  const headerHeight = 34

  for (let i = 0; i < svgEls.length; i++) {
    const svgEl = svgEls[i]
    const dayIndex = Number(svgEl.dataset.logSheetSvg)
    const { dataUrl, width, height } = await svgToPngDataUrl(svgEl)

    if (i > 0) pdf.addPage()

    pdf.setFontSize(13)
    pdf.setTextColor(30, 41, 59)
    pdf.text(`Driver's Daily Log — Day ${dayIndex + 1}`, margin, margin)

    if (tripMeta) {
      pdf.setFontSize(9)
      pdf.setTextColor(100, 116, 139)
      const route = [tripMeta.currentLocation, tripMeta.pickupLocation, tripMeta.dropoffLocation]
        .filter(Boolean)
        .join('   →   ')
      pdf.text(route, margin, margin + 16)
    }

    const availW = pageWidth - margin * 2
    const availH = pageHeight - margin * 2 - headerHeight
    const ratio = Math.min(availW / width, availH / height)

    pdf.addImage(dataUrl, 'PNG', margin, margin + headerHeight, width * ratio, height * ratio)
  }

  const stamp = new Date().toISOString().slice(0, 10)
  pdf.save(`eld-daily-logs-${stamp}.pdf`)
}
