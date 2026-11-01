import React, { useMemo } from 'react';
import { generateCode39Svg } from '../utils/barcode';
import { SCHOOL_INFO } from '../types/library';

interface BarcodeCardProps {
  barcode: string;
  inventoryCode?: string;
  title?: string;
  ddcCode?: string;
  category?: string;
  author?: string;
  width?: number;
  height?: number;
  showDetails?: boolean;
}

export const BarcodeCard: React.FC<BarcodeCardProps> = ({
  barcode,
  inventoryCode,
  title,
  ddcCode,
  category,
  author,
  width = 240,
  height = 65,
  showDetails = true,
}) => {
  const svgMarkup = useMemo(() => {
    return generateCode39Svg(barcode, width, height, true);
  }, [barcode, width, height]);

  const authorInitials = author
    ? author.split(' ').map((n) => n[0]).join('').slice(0, 3).toUpperCase()
    : 'PML';

  const titleInitial = title ? title.charAt(0).toLowerCase() : 'b';

  // Library Call Number Format:
  // e.g.
  // 500
  // INA
  // i
  const callNumber = `${ddcCode || '000'}\n${authorInitials}\n${titleInitial}`;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs hover:shadow-md transition-shadow">
      {/* Label Header */}
      <div className="text-center border-b border-slate-100 pb-1.5 mb-2">
        <p className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
          {SCHOOL_INFO.libraryName}
        </p>
        <p className="text-[9px] text-slate-500 font-medium">
          {SCHOOL_INFO.name}
        </p>
      </div>

      {showDetails && (
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            {title && (
              <p className="text-xs font-semibold text-slate-900 truncate" title={title}>
                {title}
              </p>
            )}
            {category && (
              <p className="text-[10px] text-emerald-700 truncate font-medium">
                {category}
              </p>
            )}
            {inventoryCode && (
              <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                No: {inventoryCode}
              </p>
            )}
          </div>

          {/* Spine Call Number Box */}
          {ddcCode && (
            <div className="flex-shrink-0 bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-center font-mono text-[10px] leading-tight">
              <span className="font-bold text-slate-800 block">{ddcCode}</span>
              <span className="text-slate-600 block">{authorInitials}</span>
              <span className="text-slate-500 block">{titleInitial}</span>
            </div>
          )}
        </div>
      )}

      {/* SVG Barcode */}
      <div
        className="w-full flex justify-center py-1 bg-white"
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
    </div>
  );
};
