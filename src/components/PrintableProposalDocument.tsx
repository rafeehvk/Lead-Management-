import React from 'react';
import { Proposal, Settings } from '../types';
import { formatINR } from '../utils/pdfGenerator';
import { getEffectiveProposalContent } from '../utils/defaultProposalContent';

interface PrintableProposalDocumentProps {
  proposal: Proposal;
  settings?: Settings;
  id?: string;
}

// Decorative SVG Wave Curve for Page Top-Right
const TopRightWaves = () => (
  <svg
    className="absolute top-0 right-0 w-44 sm:w-56 h-36 sm:h-44 pointer-events-none"
    viewBox="0 0 240 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M240 0C180 30 150 90 200 140C220 160 240 170 240 180"
      stroke="#168A45"
      strokeWidth="1.2"
      strokeOpacity="0.4"
    />
    <path
      d="M240 15C170 45 140 100 190 150C210 170 230 175 240 180"
      stroke="#168A45"
      strokeWidth="1.2"
      strokeOpacity="0.5"
    />
    <path
      d="M240 30C160 60 130 110 180 160C200 175 220 180 240 180"
      stroke="#168A45"
      strokeWidth="1.2"
      strokeOpacity="0.6"
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
          className="h-10 max-w-[160px] object-contain"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-[#168A45] flex items-center justify-center text-white shadow-2xs">
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
      </div>
      <span className="text-2xl font-black text-[#168A45] tracking-tight lowercase">
        {brandName || 'mysar'}
      </span>
    </div>
  );
};

// Bottom Page Bar
const PageFooter: React.FC<{ pageNumber: number; companyName?: string }> = ({ pageNumber, companyName }) => (
  <div className="mt-auto pt-6">
    <div className="h-6 bg-[#168A45] rounded-t-sm flex items-center justify-between px-6 text-white text-[10px]">
      <span className="font-semibold tracking-wider">
        MYSAR • {companyName ? companyName.toUpperCase() : 'CASBIRO SOLUTIONS PRIVATE LIMITED'}
      </span>
      <span className="font-bold">Page {pageNumber}</span>
    </div>
  </div>
);

export const PrintableProposalDocument: React.FC<PrintableProposalDocumentProps> = ({
  proposal,
  settings,
  id = 'mysar-proposal-printable-document',
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

  const replacePlaceholders = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\{\{INSTITUTE_NAME\}\}/g, proposal.instituteName || 'the Institution')
      .replace(/\{\{PROPOSAL_NUMBER\}\}/g, proposal.proposalNumber || '')
      .replace(/\{\{STUDENT_COUNT\}\}/g, String(proposal.studentCount || 0))
      .replace(/\{\{COMPANY_NAME\}\}/g, companyName)
      .replace(/\{\{BRAND_NAME\}\}/g, brandName);
  };

  return (
    <div
      id={id}
      className="bg-white text-slate-800 font-sans max-w-4xl mx-auto space-y-8 print:space-y-0"
    >
      {/* ========================================================================= */}
      {/* PAGE 1: COVER PAGE */}
      {/* ========================================================================= */}
      <div className="proposal-page relative bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-[1080px] flex flex-col justify-between p-8 sm:p-12 shadow-sm">
        <TopRightWaves />

        {/* Header Logo */}
        <div className="pt-4">
          <MysarLogo companyLogo={companyLogo} brandName={brandName} />
        </div>

        {/* Center Proposal Title */}
        <div className="my-auto py-12 space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#168A45] tracking-tight uppercase leading-tight">
              PROPOSAL FOR<br />IMPLEMENTATION
            </h1>
            <div className="w-20 h-1.5 bg-[#168A45] rounded-full"></div>
          </div>

          <div className="space-y-6 pt-6">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Presented to:
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#0B5D2A] uppercase tracking-wide mt-1">
                {proposal.instituteName}
              </div>
              {proposal.contactPerson && (
                <div className="text-sm font-semibold text-slate-600 mt-0.5">
                  Attn: {proposal.contactPerson}
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Presented By:
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-800 uppercase tracking-wide mt-1">
                {companyName}
              </div>
              <div className="text-xs font-medium text-slate-500">
                {settings?.address ? settings.address : 'Kakkanad, Kochi, Kerala – 682021 | www.casbiro.com'}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Green Banner */}
        <div className="mt-auto bg-[#168A45] text-white -mx-8 sm:-mx-12 -mb-8 sm:-mb-12 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
          <div className="space-y-1 z-10">
            <div className="text-xs font-bold uppercase tracking-wider text-white/80">
              Proposal Date
            </div>
            <div className="text-sm font-black text-white">
              {proposal.proposalDate || '28 April 2026'}
            </div>
            <div className="text-xs text-white/80">
              Ref: <span className="font-bold">{proposal.proposalNumber}</span>
            </div>
          </div>

          <div className="z-10 text-left sm:text-right">
            <div className="text-lg font-black tracking-wider text-white uppercase">
              {companyName ? companyName.split(' ')[0] : 'CASBIRO'}
            </div>
            <div className="text-[10px] tracking-widest text-white/80 font-bold uppercase">
              — SOLUTIONS PVT. LTD. —
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2: TABLE OF CONTENTS */}
      {/* ========================================================================= */}
      <div className="proposal-page relative bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-[1080px] flex flex-col justify-between p-8 sm:p-12 shadow-sm">
        <TopRightWaves />
        <MysarLogo companyLogo={companyLogo} brandName={brandName} />

        <div className="my-auto py-8 max-w-xl">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-8 tracking-tight">
            Table of<br />Contents
          </h2>

          <div className="space-y-4 text-base font-bold text-slate-700">
            {[
              { num: '1', title: `About ${companyName || 'Company'}` },
              { num: '2', title: `About ${brandName || 'MYSAR'}` },
              { num: '3', title: `Modules in ${brandName || 'MYSAR'}` },
              { num: '4', title: `Reports in ${brandName || 'MYSAR'}` },
              { num: '5', title: `Services from Team ${brandName || 'MYSAR'}` },
              { num: '6', title: 'Pricing' },
              { num: '7', title: 'Contact Information' },
              { num: '8', title: 'Conclusion' },
            ].map((item) => (
              <div key={item.num} className="flex items-center gap-6 py-1.5 border-b border-gray-100">
                <span className="text-[#168A45] font-black text-lg w-6">{item.num}</span>
                <span className="text-slate-800">{item.title}</span>
              </div>
            ))}
          </div>
        </div>

        <PageFooter pageNumber={2} companyName={companyName} />
      </div>

      {/* ========================================================================= */}
      {/* PAGE 3: 1. ABOUT COMPANY */}
      {/* ========================================================================= */}
      <div className="proposal-page relative bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-[1080px] flex flex-col justify-between p-8 sm:p-12 shadow-sm">
        <TopRightWaves />
        <MysarLogo companyLogo={companyLogo} brandName={brandName} />

        <div className="my-auto py-6 space-y-6 max-w-2xl text-slate-700 leading-relaxed text-sm sm:text-base">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            1. About {companyName}
          </h2>

          <p>
            <strong>{companyName}</strong> {content.aboutCompanyText1.replace(/^Casbiro Solutions Private Limited\s*/i, '')}
          </p>

          <p>
            {content.aboutCompanyText2}
          </p>

          <div className="space-y-2 pt-2">
            <p className="font-bold text-slate-900">We aim to:</p>
            <ul className="space-y-2 pl-2">
              {content.companyObjectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-[#168A45] text-lg font-black leading-none mt-0.5">•</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {content.companyScaleNote && (
            <p className="pt-2">
              {content.companyScaleNote}
            </p>
          )}
        </div>

        <PageFooter pageNumber={3} companyName={companyName} />
      </div>

      {/* ========================================================================= */}
      {/* PAGE 4: 2. ABOUT MYSAR */}
      {/* ========================================================================= */}
      <div className="proposal-page relative bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-[1080px] flex flex-col justify-between p-8 sm:p-12 shadow-sm">
        <TopRightWaves />
        <MysarLogo companyLogo={companyLogo} brandName={brandName} />

        <div className="my-auto py-6 space-y-6 max-w-2xl text-slate-700 leading-relaxed text-sm sm:text-base">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            2. About {brandName} (My Student Analysis Record)
          </h2>

          <p>
            {content.aboutProductText}
          </p>

          <div className="space-y-3 pt-2">
            <p className="font-bold text-slate-900">It provides:</p>
            <ul className="space-y-2.5 pl-2">
              {content.productHighlights.map((hl, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="text-[#168A45] text-lg font-black leading-none mt-0.5">•</span>
                  <span><strong>{hl}</strong></span>
                </li>
              ))}
            </ul>
          </div>

          {content.productSummaryQuote && (
            <p className="pt-4 font-medium text-slate-800 bg-[#EAF7EF] p-4 rounded-xl border border-[#D9E5DD]">
              {content.productSummaryQuote}
            </p>
          )}
        </div>

        <PageFooter pageNumber={4} companyName={companyName} />
      </div>

      {/* ========================================================================= */}
      {/* PAGE 5: 3. MODULES IN MYSAR (Part 1) */}
      {/* ========================================================================= */}
      <div className="proposal-page relative bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-[1080px] flex flex-col justify-between p-8 sm:p-12 shadow-sm">
        <TopRightWaves />
        <MysarLogo companyLogo={companyLogo} brandName={brandName} />

        <div className="my-auto py-4 space-y-4 max-w-2xl text-slate-700 text-xs sm:text-sm">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              3. Modules in {brandName}
            </h2>
            <p className="text-slate-500 mt-1">
              {content.modulesIntroText}
            </p>
          </div>

          <div className="text-sm font-extrabold text-[#0B5D2A] uppercase tracking-wider pt-2">
            Core Modules
          </div>

          <div className="space-y-4">
            {part1Modules.map((mod, idx) => (
              <div key={mod.id} className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {idx + 1}. {mod.name}
                </h3>
                <ul className="pl-4 space-y-0.5 text-slate-600">
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

      {/* ========================================================================= */}
      {/* PAGE 6: 3. MODULES IN MYSAR (Part 2) */}
      {/* ========================================================================= */}
      <div className="proposal-page relative bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-[1080px] flex flex-col justify-between p-8 sm:p-12 shadow-sm">
        <TopRightWaves />
        <MysarLogo companyLogo={companyLogo} brandName={brandName} />

        <div className="my-auto py-4 space-y-4 max-w-2xl text-slate-700 text-xs sm:text-sm">
          <div className="space-y-4">
            {part2Modules.map((mod, idx) => (
              <div key={mod.id} className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {idx + 5}. {mod.name}
                </h3>
                <ul className="pl-4 space-y-0.5 text-slate-600">
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

      {/* ========================================================================= */}
      {/* PAGE 7: 3. MODULES IN MYSAR (Part 3) */}
      {/* ========================================================================= */}
      <div className="proposal-page relative bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-[1080px] flex flex-col justify-between p-8 sm:p-12 shadow-sm">
        <TopRightWaves />
        <MysarLogo companyLogo={companyLogo} brandName={brandName} />

        <div className="my-auto py-6 space-y-6 max-w-2xl text-slate-700 text-sm sm:text-base">
          <div className="space-y-6">
            {part3Modules.map((mod, idx) => (
              <div key={mod.id} className="space-y-1.5">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  {idx + 10}. {mod.name}
                </h3>
                <ul className="pl-4 space-y-1 text-slate-600">
                  {mod.features.map((feat, fIdx) => (
                    <li key={fIdx}>• {feat}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <PageFooter pageNumber={7} companyName={companyName} />
      </div>

      {/* ========================================================================= */}
      {/* PAGE 8: 4. REPORTS IN MYSAR (Part 1) */}
      {/* ========================================================================= */}
      <div className="proposal-page relative bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-[1080px] flex flex-col justify-between p-8 sm:p-12 shadow-sm">
        <TopRightWaves />
        <MysarLogo companyLogo={companyLogo} brandName={brandName} />

        <div className="my-auto py-4 space-y-5 max-w-2xl text-slate-700 text-xs sm:text-sm">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              4. Reports in {brandName}
            </h2>
            <p className="text-slate-500 mt-1">
              {content.reportsIntroText}
            </p>
          </div>

          <div className="space-y-4">
            {reportCatsPart1.map((cat) => (
              <div key={cat.id} className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {cat.categoryName}
                </h3>
                <ul className="pl-4 space-y-0.5 text-slate-600">
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

      {/* ========================================================================= */}
      {/* PAGE 9: 4. REPORTS IN MYSAR (Part 2) */}
      {/* ========================================================================= */}
      <div className="proposal-page relative bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-[1080px] flex flex-col justify-between p-8 sm:p-12 shadow-sm">
        <TopRightWaves />
        <MysarLogo companyLogo={companyLogo} brandName={brandName} />

        <div className="my-auto py-4 space-y-4 max-w-2xl text-slate-700 text-xs sm:text-sm">
          <div className="space-y-3.5">
            {reportCatsPart2.map((cat) => (
              <div key={cat.id} className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {cat.categoryName}
                </h3>
                <ul className="pl-4 space-y-0.5 text-slate-600">
                  {cat.reports.map((rep, rIdx) => (
                    <li key={rIdx}>• {rep}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <PageFooter pageNumber={9} companyName={companyName} />
      </div>

      {/* ========================================================================= */}
      {/* PAGE 10: 5. SERVICES FROM TEAM MYSAR (Part 1) */}
      {/* ========================================================================= */}
      <div className="proposal-page relative bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-[1080px] flex flex-col justify-between p-8 sm:p-12 shadow-sm">
        <TopRightWaves />
        <MysarLogo companyLogo={companyLogo} brandName={brandName} />

        <div className="my-auto py-4 space-y-5 max-w-2xl text-slate-700 text-xs sm:text-sm">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              5. Services from Team {brandName}
            </h2>
            <p className="text-slate-500 mt-1">
              {content.servicesIntroText}
            </p>
          </div>

          <div className="space-y-4">
            {servicesPart1.map((srv) => (
              <div key={srv.id} className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">{srv.title}</h3>
                <ul className="pl-4 space-y-0.5 text-slate-600">
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

      {/* ========================================================================= */}
      {/* PAGE 11: 5. SERVICES FROM TEAM MYSAR (Part 2) */}
      {/* ========================================================================= */}
      <div className="proposal-page relative bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-[1080px] flex flex-col justify-between p-8 sm:p-12 shadow-sm">
        <TopRightWaves />
        <MysarLogo companyLogo={companyLogo} brandName={brandName} />

        <div className="my-auto py-4 space-y-4 max-w-2xl text-slate-700 text-xs sm:text-sm">
          <div className="space-y-3.5">
            {servicesPart2.map((srv) => (
              <div key={srv.id} className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">{srv.title}</h3>
                <ul className="pl-4 space-y-0.5 text-slate-600">
                  {srv.points.map((p, pIdx) => (
                    <li key={pIdx}>• {p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <PageFooter pageNumber={11} companyName={companyName} />
      </div>

      {/* ========================================================================= */}
      {/* PAGE 12: 6. PRICING */}
      {/* ========================================================================= */}
      <div className="proposal-page relative bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-[1080px] flex flex-col justify-between p-8 sm:p-12 shadow-sm">
        <TopRightWaves />
        <MysarLogo companyLogo={companyLogo} brandName={brandName} />

        <div className="my-auto py-6 space-y-5 max-w-2xl text-slate-700 text-sm sm:text-base">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              6. Pricing & Commercial Options
            </h2>
            <p className="text-slate-500 mt-1 text-xs sm:text-sm">
              {content.pricingIntroText}
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Primary Featured Special Offer Card */}
            <div className="bg-[#EAF7EF] p-4 rounded-xl border-2 border-[#168A45] shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  Special Commercial Proposal for {proposal.instituteName}
                </h3>
                <span className="text-[10px] uppercase font-black bg-[#168A45] text-white px-2 py-0.5 rounded tracking-wider">
                  Primary Offer
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-[#0B5D2A] font-black text-lg sm:text-xl">
                  • {proposal.pricingType || 'School Premium'}: ₹{proposal.pricePerStudent} / student / year
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#D9E5DD] flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-600 font-semibold">
                  Total for {proposal.studentCount || 500} Enrolled Students:
                </span>
                <span className="font-black text-base sm:text-lg text-[#0B5D2A]">
                  {formatINR(proposal.totalAmount || (proposal.pricePerStudent * (proposal.studentCount || 500)))} / year
                </span>
              </div>
            </div>

            {/* Configured Multi-Tier Options Table */}
            {proposal.pricingItems && proposal.pricingItems.length > 1 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs bg-white text-xs">
                <div className="bg-slate-50 border-b border-gray-200 px-3.5 py-2 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Alternative Commercial Plans & Packages
                </div>
                <div className="divide-y divide-gray-100">
                  {proposal.pricingItems.map((item, idx) => (
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
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.description}</div>
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

            {/* Standard Pricing Breakdown from Master / Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-[#F7FAF8] p-3 rounded-xl border border-gray-200 text-xs">
                <h4 className="font-bold text-slate-900">Standard School Payment</h4>
                <p className="text-[#168A45] font-bold mt-0.5">
                  {content.pricingNotes.schoolPaymentNote}
                </p>
              </div>

              <div className="bg-[#F7FAF8] p-3 rounded-xl border border-gray-200 text-xs">
                <h4 className="font-bold text-slate-900">Standard Parent Payment</h4>
                <p className="text-[#168A45] font-bold mt-0.5">
                  {content.pricingNotes.parentPaymentNote}
                </p>
              </div>
            </div>

            {content.pricingNotes.trialOfferNote && (
              <div className="bg-[#F7FAF8] p-3 rounded-xl border border-gray-200 text-xs">
                <h4 className="font-bold text-slate-900">Introductory Trial Offer</h4>
                <p className="text-[#168A45] font-bold mt-0.5">
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
          </div>
        </div>

        <PageFooter pageNumber={12} companyName={companyName} />
      </div>

      {/* ========================================================================= */}
      {/* PAGE 13: 7. CONTACT INFORMATION */}
      {/* ========================================================================= */}
      <div className="proposal-page relative bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-[1080px] flex flex-col justify-between p-8 sm:p-12 shadow-sm">
        <TopRightWaves />
        <MysarLogo companyLogo={companyLogo} brandName={brandName} />

        <div className="my-auto py-6 space-y-5 max-w-2xl text-slate-700 text-xs sm:text-sm">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              7. Contact Information
            </h2>
            <p className="text-slate-500 mt-1">
              {content.contactIntroText}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900">{companyName}</h3>
              <div className="text-slate-600 mt-1 space-y-0.5">
                <p className="font-semibold text-slate-800">Address:</p>
                {content.officeAddressLines.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-slate-800">Phone:</p>
              <ul className="space-y-1 text-slate-700 pl-2">
                {content.contactPersons.map((p, idx) => (
                  <li key={idx}>
                    • <strong>{p.name}</strong> ({p.designation}): {p.phone}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold text-slate-800">Email:</p>
              <p className="text-[#168A45] font-bold">{content.contactEmail || settings?.email || 'support@casbiro.com'}</p>
            </div>

            <div className="pt-2">
              <h4 className="font-bold text-slate-900">Business & Implementation Support</h4>
              <p className="text-slate-500 text-xs mt-0.5">Our team is available to assist you with:</p>
              <ul className="pl-4 space-y-0.5 text-slate-600 mt-1">
                {content.supportPoints.map((sp, idx) => (
                  <li key={idx}>• {sp}</li>
                ))}
              </ul>
            </div>

            <div className="bg-[#F7FAF8] p-3 rounded-xl border border-gray-200 text-slate-600 text-xs">
              <p className="font-bold text-slate-800 mb-0.5">Closing Note</p>
              <p>
                {replacePlaceholders(content.closingNote)}
              </p>
            </div>
          </div>
        </div>

        <PageFooter pageNumber={13} companyName={companyName} />
      </div>

      {/* ========================================================================= */}
      {/* PAGE 14: 8. CONCLUSION & SIGNATORY ACCEPTANCE */}
      {/* ========================================================================= */}
      <div className="proposal-page relative bg-white border border-gray-200 rounded-2xl overflow-hidden min-h-[1080px] flex flex-col justify-between p-8 sm:p-12 shadow-sm">
        <TopRightWaves />
        <MysarLogo companyLogo={companyLogo} brandName={brandName} />

        <div className="my-auto py-3 space-y-3.5 max-w-2xl text-slate-700 text-xs sm:text-sm leading-relaxed">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {content.conclusionTitle || '8. Conclusion'}
            </h2>
            <div className="space-y-2 mt-2">
              {content.conclusionParagraphs.map((para, idx) => (
                <p key={idx} className="text-xs sm:text-[13px] text-slate-600 leading-normal">
                  {replacePlaceholders(para)}
                </p>
              ))}
            </div>
          </div>

          {content.upcomingModules && content.upcomingModules.length > 0 && (
            <div className="space-y-1 pt-0.5">
              <p className="font-bold text-slate-900 text-xs">
                {content.upcomingModulesIntro}
              </p>
              <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 pl-1 text-slate-600 text-[11px]">
                {content.upcomingModules.map((item, idx) => (
                  <div key={idx} className="truncate">• {item}</div>
                ))}
              </div>
            </div>
          )}

          {content.finalCallToAction && (
            <p className="text-xs font-semibold text-slate-900 bg-[#EAF7EF] p-2.5 rounded-xl border border-[#D9E5DD]">
              {replacePlaceholders(content.finalCallToAction)}
            </p>
          )}

          {/* ========================================================================= */}
          {/* DEDICATED CLIENT SIGNATURE & AUTHORIZED SIGNATORY SECTION */}
          {/* ========================================================================= */}
          <div className="pt-2 space-y-2.5 border-t border-gray-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#168A45]" />
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                  {content.signatoryTitle || 'Proposal Acceptance & Signatories'}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {content.signatoryAgreementText ||
                  'By signing below, the authorized representatives of both parties acknowledge and accept the terms, scope of modules, implementation schedule, and commercial pricing presented in this proposal.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-0.5">
              {/* Client Signature Box */}
              <div className="bg-[#F7FAF8] border border-gray-300/80 rounded-xl p-3 flex flex-col justify-between space-y-2.5">
                <div className="space-y-1">
                  <div className="inline-flex items-center px-2 py-0.5 bg-slate-200 text-slate-800 text-[10px] font-bold rounded uppercase tracking-wider">
                    {content.clientSignatoryLabel || 'Client Signature'}
                  </div>
                  <p className="text-xs font-black text-slate-900 line-clamp-1">
                    {proposal.instituteName}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">Authorized Person: </span>
                    {proposal.contactPerson || 'Authorized Signatory'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-600">Designation: </span>
                    {content.clientSignatoryDesignation || 'Principal / Chairman / Trustee'}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-200">
                  <div className="h-9 border-b border-dashed border-slate-400 flex items-end justify-between pb-1">
                    <span className="text-[10px] text-slate-400 italic">Signature</span>
                    <span className="text-[9px] text-slate-400 font-medium">[ Institution Seal ]</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-600">
                    <span>Date: ______________</span>
                    <span>Place: ____________</span>
                  </div>
                </div>
              </div>

              {/* Authorized Signatory (Casbiro Solutions) Box */}
              <div className="bg-[#F7FAF8] border border-[#168A45]/30 rounded-xl p-3 flex flex-col justify-between space-y-2.5">
                <div className="space-y-1">
                  <div className="inline-flex items-center px-2 py-0.5 bg-[#EAF7EF] text-[#0B5D2A] text-[10px] font-bold rounded uppercase tracking-wider border border-[#D9E5DD]">
                    {content.companySignatoryLabel || 'Authorized Signatory'}
                  </div>
                  <p className="text-xs font-black text-slate-900 line-clamp-1">
                    {companyName}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">Representative: </span>
                    {proposal.createdBy || content.companySignatoryName || 'Sakeer Ali V'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-600">Designation: </span>
                    {content.companySignatoryDesignation || 'Director & Authorized Signatory'}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-200">
                  <div className="h-9 border-b border-dashed border-[#168A45]/70 flex items-end justify-between pb-1">
                    <span className="text-[10px] text-[#168A45] font-semibold italic">Authorized Signature</span>
                    <span className="text-[9px] text-[#168A45]/80 font-medium">[ Casbiro Official Seal ]</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-600">
                    <span>Date: {proposal.proposalDate || '______________'}</span>
                    <span>Kochi, Kerala</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center italic pt-0.5">
              This proposal constitutes a formal agreement framework upon signature by both authorized parties.
            </p>
          </div>
        </div>

        <PageFooter pageNumber={14} companyName={companyName} />
      </div>
    </div>
  );
};

