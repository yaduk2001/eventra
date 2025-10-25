'use client'

import React, { useRef } from 'react'
import { jsPDF } from 'jspdf'

export default function CertificateTemplate({ name = '', eventName = '' }) {
  const svgRef = useRef(null)
  // Note: we only provide PNG and PDF downloads (SVG download removed).

  const downloadPDF = () => {
    const svg = svgRef.current
    if (!svg) return
    const serializer = new XMLSerializer()
    const str = serializer.serializeToString(svg)
    const encoded = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str)
    const img = new Image()
    img.onload = () => {
      const width = svg.viewBox.baseVal.width || 1200
      const height = svg.viewBox.baseVal.height || 900
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      // white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      const dataURL = canvas.toDataURL('image/png')

      // Create PDF with same pixel dimensions
      try {
        const pdf = new jsPDF({ orientation: width > height ? 'landscape' : 'portrait', unit: 'px', format: [width, height] })
        pdf.addImage(dataURL, 'PNG', 0, 0, width, height)
        const safeName = (name || 'certificate').replace(/\s+/g, '_')
        pdf.save(`certificate-${safeName}.pdf`)
      } catch (err) {
        console.error('PDF generation failed', err)
        alert('Failed to generate PDF in this browser')
      }
    }
    img.onerror = () => alert('Failed to generate PDF from SVG')
    img.src = encoded
  }

  const downloadPNG = () => {
    const svg = svgRef.current
    if (!svg) return
    const serializer = new XMLSerializer()
    const str = serializer.serializeToString(svg)
    const encoded = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str)
    const img = new Image()
    img.onload = () => {
      const width = svg.viewBox.baseVal.width || 1200
      const height = svg.viewBox.baseVal.height || 900
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      // white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const safeName = (name || 'certificate').replace(/\s+/g, '_')
        a.download = `certificate-${safeName}.png`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      })
    }
    img.onerror = () => alert('Failed to generate PNG from SVG')
    img.src = encoded
  }

  // Simple styled SVG certificate template. Modify colors/fonts here as desired.
  return (
    <div className="certificate-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <svg
        ref={svgRef}
        viewBox="0 0 1200 900"
        width="600"
        height="450"
        style={{ borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="goldGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="#b8872b" />
            <stop offset="100%" stopColor="#e3c067" />
          </linearGradient>

          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.12" />
          </filter>

          <clipPath id="innerClip">
            <rect x="56" y="56" width="1088" height="788" rx="12" />
          </clipPath>
        </defs>

  {/* plain background (wavy background removed) */}
  <rect width="1200" height="900" fill="#fafafa" />

        {/* inner paper panel with soft shadow */}
        <g filter="url(#softShadow)">
          <rect x="56" y="56" width="1088" height="788" rx="12" fill="#ffffff" />
        </g>

        {/* top ornamental flourish removed */}

        {/* Title */}
        <text x="600" y="190" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="42" fill="#b8872b" style={{ letterSpacing: 6 }}>
          CERTIFICATE OF RECOGNITION
        </text>

        {/* small descriptive line */}
        <text x="600" y="230" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="16" fill="#6b6b6b">
          This certificate is hereby awarded to
        </text>

        {/* Name in script-like font */}
        <text x="600" y="320" textAnchor="middle" fontFamily="'Brush Script MT', 'Lucida Calligraphy', cursive" fontSize="64" fill="#b8872b">
          {name || 'Participant Name'}
        </text>

        {/* event/subtitle line (uses eventName if provided) */}
        <text x="600" y="360" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="18" fill="#8b6b2b" fontStyle="italic">
          {eventName || ''}
        </text>

        {/* dotted divider */}
        <line x1="200" y1="390" x2="1000" y2="390" stroke="#e3c067" strokeWidth="2" strokeDasharray="4 8" opacity="0.9" />

        {/* paragraph body - centered block */}
        <text x="600" y="450" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="16" fill="#333">
          For exemplary contributions to the event and outstanding achievement in service.
        </text>

        <text x="600" y="475" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="16" fill="#333">
          We hereby recognize and honor the recipient for their dedication and excellence in participating in:{' '}
          <tspan fontWeight="700">{eventName || 'Event Name'}</tspan>
        </text>

        {/* footer dotted signature lines */}
        <g fill="#8b6b2b" fontFamily="Georgia, 'Times New Roman', serif" fontSize="14">
          <text x="320" y="730" textAnchor="middle">DATE</text>
          <text x="880" y="730" textAnchor="middle">SIGNATURE</text>
        </g>

        <line x1="120" y1="700" x2="520" y2="700" stroke="#d6b86a" strokeWidth="2" strokeDasharray="2 6" />
        <line x1="680" y1="700" x2="1080" y2="700" stroke="#d6b86a" strokeWidth="2" strokeDasharray="2 6" />

        {/* bottom ornamental flourish */}
        <g clipPath="url(#innerClip)" transform="translate(0,24)">
          <path d="M40 760 C260 820, 540 820, 1160 760" fill="none" stroke="url(#goldGrad)" strokeWidth="4" opacity="0.95" />
        </g>
      </svg>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={downloadPNG} className="btn-primary" style={{ padding: '8px 12px' }}>
          Download PNG
        </button>
        <button type="button" onClick={downloadPDF} style={{ padding: '8px 12px' }}>
          Download PDF
        </button>
      </div>
    </div>
  )
}
