import React from 'react';

interface ZeroPassLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const ZeroPassLogo: React.FC<ZeroPassLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base font-bold',
    md: 'text-lg font-bold',
    lg: 'text-2xl font-bold',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Original Geometric ZeroPass Hexagonal Keymark */}
      <svg
        className={`${iconSizes[size]} text-indigo-600 transition-transform hover:scale-105 duration-200`}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2018/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill="#1E1B4B" />
        {/* Outer Zero loop */}
        <circle cx="16" cy="16" r="9" stroke="#818CF8" strokeWidth="2.2" strokeDasharray="4 2" />
        {/* Inner Pass shield / keyhole */}
        <path
          d="M16 11V18M13 15L16 12L19 15M13 21H19"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="16" r="2" fill="#6366F1" />
      </svg>

      {showText && (
        <span className={`${textSizes[size]} tracking-tight text-slate-900 font-semibold font-sans`}>
          Zero<span className="text-indigo-600 font-bold">Pass</span>
        </span>
      )}
    </div>
  );
};
