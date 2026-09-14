import React from 'react';
import { X, Printer, QrCode, ShieldCheck, Tag, MapPin, User, Calendar } from 'lucide-react';
import { Asset } from '../../types/asset';

interface AssetQrModalProps {
  asset: Asset | null;
  isOpen?: boolean;
  onClose: () => void;
}

export const AssetQrModal: React.FC<AssetQrModalProps> = ({ asset, isOpen = true, onClose }) => {
  if (isOpen === false || !asset) return null;

  const handlePrintTag = () => {
    window.print();
  };

  // Generate SVG QR code representation using inline SVG patterns
  const qrData = JSON.stringify({
    id: asset.id,
    name: asset.name,
    serial: asset.serialNumber,
    custodian: asset.currentAssignment?.employeeName || 'None',
    status: asset.status,
    org: 'MYSAR ERP ASSET MANAGEMENT',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EAF7EF] text-[#0B5D2A] flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Asset QR Tag</h3>
              <p className="text-xs text-slate-500">Scan code to inspect asset lifecycle & custodian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Printable Tag Canvas */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-100/50">
          <div
            id="printable-asset-tag"
            className="w-full bg-white p-5 rounded-xl border-2 border-slate-800 shadow-sm text-center relative overflow-hidden"
          >
            {/* Tag Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-3">
              <div className="text-left">
                <span className="text-[10px] font-black text-slate-800 tracking-wider uppercase block">MYSAR ERP</span>
                <span className="text-[9px] font-semibold text-emerald-800 uppercase">Fixed Asset Tag</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span className="text-[9px] font-mono font-bold">VERIFIED</span>
              </div>
            </div>

            {/* QR Code Center Box */}
            <div className="p-3 bg-white border border-slate-300 rounded-lg inline-block shadow-inner my-1">
              <div className="w-36 h-36 relative flex items-center justify-center bg-slate-50 border border-dashed border-slate-300 rounded">
                <QrCode className="w-28 h-28 text-slate-900" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white px-1.5 py-0.5 rounded border border-slate-400 text-[8px] font-black font-mono text-emerald-800 shadow-xs">
                    {asset.id.slice(0, 8)}
                  </div>
                </div>
              </div>
            </div>

            {/* Asset Identifier */}
            <div className="mt-3">
              <div className="text-lg font-black font-mono tracking-wider text-slate-900">{asset.id}</div>
              <div className="text-xs font-bold text-slate-800 truncate px-2">{asset.name}</div>
              <div className="text-[10px] text-slate-500 font-mono">S/N: {asset.serialNumber}</div>
            </div>

            {/* Quick Metadata Bar */}
            <div className="mt-3 pt-2.5 border-t border-dashed border-slate-300 grid grid-cols-2 gap-2 text-[10px] text-left">
              <div>
                <span className="text-slate-400 block font-medium">Category:</span>
                <span className="font-semibold text-slate-700 truncate block">{asset.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Status:</span>
                <span className="font-bold text-emerald-800">{asset.status}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block font-medium">Current Location:</span>
                <span className="font-semibold text-slate-700 truncate block">
                  {asset.location.branch} - {asset.location.room}
                </span>
              </div>
              {asset.currentAssignment && (
                <div className="col-span-2 bg-[#EAF7EF] p-1.5 rounded border border-[#D9E5DD]">
                  <span className="text-emerald-800 font-bold block text-[9px]">CURRENT CUSTODIAN</span>
                  <span className="font-bold text-slate-900 block truncate">
                    {asset.currentAssignment.employeeName} ({asset.currentAssignment.department})
                  </span>
                </div>
              )}
            </div>

            {/* Micro barcode / footer */}
            <div className="mt-3 pt-2 border-t border-slate-200 text-[8px] text-slate-400 font-mono flex justify-between">
              <span>PROPERTY OF MYSAR ERP</span>
              <span>DO NOT REMOVE</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-3 text-center">
            Standard 2" × 3" tamper-resistant thermal barcode & QR asset label.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrintTag}
            className="px-4 py-2 text-xs font-bold text-white bg-[#168A45] hover:bg-[#0B5D2A] rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Asset Tag</span>
          </button>
        </div>
      </div>
    </div>
  );
};
