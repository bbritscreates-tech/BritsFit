import React from 'react';

interface BritsFitLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  className?: string;
  usePng?: boolean;
  lightText?: boolean;
}

export const BritsFitLogo: React.FC<BritsFitLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  usePng = false,
  lightText = false,
}) => {
  const iconDimensions = {
    sm: { box: 32, text: 'text-lg', subtext: 'text-[9px]' },
    md: { box: 40, text: 'text-xl', subtext: 'text-[10px]' },
    lg: { box: 54, text: 'text-2xl', subtext: 'text-xs' },
    xl: { box: 72, text: 'text-3xl', subtext: 'text-sm' },
    '2xl': { box: 96, text: 'text-4xl', subtext: 'text-base' },
  }[size];

  const assetSrc = usePng ? '/assets/britsfit-icon.png' : '/assets/britsfit-logo.svg';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official BritsFit Runner & Turquoise B Emblem */}
      <img
        src={assetSrc}
        alt="BritsFit Logo"
        width={iconDimensions.box}
        height={iconDimensions.box}
        className="shrink-0 drop-shadow-md transition-transform duration-200 hover:scale-105 rounded-2xl object-contain"
        style={{ width: iconDimensions.box, height: iconDimensions.box }}
        loading="eager"
      />

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center">
            <span
              className={`font-black tracking-tight ${iconDimensions.text} ${
                lightText ? 'text-white' : 'text-[#102B55] dark:text-white'
              }`}
            >
              Brits<span className="text-[#1677E8]">Fit</span>
            </span>
          </div>
          {size !== 'sm' && (
            <span
              className={`uppercase font-bold tracking-widest text-[#12B8C7] ${iconDimensions.subtext} -mt-0.5`}
            >
              Personal &amp; Family
            </span>
          )}
        </div>
      )}
    </div>
  );
};
