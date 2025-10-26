"use client";

import { useRef, useState, useEffect } from "react";

// Improved ID Card generator: file-only image input, live preview, PNG + PDF download
export default function IDCardGenerator({ defaultName = "", defaultEvent = "" }) {
  const canvasRef = useRef(null);
  const [name, setName] = useState(defaultName);
  const [eventName, setEventName] = useState(defaultEvent);
  const [filePreview, setFilePreview] = useState(null);
  const [objectUrl, setObjectUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [headerColor, setHeaderColor] = useState('#2563eb');
  const [cardBg, setCardBg] = useState('#ffffff');
  const [scale, setScale] = useState(1);
  const [imageObj, setImageObj] = useState(null);
  const [imgScale, setImgScale] = useState(1.2);
  const [imgPos, setImgPos] = useState({ x: 0.5, y: 0.5 }); // center
  const cropPreviewRef = useRef(null);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  // Draw card whenever inputs change
  useEffect(() => {
    drawCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, eventName, filePreview, headerColor, cardBg, scale, imageObj, imgScale, imgPos]);

  // Revoke object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const drawCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use DPR for sharpness
    const dpr = window.devicePixelRatio || 1;
  const w = 600;
  const h = 360;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  // Make the canvas responsive in the preview: set CSS width to 100% of its container
  // The actual drawing uses device pixels (canvas.width/height) for sharpness.
  canvas.style.width = '100%';
  canvas.style.height = 'auto';
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.clearRect(0, 0, w, h);

  // Card background (configurable) and subtle border
  ctx.fillStyle = cardBg || "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#e6e9ef";
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, w - 16, h - 16);

  // Header bar (customizable color)
  ctx.fillStyle = headerColor || '#2563eb';
    ctx.fillRect(0, 0, w, 72);

    // Header text (event)
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 20px Inter, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(eventName || "Event Name", 24, 36);

    // Profile image placeholder circle on left
    const imgSize = 120;
    const imgX = 36;
    const imgY = 110;
    ctx.fillStyle = "#f3f4f6"; // neutral placeholder
    ctx.beginPath();
    ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw uploaded image if present using crop/zoom/position settings
    const img = imageObj;
    if (img) {
      // compute source crop based on imgScale and imgPos (center-based)
      const sw = Math.max(1, Math.round(img.width / imgScale));
      const sh = Math.max(1, Math.round(img.height / imgScale));
      let sx = Math.round(imgPos.x * img.width - sw / 2);
      let sy = Math.round(imgPos.y * img.height - sh / 2);
      sx = Math.max(0, Math.min(sx, img.width - sw));
      sy = Math.max(0, Math.min(sy, img.height - sh));

      // draw clipped circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      // draw portion of source into destination
      try {
        ctx.drawImage(img, sx, sy, sw, sh, imgX, imgY, imgSize, imgSize);
      } catch (e) {
        // fallback: draw whole image fitted
        const ratio = Math.max(imgSize / img.width, imgSize / img.height);
        const ssw = imgSize / ratio;
        const ssh = imgSize / ratio;
        const ssx = (img.width - ssw) / 2;
        const ssy = (img.height - ssh) / 2;
        ctx.drawImage(img, ssx, ssy, ssw, ssh, imgX, imgY, imgSize, imgSize);
      }
      ctx.restore();
    }

    // Helper: wrap text into lines within maxWidth
    const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
      const words = String(text).split(' ');
      let line = '';
      let curY = y;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + (line ? ' ' : '') + words[n];
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && line) {
          context.fillText(line, x, curY);
          line = words[n];
          curY += lineHeight;
        } else {
          line = testLine;
        }
      }
      if (line) context.fillText(line, x, curY);
      return curY;
    };

    // Text content on the right — ensure it doesn't overflow
    ctx.fillStyle = "#0f172a"; // slate-900
    // Start with base font size and reduce if too long
    let nameFontSize = 28;
    ctx.font = `700 ${nameFontSize}px Inter, system-ui, sans-serif`;
    const nameX = imgX + imgSize + 28;
    const maxNameWidth = w - nameX - 36; // right padding
    // If single-line too long, reduce font size until it fits or reach minimum, else wrap
    let nameWidth = ctx.measureText(name || 'Participant Name').width;
    while (nameWidth > maxNameWidth && nameFontSize > 14) {
      nameFontSize -= 2;
      ctx.font = `700 ${nameFontSize}px Inter, system-ui, sans-serif`;
      nameWidth = ctx.measureText(name || 'Participant Name').width;
    }
    // If still too long, wrap into multiple lines
    const nameLineHeight = Math.round(nameFontSize * 1.2);
    ctx.font = `700 ${nameFontSize}px Inter, system-ui, sans-serif`;
    wrapText(ctx, name || 'Participant Name', nameX, imgY + 36, maxNameWidth, nameLineHeight);

    ctx.fillStyle = "#374151"; // slate-600
    ctx.font = "600 14px Inter, system-ui, sans-serif";
    // Role placed below name lines. Approximate position: start at imgY+36 then add lineHeight*lines
    // Compute number of name lines by re-wrapping to count lines
    const countLines = (context, text, maxWidth) => {
      const words = String(text).split(' ');
      let line = '';
      let lines = 0;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + (line ? ' ' : '') + words[n];
        if (context.measureText(testLine).width > maxWidth && line) {
          lines += 1;
          line = words[n];
        } else {
          line = testLine;
        }
      }
      if (line) lines += 1;
      return lines;
    };
    ctx.font = `700 ${nameFontSize}px Inter, system-ui, sans-serif`;
    const nameLines = countLines(ctx, name || 'Participant Name', maxNameWidth);
    const roleY = imgY + 36 + (nameLines * nameLineHeight) + 8;
    ctx.font = "600 14px Inter, system-ui, sans-serif";
    ctx.fillText("Role: Guest", nameX, roleY);

    // small divider
    ctx.strokeStyle = "#e6e9ef";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(imgX + imgSize + 24, imgY + imgSize - 8);
    ctx.lineTo(w - 36, imgY + imgSize - 8);
    ctx.stroke();

    // Footer small note
    ctx.fillStyle = "#6b7280";
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillText("Generated by Eventrra", 24, h - 28);
  };

  const handleFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const url = URL.createObjectURL(f);
    setObjectUrl(url);
    setFilePreview(url);
    setFileName(f.name || '');
    // create Image object for cropping
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      // reset crop to center
      setImgScale(1.2);
      setImgPos({ x: 0.5, y: 0.5 });
    };
    img.onerror = () => {
      setImageObj(null);
    };
    img.src = url;
  };

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${(name || "id-card").replace(/\s+/g, "_")}.png`;
    // Use toDataURL on the styled canvas
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Dynamically load jsPDF UMD and return when ready
  const loadJsPDF = () => {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-src="jspdf"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.jspdf?.jsPDF));
        existing.addEventListener('error', () => reject(new Error('Failed to load jsPDF')));
        return;
      }
      const s = document.createElement('script');
      s.setAttribute('data-src', 'jspdf');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = () => {
        resolve(window.jspdf?.jsPDF);
      };
      s.onerror = () => reject(new Error('Failed to load jsPDF'));
      document.body.appendChild(s);
    });
  };

  const downloadPDF = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
  const jsPDFCtor = await loadJsPDF();
  if (!jsPDFCtor) throw new Error('jsPDF not available');
  const dataUrl = canvas.toDataURL('image/png');
  // Compute CSS pixel dimensions (canvas width/height are device pixels)
  const dpr = window.devicePixelRatio || 1;
  const widthPx = Math.round(canvas.width / dpr);
  const heightPx = Math.round(canvas.height / dpr);
  // Convert px -> points (1pt = 1/72in). Assume 96 DPI for CSS px -> in conversion.
  const pxToPt = (px) => (px * 72) / 96;
  const widthPt = Math.round(pxToPt(widthPx));
  const heightPt = Math.round(pxToPt(heightPx));
  // Create PDF sized to the CSS pixel size in points so the rendered PDF matches the on-screen image
  // Request landscape orientation explicitly
  const pdf = new jsPDFCtor({ orientation: 'landscape', unit: 'pt', format: [widthPt, heightPt] });
  // If jsPDF rotates canvas on landscape, ensure we still add the image filling the page
  pdf.addImage(dataUrl, 'PNG', 0, 0, widthPt, heightPt);
  pdf.save(`${(name || 'id-card').replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error('PDF download failed', e);
      // Fallback: open image in new tab so user can print to PDF
      const url = canvas.toDataURL('image/png');
      const w = window.open('about:blank');
      if (w) {
        w.document.write(`<img src="${url}" style="max-width:100%;height:auto">`);
        w.document.close();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="md:flex md:items-start md:gap-8">
        <div className="md:flex-1 pr-0 md:pr-8">
          {/* Left: Inputs + Pro tips */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-amber-400 text-white rounded-full p-2 shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2v6M5 8h14M7 12h10M9 16h6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Create ID Card</h3>
            </div>

            <div className="bg-white border rounded-md p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-2 px-3 py-2 border rounded-md bg-white text-slate-900 placeholder-slate-400"
              placeholder="Participant name"
            />

            <label className="block text-sm font-semibold text-slate-700 mt-4">Event</label>
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full mt-2 px-3 py-2 border rounded-md bg-white text-slate-900 placeholder-slate-400"
              placeholder="Event title"
            />

            <div className="mt-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Upload image</label>
              <div className="flex items-center gap-3">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v8M8 8l4-4 4 4" />
                  </svg>
                  Choose image
                </button>
                <span className="text-sm text-slate-900">{fileName || 'No file selected'}</span>
              </div>
            </div>

            {/* Crop controls and preview */}
            <div className="mt-3 bg-white border rounded-md p-3">
              <h5 className="text-sm font-semibold text-slate-700 mb-2">Profile crop</h5>
              <div
                ref={cropPreviewRef}
                className="w-40 h-40 bg-slate-100 rounded-md overflow-hidden touch-none relative cursor-grab"
                style={imageObj ? { backgroundImage: `url(${objectUrl})`, backgroundSize: `${imgScale * 100}%`, backgroundPosition: `${imgPos.x * 100}% ${imgPos.y * 100}%`, backgroundRepeat: 'no-repeat' } : { display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onPointerDown={(e) => {
                  if (!imageObj) return;
                  const el = cropPreviewRef.current;
                  draggingRef.current = true;
                  lastPointerRef.current = { x: e.clientX, y: e.clientY };
                  el.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (!draggingRef.current || !imageObj) return;
                  const el = cropPreviewRef.current;
                  const rect = el.getBoundingClientRect();
                  const dx = e.clientX - lastPointerRef.current.x;
                  const dy = e.clientY - lastPointerRef.current.y;
                  lastPointerRef.current = { x: e.clientX, y: e.clientY };
                  // convert pixel delta to percentage of container
                  const nx = imgPos.x + dx / rect.width;
                  const ny = imgPos.y + dy / rect.height;
                  setImgPos({ x: Math.max(0, Math.min(1, nx)), y: Math.max(0, Math.min(1, ny)) });
                }}
                onPointerUp={(e) => {
                  if (!imageObj) return;
                  draggingRef.current = false;
                  const el = cropPreviewRef.current;
                  try { el.releasePointerCapture(e.pointerId); } catch (_) {}
                }}
              >
                {!imageObj && <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">No image</div>}
              </div>

              <div className="mt-3">
                <label className="text-xs text-slate-600">Zoom</label>
                <input type="range" min="1" max="3" step="0.05" value={imgScale} onChange={(e) => setImgScale(parseFloat(e.target.value))} className="w-full mt-1" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" onClick={drawCard} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
                </svg>
                Render
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <h4 className="text-sm font-semibold text-amber-700 flex items-center gap-2"> 
                <svg className="w-4 h-4 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
                </svg>
                Pro Tips
              </h4>
              <ul className="mt-3 text-sm text-amber-800 list-disc list-inside space-y-2">
                <li>Use a square or portrait photo for best crop inside the profile circle.</li>
                <li>Keep the participant name short (2–4 words) for best appearance.</li>
                <li>Use contrasting header color for readability — white text works well on dark headers.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider between left and right boxes */}
        <div className="hidden md:flex items-stretch">
          <div className="w-px bg-slate-200" style={{ width: '1px' }} />
        </div>

        {/* Right: Preview + design & download controls */}
        <div className="md:flex-1 pl-0 md:pl-6">
        <div className="space-y-4">
          <div className="bg-white border rounded-md p-4 flex flex-col items-center">
            <div className="w-full flex justify-center">
              {/* Preview container: limit max width to canvas width and allow scaling */}
              <div className="shadow-lg rounded-md overflow-hidden bg-white" style={{ width: '100%', maxWidth: `${Math.round(600 * scale)}px` }}>
                <canvas ref={canvasRef} />
              </div>
            </div>

            <div className="w-full mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-xs text-slate-600">Header color</label>
                <input type="color" value={headerColor} onChange={(e) => setHeaderColor(e.target.value)} className="mt-2 h-8 w-12 p-0 border-0" />
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-slate-600">Card background</label>
                <input type="color" value={cardBg} onChange={(e) => setCardBg(e.target.value)} className="mt-2 h-8 w-12 p-0 border-0" />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3">
                <label className="text-xs text-slate-600">Preview scale</label>
                <input type="range" min="0.5" max="1.2" step="0.05" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} />
                <span className="text-xs text-slate-500">{Math.round(scale * 100)}%</span>
              </div>
              </div>
          </div>

          <div className="bg-white border rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">Download or export your ID card</div>
              <div className="flex gap-3 mt-0">
                <button
                  type="button"
                  onClick={downloadPNG}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={downloadPDF}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
