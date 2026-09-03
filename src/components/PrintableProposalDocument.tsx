import React from 'react';
import { Proposal, Settings } from '../types';
import { formatINR } from '../utils/pdfGenerator';
import { getEffectiveProposalContent, DEFAULT_PROPOSAL_CONTENT } from '../utils/defaultProposalContent';

interface PrintableProposalDocumentProps {
  proposal: Proposal;
  settings?: Settings;
  id?: string;
  showPageBadges?: boolean;
}

// Decorative SVG Wave Curve for Page Top-Right
const TopRightWaves = () => (
  <svg
    className="absolute top-0 right-0 w-48 h-36 pointer-events-none"
    viewBox="0 0 240 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M240 0C180 30 150 90 200 140C220 160 240 170 240 180"
      stroke="#168A45"
      strokeWidth="1.2"
      strokeOpacity="0.35"
    />
    <path
      d="M240 15C170 45 140 100 190 150C210 170 230 175 240 180"
      stroke="#168A45"
      strokeWidth="1.2"
      strokeOpacity="0.45"
    />
    <path
      d="M240 30C160 60 130 110 180 160C200 175 220 180 240 180"
      stroke="#168A45"
      strokeWidth="1.2"
      strokeOpacity="0.55"
    />
    <path
      d="M240 45C150 75 120 120 170 170C190 180 210 180 240 180"
      stroke="#168A45"
      strokeWidth="1.4"
      strokeOpacity="0.7"
    />
    <path
      d="M240 60C140 90 110 130 160 180"
      stroke="#168A45"
      strokeWidth="1.5"
      strokeOpacity="0.85"
    />
    <path
      d="M240 75C130 105 100 140 150 180"
      stroke="#0B5D2A"
      strokeWidth="1.5"
      strokeOpacity="0.9"
    />
    <path
      d="M240 90C120 120 90 150 140 180"
      stroke="#0B5D2A"
      strokeWidth="1.5"
    />
  </svg>
);

// MYSAR Brand Logo Header
const MysarLogo: React.FC<{ companyLogo?: string; brandName?: string }> = ({ companyLogo, brandName }) => {
  if (companyLogo) {
    return (
      <div className="flex items-center gap-2.5">
        <img
          src={companyLogo}
          alt={brandName || 'Company Logo'}
          className="h-9 max-w-[150px] object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-full bg-[#168A45] flex items-center justify-center text-white shadow-2xs">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
      </div>
      <span className="text-xl font-black text-[#168A45] tracking-tight lowercase">
        {brandName || 'mysar'}
      </span>
    </div>
  );
};

// Bottom Page Bar across all document pages
const PageFooter: React.FC<{ pageNumber: number; companyName?: string }> = ({ pageNumber, companyName }) => (
  <div className="w-full mt-auto">
    <div className="h-8 bg-[#168A45] flex items-center justify-between px-10 text-white text-[10px] select-none">
      <span className="font-semibold tracking-wider uppercase">
        MYSAR • {companyName ? companyName.toUpperCase() : 'CASBIRO SOLUTIONS PRIVATE LIMITED'}
      </span>
      <span className="font-bold tracking-widest uppercase">PAGE {pageNumber}</span>
    </div>
  </div>
);

export const PrintableProposalDocument: React.FC<PrintableProposalDocumentProps> = ({
  proposal,
  settings,
  id = 'mysar-proposal-printable-document',
  showPageBadges = true,
}) => {
  const companyLogo = settings?.companyLogo;
  const brandName = settings?.brandName || 'MYSAR';
  const companyName = settings?.companyName || 'Casbiro Solutions Private Limited';
  const content = getEffectiveProposalContent(settings);

  // Filter live modules
  const liveModules = content.modules.filter((m) => m.isLive);
  const part1Modules = liveModules.slice(0, 4);
  const part2Modules = liveModules.slice(4, 9);
  const part3Modules = liveModules.slice(9);

  // Reports
  const reportCatsPart1 = content.reportCategories.slice(0, 3);
  const reportCatsPart2 = content.reportCategories.slice(3);

  // Services
  const servicesPart1 = content.services.slice(0, 4);
  const servicesPart2 = content.services.slice(4);

  const formatDDMMYYYY = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formattedProposalDate =
    formatDDMMYYYY(proposal.proposalDate) ||
    proposal.proposalDate ||
    '';
  const currentProposalNo = proposal.proposalNumber || proposal.id || '';

  const replacePlaceholders = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\{\{INSTITUTE_NAME\}\}/g, proposal.instituteName || 'the Institution')
      .replace(/\{\{PROPOSAL_NUMBER\}\}/g, currentProposalNo)
      .replace(/\[PROPOSAL NO\.\]/gi, currentProposalNo || '[PROPOSAL NO.]')
      .replace(/\{\{PROPOSAL_DATE\}\}/g, formattedProposalDate)
      .replace(/\[DD\/MM\/YYYY\]/gi, formattedProposalDate || '[DD/MM/YYYY]')
      .replace(/\{\{STUDENT_COUNT\}\}/g, String(proposal.studentCount || 0))
      .replace(/\{\{COMPANY_NAME\}\}/g, companyName)
      .replace(/\{\{BRAND_NAME\}\}/g, brandName);
  };

  // Multi-tier alternative packages for commercial table
  const pricingItemsToDisplay = (() => {
    if (proposal.pricingItems && proposal.pricingItems.length > 1) {
      return proposal.pricingItems;
    }
    if (proposal.pricingItems && proposal.pricingItems.length === 1) {
      const primary = proposal.pricingItems[0];
      if (primary.pricingType === 'School Premium with ID') {
        return [
          primary,
          {
            id: 'plan-secondary-1',
            pricingType: 'School Premium',
            description: 'Complete School ERP + Student & Staff Mobile Apps + Attendance + Fees + Academic Reports',
            pricePerStudent: 100,
            studentCount: proposal.studentCount || 920,
            totalAmount: 100 * (proposal.studentCount || 920),
            isPrimary: false,
          },
        ];
      }
      return proposal.pricingItems;
    }
    return [
      {
        id: 'plan-default-1',
        pricingType: proposal.pricingType || 'School Premium with ID',
        description: 'School ERP + Smart RFID/NFC Student Cards & Instant Gate Synchronization',
        pricePerStudent: proposal.pricePerStudent || 150,
        studentCount: proposal.studentCount || 920,
        totalAmount: proposal.totalAmount || (proposal.pricePerStudent || 150) * (proposal.studentCount || 920),
        isPrimary: true,
      },
      {
        id: 'plan-default-2',
        pricingType: 'School Premium',
        description: 'Complete School ERP + Student & Staff Mobile Apps + Attendance + Fees + Academic Reports',
        pricePerStudent: 100,
        studentCount: proposal.studentCount || 920,
        totalAmount: 100 * (proposal.studentCount || 920),
        isPrimary: false,
      },
    ];
  })();

  const pageNames = [
    'Cover Page',
    'Table of Contents',
    '1. About Company',
    '2. About MYSAR',
    '3. Modules in MYSAR (Part 1)',
    '3. Modules in MYSAR (Part 2)',
    '3. Modules in MYSAR (Part 3)',
    '4. Reports in MYSAR (Part 1)',
    '4. Reports in MYSAR (Part 2)',
    '5. Services from Team MYSAR (Part 1)',
    '5. Services from Team MYSAR (Part 2)',
    '6. Pricing & Commercial Options',
    '7. Contact Information',
    '8. Conclusion',
    '9. Proposal Acceptance & Signatories',
  ];

  const renderPageBadge = (pageIdx: number) => {
    if (!showPageBadges) return null;
    return (
      <div className="no-print flex items-center justify-between text-xs font-semibold text-slate-500 py-2 px-1 w-[794px] max-w-full">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#168A45]"></span>
          <span className="text-slate-700 font-bold">Page {pageIdx + 1} of 15</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600">{pageNames[pageIdx]}</span>
        </span>
        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">A4 • 210 × 297 mm</span>
      </div>
    );
  };

  return (
    <div
      id={id}
      className="bg-transparent text-slate-800 font-sans w-full flex flex-col items-center space-y-10 print:space-y-0 print:w-full"
    >
      {/* ========================================================================= */}
      {/* PAGE 1: COVER PAGE */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center">
        {renderPageBadge(0)}
        <div className="proposal-page proposal-page-card">
          <TopRightWaves />

          {/* Header Logo */}
          <div className="pt-8 px-12 shrink-0">
            <MysarLogo companyLogo={companyLogo} brandName={brandName} />
          </div>

          {/* Center Proposal Title & Presentee */}
          <div className="px-12 pt-10 pb-6 space-y-8">
            <div className="space-y-3">
              <h1 className="text-4xl font-black text-[#168A45] tracking-tight uppercase leading-tight">
                PROPOSAL FOR<br />IMPLEMENTATION
              </h1>
              <div className="w-20 h-1.5 bg-[#168A45] rounded-full"></div>
            </div>

            <div className="space-y-7 pt-4">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Presented to:
                </div>
                <div className="text-2xl font-black text-[#0B5D2A] uppercase tracking-wide mt-1">
                  {proposal.instituteName}
                </div>
                {proposal.contactPerson && (
                  <div className="text-sm font-semibold text-slate-600 mt-1">
                    Attn: {proposal.contactPerson}
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Presented By:
                </div>
                <div className="text-xl font-black text-slate-800 uppercase tracking-wide mt-1">
                  {companyName}
                </div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">
                  {settings?.address ? settings.address : 'Kakkanad, Kochi, Kerala – 682021 | www.casbiro.com'}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Green Banner (Page 1 Cover) */}
          <div className="w-full mt-auto bg-[#168A45] text-white px-12 py-7 flex justify-between items-center relative overflow-hidden">
            <div className="space-y-1 z-10">
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                Proposal Date
              </div>
              <div className="text-sm font-black text-white">
                {proposal.proposalDate || '28 April 2026'}
              </div>
              <div className="text-xs text-white/80">
                Ref: <span className="font-bold">{proposal.proposalNumber}</span>
              </div>
            </div>

            <div className="z-10 text-right">
              <div className="text-lg font-black tracking-wider text-white uppercase">
                {companyName ? companyName.split(' ')[0] : 'CASBIRO'}
              </div>
              <div className="text-[10px] tracking-widest text-white/80 font-bold uppercase">
                — SOLUTIONS PVT. LTD. —
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2: TABLE OF CONTENTS */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center">
        {renderPageBadge(1)}
        <div className="proposal-page proposal-page-card">
          <TopRightWaves />
          <div className="pt-7 px-12 pb-1 shrink-0">
            <MysarLogo companyLogo={companyLogo} brandName={brandName} />
          </div>

          <div className="px-12 pt-4 pb-6 max-w-2xl w-full">
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">
              Table of<br />Contents
            </h2>

            <div className="space-y-3.5 text-sm font-bold text-slate-700">
              {[
                { num: '1', title: `About ${companyName || 'Company'}`, page: 3 },
                { num: '2', title: `About ${brandName || 'MYSAR'}`, page: 4 },
                { num: '3', title: `Modules in ${brandName || 'MYSAR'}`, page: 5 },
                { num: '4', title: `Reports in ${brandName || 'MYSAR'}`, page: 8 },
                { num: '5', title: `Services from Team ${brandName || 'MYSAR'}`, page: 10 },
                { num: '6', title: 'Pricing & Commercial Options', page: 12 },
                { num: '7', title: 'Contact Information', page: 13 },
                { num: '8', title: 'Conclusion', page: 14 },
                { num: '9', title: 'Proposal Acceptance & Signatories', page: 15 },
              ].map((item) => (
                <div key={item.num} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <span className="text-[#168A45] font-black text-base w-5">{item.num}</span>
                    <span className="text-slate-800 text-sm font-semibold">{item.title}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 font-normal">Page {item.page}</span>
                </div>
              ))}
            </div>
          </div>

          <PageFooter pageNumber={2} companyName={companyName} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 3: 1. ABOUT COMPANY */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center">
        {renderPageBadge(2)}
        <div className="proposal-page proposal-page-card">
          <TopRightWaves />
          <div className="pt-7 px-12 pb-1 shrink-0">
            <MysarLogo companyLogo={companyLogo} brandName={brandName} />
          </div>

          <div className="px-12 pt-3 pb-6 space-y-5 text-slate-700 leading-relaxed text-sm">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              1. About {companyName}
            </h2>

            <p className="text-slate-700">
              <strong>{companyName}</strong> {content.aboutCompanyText1.replace(/^Casbiro Solutions Private Limited\s*/i, '')}
            </p>

            <p className="text-slate-700">
              {content.aboutCompanyText2}
            </p>

            <div className="space-y-2 pt-2">
              <p className="font-bold text-slate-900">We aim to:</p>
              <ul className="space-y-2 pl-2">
                {content.companyObjectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-[#168A45] text-lg font-black leading-none mt-0.5">•</span>
                    <span className="text-slate-700">{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            {content.companyScaleNote && (
              <div className="pt-2">
                <p className="p-3.5 bg-[#F7FAF8] rounded-xl border border-gray-200 text-slate-600 text-xs leading-relaxed">
                  {content.companyScaleNote}
                </p>
              </div>
            )}
          </div>

          <PageFooter pageNumber={3} companyName={companyName} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 4: 2. ABOUT MYSAR */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center">
        {renderPageBadge(3)}
        <div className="proposal-page proposal-page-card">
          <TopRightWaves />
          <div className="pt-7 px-12 pb-1 shrink-0">
            <MysarLogo companyLogo={companyLogo} brandName={brandName} />
          </div>

          <div className="px-12 pt-3 pb-6 space-y-5 text-slate-700 leading-relaxed text-sm">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              2. About {brandName} (My Student Analysis Record)
            </h2>

            <p className="text-slate-700">
              {content.aboutProductText}
            </p>

            <div className="space-y-3 pt-2">
              <p className="font-bold text-slate-900">Key Platform Capabilities:</p>
              <ul className="space-y-2.5 pl-2">
                {content.productHighlights.map((hl, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-[#168A45] text-lg font-black leading-none mt-0.5">•</span>
                    <span className="text-slate-700 font-medium">{hl}</span>
                  </li>
                ))}
              </ul>
            </div>

            {content.productSummaryQuote && (
              <p className="pt-3 font-medium text-slate-800 bg-[#EAF7EF] p-4 rounded-xl border border-[#D9E5DD] text-xs sm:text-sm leading-relaxed">
                {content.productSummaryQuote}
              </p>
            )}
          </div>

          <PageFooter pageNumber={4} companyName={companyName} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 5: 3. MODULES IN MYSAR (Part 1) */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center">
        {renderPageBadge(4)}
        <div className="proposal-page proposal-page-card">
          <TopRightWaves />
          <div className="pt-7 px-12 pb-1 shrink-0">
            <MysarLogo companyLogo={companyLogo} brandName={brandName} />
          </div>

          <div className="px-12 pt-2 pb-5 space-y-3.5 text-slate-700 text-xs sm:text-sm">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                3. Modules in {brandName}
              </h2>
              <p className="text-slate-500 mt-1">
                {content.modulesIntroText}
              </p>
            </div>

            <div className="text-xs font-extrabold text-[#0B5D2A] uppercase tracking-wider pt-1">
              Core Modules • Part 1
            </div>

            <div className="space-y-4">
              {part1Modules.map((mod, idx) => (
                <div key={mod.id} className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {idx + 1}. {mod.name}
                  </h3>
                  <ul className="pl-4 space-y-0.5 text-slate-600 text-xs">
                    {mod.features.map((feat, fIdx) => (
                      <li key={fIdx}>• {feat}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <PageFooter pageNumber={5} companyName={companyName} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 6: 3. MODULES IN MYSAR (Part 2) */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center">
        {renderPageBadge(5)}
        <div className="proposal-page proposal-page-card">
          <TopRightWaves />
          <div className="pt-7 px-12 pb-1 shrink-0">
            <MysarLogo companyLogo={companyLogo} brandName={brandName} />
          </div>

          <div className="px-12 pt-2 pb-5 space-y-3.5 text-slate-700 text-xs sm:text-sm">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                3. Modules in {brandName} (Contd.)
              </h2>
              <div className="text-xs font-extrabold text-[#0B5D2A] uppercase tracking-wider pt-1">
                Core Modules • Part 2
              </div>
            </div>

            <div className="space-y-3.5">
              {part2Modules.map((mod, idx) => (
                <div key={mod.id} className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {idx + 5}. {mod.name}
                  </h3>
                  <ul className="pl-4 space-y-0.5 text-slate-600 text-xs">
                    {mod.features.map((feat, fIdx) => (
                      <li key={fIdx}>• {feat}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <PageFooter pageNumber={6} companyName={companyName} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 7: 3. MODULES IN MYSAR (Part 3) */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center">
        {renderPageBadge(6)}
        <div className="proposal-page proposal-page-card">
          <TopRightWaves />
          <div className="pt-7 px-12 pb-1 shrink-0">
            <MysarLogo companyLogo={companyLogo} brandName={brandName} />
          </div>

          <div className="px-12 pt-2 pb-5 space-y-4 text-slate-700 text-xs sm:text-sm">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                3. Modules in {brandName} (Contd.)
              </h2>
              <div className="text-xs font-extrabold text-[#0B5D2A] uppercase tracking-wider pt-1">
                Specialized Modules & Apps • Part 3
              </div>
            </div>

            <div className="space-y-4">
              {part3Modules.map((mod, idx) => (
                <div key={mod.id} className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {idx + 10}. {mod.name}
                  </h3>
                  <ul className="pl-4 space-y-0.5 text-slate-600 text-xs">
                    {mod.features.map((feat, fIdx) => (
                      <li key={fIdx}>• {feat}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-[#F7FAF8] rounded-xl border border-gray-200 text-xs text-slate-600 space-y-1.5 mt-4">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#168A45]" />
                <span>Enterprise Architecture & Security</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                All modules operate within a unified, role-based cloud database ensuring zero data duplication, granular access controls, and real-time synchronization between desktop portals and native mobile applications.
              </p>
            </div>
          </div>

          <PageFooter pageNumber={7} companyName={companyName} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 8: 4. REPORTS IN MYSAR (Part 1) */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center">
        {renderPageBadge(7)}
        <div className="proposal-page proposal-page-card">
          <TopRightWaves />
          <div className="pt-7 px-12 pb-1 shrink-0">
            <MysarLogo companyLogo={companyLogo} brandName={brandName} />
          </div>

          <div className="px-12 pt-2 pb-5 space-y-3.5 text-slate-700 text-xs sm:text-sm">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                4. Reports in {brandName}
              </h2>
              <p className="text-slate-500 mt-1">
                {content.reportsIntroText}
              </p>
            </div>

            <div className="space-y-4">
              {reportCatsPart1.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {cat.categoryName}
                  </h3>
                  <ul className="pl-4 space-y-0.5 text-slate-600 text-xs">
                    {cat.reports.map((rep, rIdx) => (
                      <li key={rIdx}>• {rep}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <PageFooter pageNumber={8} companyName={companyName} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 9: 4. REPORTS IN MYSAR (Part 2) */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center">
        {renderPageBadge(8)}
        <div className="proposal-page proposal-page-card">
          <TopRightWaves />
          <div className="pt-7 px-12 pb-1 shrink-0">
            <MysarLogo companyLogo={companyLogo} brandName={brandName} />
          </div>

          <div className="px-12 pt-2 pb-5 space-y-3.5 text-slate-700 text-xs sm:text-sm">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                4. Reports in {brandName} (Contd.)
              </h2>
              <p className="text-slate-500 mt-1">
                Administrative, compliance, and custom statutory reporting categories.
              </p>
            </div>

            <div className="space-y-3.5">
              {reportCatsPart2.map((cat) => (
                <div key={cat.id} className="space-y-0.5">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {cat.categoryName}
                  </h3>
                  <ul className="pl-4 space-y-0.5 text-slate-600 text-xs">
                    {cat.reports.map((rep, rIdx) => (
                      <li key={rIdx}>• {rep}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-[#F7FAF8] rounded-xl border border-gray-200 text-xs text-slate-600 space-y-1 mt-4">
              <div className="font-bold text-slate-900">Multi-Format Export & Analytics</div>
              <p className="text-[11px] leading-relaxed">
                All analytics and summary tables are available for one-click export into Microsoft Excel (.xlsx), PDF, and CSV formats, with role-restricted access logs for audit compliance.
              </p>
            </div>
          </div>

          <PageFooter pageNumber={9} companyName={companyName} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 10: 5. SERVICES FROM TEAM MYSAR (Part 1) */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center">
        {renderPageBadge(9)}
        <div className="proposal-page proposal-page-card">
          <TopRightWaves />
          <div className="pt-7 px-12 pb-1 shrink-0">
            <MysarLogo companyLogo={companyLogo} brandName={brandName} />
          </div>

          <div className="px-12 pt-2 pb-5 space-y-3.5 text-slate-700 text-xs sm:text-sm">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                5. Services from Team {brandName}
              </h2>
              <p className="text-slate-500 mt-1">
                {content.servicesIntroText}
              </p>
            </div>

            <div className="space-y-3.5">
              {servicesPart1.map((srv) => (
                <div key={srv.id} className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">{srv.title}</h3>
                  <ul className="pl-4 space-y-0.5 text-slate-600 text-xs">
                    {srv.points.map((p, pIdx) => (
                      <li key={pIdx}>• {p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <PageFooter pageNumber={10} companyName={companyName} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 11: 5. SERVICES FROM TEAM MYSAR (Part 2) */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center">
        {renderPageBadge(10)}
        <div className="proposal-page proposal-page-card">
          <TopRightWaves />
          <div className="pt-7 px-12 pb-1 shrink-0">
            <MysarLogo companyLogo={companyLogo} brandName={brandName} />
          </div>

          <div className="px-12 pt-2 pb-5 space-y-3.5 text-slate-700 text-xs sm:text-sm">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                5. Services from Team {brandName} (Contd.)
              </h2>
              <p className="text-slate-500 mt-1">
                Ongoing technical infrastructure, compliance audits, and system maintenance.
              </p>
            </div>

            <div className="space-y-3.5">
              {servicesPart2.map((srv) => (
                <div key={srv.id} className="space-y-0.5">
                  <h3 className="font-bold text-slate-900 text-sm">{srv.title}</h3>
                  <ul className="pl-4 space-y-0.5 text-slate-600 text-xs">
                    {srv.points.map((p, pIdx) => (
                      <li key={pIdx}>• {p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-[#F7FAF8] rounded-xl border border-gray-200 text-xs text-slate-600 space-y-1 mt-4">
              <div className="font-bold text-slate-900">Service Level Commitment</div>
              <p className="text-[11px] leading-relaxed">
                Team MYSAR is committed to guaranteed 99.9% platform availability, high-speed query response times, and same-day priority issue resolution for critical administrative and examination tasks.
              </p>
            </div>
          </div>

          <PageFooter pageNumber={11} companyName={companyName} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 12: 6. PRICING & COMMERCIAL OPTIONS */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center">
        {renderPageBadge(11)}
        <div className="proposal-page proposal-page-card">
          <TopRightWaves />
          <div className="pt-7 px-12 pb-1 shrink-0">
            <MysarLogo companyLogo={companyLogo} brandName={brandName} />
          </div>

          <div className="px-12 pt-2 pb-5 space-y-3.5 text-slate-700 text-xs sm:text-sm">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                6. Pricing & Commercial Options
              </h2>
              <p className="text-slate-500 mt-1 text-xs">
                {content.pricingIntroText}
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Configured Multi-Tier Options Table */}
              {pricingItemsToDisplay && pricingItemsToDisplay.length > 1 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs bg-white text-xs">
                  <div className="bg-slate-50 border-b border-gray-200 px-3.5 py-2 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Alternative Commercial Plans & Packages
                  </div>
                  <div className="divide-y divide-gray-100">
                    {pricingItemsToDisplay.map((item, idx) => (
                      <div key={item.id || idx} className="p-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{item.pricingType}</span>
                            {item.isPrimary && (
                              <span className="text-[9px] bg-emerald-100 text-[#0B5D2A] font-bold px-1.5 py-0.2 rounded">
                                Selected
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <div className="text-[10.5px] text-slate-500 mt-0.5">{item.description}</div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-[#0B5D2A] text-xs">
                            ₹{item.pricePerStudent} / student
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatINR(item.totalAmount || item.pricePerStudent * (proposal.studentCount || 500))} / yr
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Standard Pricing Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F7FAF8] p-3.5 rounded-xl border border-gray-200 text-xs">
                  <h4 className="font-bold text-slate-900 text-xs">Standard School Payment</h4>
                  <p className="text-[#168A45] font-bold mt-0.5 text-xs">
                    {content.pricingNotes.schoolPaymentNote}
                  </p>
                  <p className="text-slate-500 text-[10.5px] mt-1.5 leading-relaxed">
                    Institutional billing option where the school manages licensing directly for all enrolled students.
                  </p>
                </div>

                <div className="bg-[#F7FAF8] p-3.5 rounded-xl border border-gray-200 text-xs">
                  <h4 className="font-bold text-slate-900 text-xs">Standard Parent Payment</h4>
                  <p className="text-[#168A45] font-bold mt-0.5 text-xs">
                    {content.pricingNotes.parentPaymentNote}
                  </p>
                  <p className="text-slate-500 text-[10.5px] mt-1.5 leading-relaxed">
                    Direct parent subscription model with secure integrated payment gateway.
                  </p>
                </div>
              </div>

              {content.pricingNotes.trialOfferNote && (
                <div className="bg-[#F7FAF8] p-3 rounded-xl border border-gray-200 text-xs">
                  <h4 className="font-bold text-slate-900 text-xs">Introductory Trial Offer</h4>
                  <p className="text-[#168A45] font-bold mt-0.5 text-xs">
                    {content.pricingNotes.trialOfferNote}
                  </p>
                </div>
              )}

              {proposal.notes && (
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <strong className="font-bold">Special Custom Terms: </strong>
                  <span>{proposal.notes}</span>
                </div>
              )}

              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-[#168A45] shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-emerald-800">
                  <strong className="font-bold text-emerald-950">Proposal Authorization: </strong>
                  The finalized commercial student rate and official investment schedule for <strong>{proposal.instituteName}</strong> are formalized in the dedicated <strong>Proposal Acceptance & Signatories</strong> document (Section 9).
                </div>
              </div>
            </div>
          </div>

          <PageFooter pageNumber={12} companyName={companyName} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 13: 7. CONTACT INFORMATION */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center">
        {renderPageBadge(12)}
        <div className="proposal-page proposal-page-card">
          <TopRightWaves />
          <div className="pt-7 px-12 pb-1 shrink-0">
            <MysarLogo companyLogo={companyLogo} brandName={brandName} />
          </div>

          <div className="px-12 pt-3 pb-5 space-y-3.5 text-slate-700 text-xs sm:text-sm">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                7. Contact Information
              </h2>
              <p className="text-slate-500 mt-1">
                {content.contactIntroText}
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <h3 className="text-sm font-black text-slate-900">{companyName}</h3>
                <div className="text-slate-600 mt-1 space-y-0.5 text-xs">
                  <p className="font-semibold text-slate-800">Office Address:</p>
                  {content.officeAddressLines.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </div>

              <div className="space-y-0.5 text-xs">
                <p className="font-semibold text-slate-800">Direct Telephone Contacts:</p>
                <ul className="space-y-0.5 text-slate-700 pl-2">
                  {content.contactPersons.map((p, idx) => (
                    <li key={idx}>
                      • <strong>{p.name}</strong> ({p.designation}): {p.phone}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-xs">
                <p className="font-semibold text-slate-800">Official Email:</p>
                <p className="text-[#168A45] font-bold">{content.contactEmail || settings?.email || 'support@casbiro.com'}</p>
              </div>

              <div className="pt-1 text-xs">
                <h4 className="font-bold text-slate-900">Dedicated Implementation Support</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">Our team is actively available to assist with:</p>
                <ul className="pl-4 space-y-0.5 text-slate-600 mt-1 text-xs">
                  {content.supportPoints.map((sp, idx) => (
                    <li key={idx}>• {sp}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#F7FAF8] p-3 rounded-xl border border-gray-200 text-slate-600 text-xs">
                <p className="font-bold text-slate-800 mb-0.5">Closing Note</p>
                <p className="text-[11px] leading-relaxed">
                  {replacePlaceholders(content.closingNote)}
                </p>
              </div>
            </div>
          </div>

          <PageFooter pageNumber={13} companyName={companyName} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 14: 8. CONCLUSION */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center">
        {renderPageBadge(13)}
        <div className="proposal-page proposal-page-card">
          <TopRightWaves />
          <div className="pt-7 px-12 pb-1 shrink-0">
            <MysarLogo companyLogo={companyLogo} brandName={brandName} />
          </div>

          <div className="px-12 pt-3 pb-5 space-y-3.5 text-slate-700 text-xs sm:text-sm leading-relaxed">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {content.conclusionTitle || '8. Conclusion'}
              </h2>
              <p className="text-slate-500 mt-0.5 text-xs">
                Continuous innovation, transformative student analysis, and enduring institutional partnership.
              </p>
            </div>

            <div className="space-y-3.5">
              <div className="p-4 bg-[#F7FAF8] rounded-xl border border-gray-200 text-xs text-slate-700 leading-relaxed space-y-2">
                <p>
                  At {brandName}, our mission is to empower educational institutions with actionable intelligence, streamlined workflows, and unified stakeholder engagement. By connecting academic evaluations, real-time attendance, behavioural observations, and multi-channel parent communication, we enable school leadership to make informed decisions that accelerate student achievement.
                </p>
                <p>
                  We look forward to an impactful, long-term partnership with <strong>{proposal.instituteName}</strong>—providing robust infrastructure, responsive technical assistance, and continuous feature updates that elevate your school community.
                </p>
              </div>

              {content.upcomingModules && content.upcomingModules.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#168A45]" />
                    <h4 className="font-bold text-slate-900 text-xs">
                      {content.upcomingModulesIntro ||
                        'As part of our continuous innovation, we are also planning to introduce advanced modules in the coming years, including:'}
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {content.upcomingModules.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs text-[11px] font-medium text-slate-700 flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#168A45] shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {content.studentAppNote && (
                <div className="bg-[#F7FAF8] p-3 rounded-xl border border-gray-200 text-xs text-slate-600">
                  <strong className="font-bold text-slate-800">Student Mobile Experience: </strong>
                  <span>{replacePlaceholders(content.studentAppNote)}</span>
                </div>
              )}

              {content.finalCallToAction && (
                <p className="text-xs font-semibold text-slate-900 bg-[#EAF7EF] p-3.5 rounded-xl border border-[#D9E5DD]">
                  {replacePlaceholders(content.finalCallToAction)}
                </p>
              )}
            </div>
          </div>

          <PageFooter pageNumber={14} companyName={companyName} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 15: 9. PROPOSAL ACCEPTANCE & SIGNATORIES */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center">
        {renderPageBadge(14)}
        <div className="proposal-page proposal-page-card">
          <TopRightWaves />
          <div className="pt-7 px-12 pb-1 shrink-0">
            <MysarLogo companyLogo={companyLogo} brandName={brandName} />
          </div>

          <div className="px-12 pt-2 pb-4 space-y-3 text-slate-700 text-xs leading-relaxed">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                9. Proposal Acceptance & Signatories
              </h2>
              <p className="text-slate-500 mt-0.5 text-xs">
                Commercial authorization and formal agreement framework for {proposal.instituteName}
              </p>
            </div>

            {/* Commercial Terms Summary Box */}
            <div className="bg-[#F7FAF8] border border-gray-200 rounded-xl p-3 text-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Commercial Scope & Investment Summary
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Selected Plan</div>
                  <div className="font-bold text-slate-900 text-xs truncate">{proposal.pricingType || 'School Premium'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Enrolled Students</div>
                  <div className="font-bold text-slate-900 text-xs">{proposal.studentCount || 0} Students</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Rate per Student</div>
                  <div className="font-bold text-[#168A45] text-xs">₹{proposal.pricePerStudent || 0} / year</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">Total Annual Value</div>
                  <div className="font-black text-[#0B5D2A] text-xs">{formatINR(proposal.totalAmount || 0)}</div>
                </div>
              </div>
            </div>

            {/* Proposal Acceptance Statement & Declaration */}
            <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#168A45]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {content.signatoryTitle || 'Proposal Acceptance & Declaration'}
                </h3>
              </div>
              <div className="text-[10.5px] text-slate-600 space-y-1.5 leading-relaxed">
                {replacePlaceholders(
                  content.signatoryAgreementText ||
                    DEFAULT_PROPOSAL_CONTENT.signatoryAgreementText
                )
                  .split('\n\n')
                  .map((paragraph, pIdx) => (
                    <p key={pIdx} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
              </div>
            </div>

            {/* Dual Signatories Block */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Client Signature Box */}
              <div className="bg-[#F7FAF8] border border-gray-300/90 rounded-xl p-3 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center px-2 py-0.5 bg-slate-200 text-slate-800 text-[9.5px] font-bold rounded uppercase tracking-wider">
                    {content.clientSignatoryLabel || 'Client Signature'}
                  </div>
                  <p className="text-xs font-black text-slate-900 truncate">
                    {proposal.instituteName}
                  </p>
                  <p className="text-[10.5px] text-slate-600">
                    <span className="font-semibold text-slate-700">Authorized Signatory: </span>
                    {proposal.contactPerson || 'Principal / Chairman'}
                  </p>
                  <p className="text-[9.5px] text-slate-500">
                    <span className="font-semibold text-slate-600">Designation: </span>
                    {content.clientSignatoryDesignation || 'Principal / Authorized Trustee'}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-200">
                  <div className="h-9 border-b border-dashed border-slate-400 flex items-end justify-between pb-0.5">
                    <span className="text-[9px] text-slate-400 italic">Signature</span>
                    <span className="text-[8.5px] text-slate-400 font-medium">[ Institution Official Seal ]</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-600">
                    <span>Date: ______________</span>
                    <span>Place: ____________</span>
                  </div>
                </div>
              </div>

              {/* Authorized Signatory (Casbiro Solutions) Box */}
              <div className="bg-[#F7FAF8] border border-[#168A45]/40 rounded-xl p-3 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center px-2 py-0.5 bg-[#EAF7EF] text-[#0B5D2A] text-[9.5px] font-bold rounded uppercase tracking-wider border border-[#D9E5DD]">
                    {content.companySignatoryLabel || 'Authorized Signatory'}
                  </div>
                  <p className="text-xs font-black text-slate-900 truncate">
                    {companyName}
                  </p>
                  <p className="text-[10.5px] text-slate-600">
                    <span className="font-semibold text-slate-700">Representative: </span>
                    {proposal.createdBy || content.companySignatoryName || 'Authorized Signatory'}
                  </p>
                  <p className="text-[9.5px] text-slate-500">
                    <span className="font-semibold text-slate-600">Designation: </span>
                    {content.companySignatoryDesignation || 'Director & Authorized Signatory'}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-200">
                  <div className="h-9 border-b border-dashed border-[#168A45]/70 flex items-end justify-between pb-0.5">
                    <span className="text-[9px] text-[#168A45] font-semibold italic">Authorized Signature</span>
                    <span className="text-[8.5px] text-[#168A45]/80 font-medium">[ Casbiro Official Seal ]</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-600">
                    <span>Date: {proposal.proposalDate || '______________'}</span>
                    <span>Kochi, Kerala</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[9.5px] text-slate-400 text-center italic pt-1">
              This proposal constitutes a formal agreement framework upon signature by authorized representatives of both parties.
            </p>
          </div>

          <PageFooter pageNumber={15} companyName={companyName} />
        </div>
      </div>
    </div>
  );
};
