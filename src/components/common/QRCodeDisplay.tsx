import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, QrCode as QrIcon } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  label?: string;
  sublabel?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  label,
  sublabel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 1,
          color: {
            dark: '#0F172A',
            light: '#FFFFFF',
          },
        },
        (err) => {
          if (err) console.error('Error rendering QR code', err);
        }
      );
    }
  }, [value, size]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white border border-slate-200 rounded-xl max-w-sm mx-auto text-center">
      <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg shadow-inner mb-4">
        <canvas ref={canvasRef} className="block mx-auto rounded" />
      </div>

      {label && <h4 className="text-sm font-semibold text-slate-900 mb-1">{label}</h4>}
      {sublabel && <p className="text-xs text-slate-500 mb-4">{sublabel}</p>}

      <div className="w-full flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
        <span className="text-xs font-mono text-slate-600 truncate text-left flex-1 select-all">
          {value}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded hover:bg-slate-100 transition-colors shrink-0"
          title="Copy payload"
          aria-label="Copy QR code payload"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};
