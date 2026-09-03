import React from 'react';

interface MysarBrandBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const MysarBrandBadge: React.FC<MysarBrandBadgeProps> = ({
  className = '',
  size = 'lg',
}) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-36 h-36',
    lg: 'w-56 h-56 xl:w-64 xl:h-64',
    xl: 'w-72 h-72',
  }[size];

  const iconSizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20 xl:w-24 xl:h-24',
    xl: 'w-28 h-28',
  }[size];

  const textSizes = {
    sm: 'text-base tracking-tight',
    md: 'text-xl tracking-tight',
    lg: 'text-3xl xl:text-4xl tracking-tight',
    xl: 'text-4xl tracking-tight',
  }[size];

  return (
    <div
      className={`rounded-full bg-white border-2 border-[#235E3F] flex flex-col items-center justify-center select-none shadow-xl shadow-black/5 relative ${sizeClasses} ${className}`}
    >
      {/* MYSAR Glyphed 'a' Logo Icon */}
      <svg
        viewBox="0 0 100 100"
        className={`${iconSizes} mb-1`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stylized rounded lowercase 'a' emblem */}
        <path
          d="M 50 12 
             C 30 12 16 26 16 46 
             C 16 66 30 84 50 84 
             C 62 84 72 78 78 69 
             L 78 82 
             C 78 84 80 85 82 85 
             L 86 85 
             C 88 85 90 83 90 81 
             L 90 34 
             C 90 20 74 12 50 12 Z"
          fill="#235E3F"
        />
        {/* Inner white checkmark / counter cut */}
        <path
          d="M 36 49 
             L 48 61 
             L 74 34"
          stroke="#FFFFFF"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* MYSAR lowercase wordmark with checkmark in 'a' */}
      <div className={`font-black text-[#235E3F] font-sans flex items-center leading-none ${textSizes}`}>
        <span className="tracking-tight">my</span>
        <span className="tracking-tight">s</span>
        <span className="relative inline-flex items-center justify-center">
          <span>a</span>
          {/* subtle white checkmark in letter 'a' */}
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none -mt-0.5">
            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white" fill="none">
              <path
                d="M5 12l4 4L19 7"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
        <span className="tracking-tight">r</span>
      </div>
    </div>
  );
};
