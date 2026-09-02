import React, { useState } from 'react';
import {
  Code2,
  FileCode,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  ExternalLink,
  Zap,
  HelpCircle,
  FolderDown,
  X,
} from 'lucide-react';
import { googleAppsScriptFiles, GasFile } from '../services/gasScripts';

interface GoogleAppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportCsv: (tableName: 'Leads' | 'Proposals' | 'FollowUps' | 'Users') => void;
}

export const GoogleAppsScriptModal: React.FC<GoogleAppsScriptModalProps> = ({
  isOpen,
  onClose,
  onExportCsv,
}) => {
  const [selectedFile, setSelectedFile] = useState<GasFile>(googleAppsScriptFiles[0]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = () => {
    googleAppsScriptFiles.forEach((file, index) => {
      setTimeout(() => {
        const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.filename;
        link.click();
        URL.revokeObjectURL(url);
      }, index * 200);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#168A45] text-white flex items-center justify-center font-bold shadow-xs">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Google Apps Script & Sheets Integration Codebase
              </h3>
              <p className="text-xs text-slate-500">
                Full modular script files for Casbiro Solutions (MYSAR) deployment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Sidebar files + Code preview */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#F7FAF8]">
          {/* File list sidebar */}
          <div className="w-full md:w-72 bg-white border-r border-gray-200 p-3 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Modular Script Files ({googleAppsScriptFiles.length})
              </div>
              {googleAppsScriptFiles.map((file) => {
                const isSelected = selectedFile.filename === file.filename;
                return (
                  <button
                    key={file.filename}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold border border-[#D9E5DD]'
                        : 'text-slate-700 hover:bg-[#F7FAF8]'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FileCode
                        className={`w-4 h-4 shrink-0 ${
                          file.type === 'server' ? 'text-[#168A45]' : 'text-amber-600'
                        }`}
                      />
                      <span className="truncate">{file.filename}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {file.type === 'server' ? 'GS' : 'HTML'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick CSV Exporter for Google Sheets bootstrap */}
            <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
              <div className="text-[11px] font-bold text-slate-800">
                Bootstrap Google Sheets CSVs
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => onExportCsv('Leads')}
                  className="bg-[#F7FAF8] hover:bg-[#EAF7EF] text-[#0B5D2A] border border-gray-200 hover:border-[#D9E5DD] px-2 py-1 rounded text-[11px] font-medium transition-colors"
                >
                  Leads.csv
                </button>
                <button
                  onClick={() => onExportCsv('Proposals')}
                  className="bg-[#F7FAF8] hover:bg-[#EAF7EF] text-[#0B5D2A] border border-gray-200 hover:border-[#D9E5DD] px-2 py-1 rounded text-[11px] font-medium transition-colors"
                >
                  Proposals.csv
                </button>
                <button
                  onClick={() => onExportCsv('FollowUps')}
                  className="bg-[#F7FAF8] hover:bg-[#EAF7EF] text-[#0B5D2A] border border-gray-200 hover:border-[#D9E5DD] px-2 py-1 rounded text-[11px] font-medium transition-colors"
                >
                  FollowUps.csv
                </button>
                <button
                  onClick={() => onExportCsv('Users')}
                  className="bg-[#F7FAF8] hover:bg-[#EAF7EF] text-[#0B5D2A] border border-gray-200 hover:border-[#D9E5DD] px-2 py-1 rounded text-[11px] font-medium transition-colors"
                >
                  Users.csv
                </button>
              </div>

              <button
                onClick={handleDownloadAllZip}
                className="w-full bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center space-x-1.5 shadow-2xs mt-2 transition-colors active:scale-98"
              >
                <FolderDown className="w-4 h-4" />
                <span>Download All Files</span>
              </button>
            </div>
          </div>

          {/* Right code viewer */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#1E293B] text-slate-200 font-mono">
            {/* Top file meta bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs font-sans">
              <div>
                <span className="font-bold text-white text-sm font-mono">{selectedFile.filename}</span>
                <span className="text-slate-400 text-xs ml-3 hidden sm:inline font-sans">
                  {selectedFile.description}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownloadFile}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md text-xs font-medium flex items-center space-x-1 transition-colors border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={handleCopyCode}
                  className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-3.5 py-1.5 rounded-md text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Code Block */}
            <pre className="flex-1 p-4 overflow-auto text-xs font-mono leading-relaxed select-all bg-[#0F172A] text-emerald-300">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
