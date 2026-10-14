import React from 'react';

interface BrandLogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'invoice';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  logoUrl?: string;
  businessName?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  variant = 'full',
  size = 'md',
  logoUrl,
  businessName = 'Mr. Farmer Corp.',
}) => {
  const [imgError, setImgError] = React.useState(false);
  const isCustomImage = Boolean(logoUrl && logoUrl !== '/logo.svg' && !imgError);

  // SVG emblem of the shield, sun, tree, and furrowed field lines matching user's logo
  const Emblem = () => (
    <svg
      viewBox="0 0 200 240"
      className="shrink-0 max-h-full max-w-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Gold shield gradients */}
        <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cf9f48" />
          <stop offset="50%" stopColor="#fad47a" />
          <stop offset="100%" stopColor="#9c6d28" />
        </linearGradient>

        <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        <linearGradient id="treeLeafGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#65a30d" />
          <stop offset="50%" stopColor="#3f6212" />
          <stop offset="100%" stopColor="#1e3a10" />
        </linearGradient>

        <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#784d29" />
          <stop offset="100%" stopColor="#382312" />
        </linearGradient>

        <filter id="shieldShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#2b1a09" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Shield Background */}
      <path
        d="M 30,20 L 170,20 Q 170,120 100,215 Q 30,120 30,20 Z"
        fill="#faf9f6"
        stroke="url(#goldBorder)"
        strokeWidth="6"
        strokeLinejoin="round"
        filter="url(#shieldShadow)"
      />
      {/* Inner thin border */}
      <path
        d="M 38,28 L 162,28 Q 162,118 100,202 Q 38,118 38,28 Z"
        fill="none"
        stroke="#d4af37"
        strokeWidth="1.8"
        opacity="0.8"
      />

      {/* Sun with Rays in the upper center */}
      <g transform="translate(100, 75)">
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => (
          <path
            key={angle}
            d="M 0,-34 L 5,-46 L 0,-49 L -5,-46 Z"
            fill="#d97706"
            transform={`rotate(${angle})`}
          />
        ))}
        <circle cx="0" cy="0" r="32" fill="url(#sunGrad)" stroke="#b45309" strokeWidth="2" />
        <circle cx="0" cy="0" r="28" fill="#fef08a" opacity="0.35" />
      </g>

      {/* Furrowed Earth Fields at bottom */}
      <path
        d="M 50,175 Q 100,165 150,175"
        stroke="#452a17"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 58,185 Q 100,174 142,185"
        stroke="#593920"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 68,195 Q 100,183 132,195"
        stroke="#6e472a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M 78,203 Q 100,192 122,203"
        stroke="#825633"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Tree Trunk & Roots */}
      <path
        d="M 96,120 L 93,165 Q 85,172 75,178 L 78,179 Q 95,174 100,166 Q 105,174 122,179 L 125,178 Q 115,172 107,165 L 104,120 Z"
        fill="url(#trunkGrad)"
        stroke="#27180d"
        strokeWidth="1.2"
      />
      {/* Bark texture lines */}
      <path d="M 97,130 Q 99,145 96,160" stroke="#8c5830" strokeWidth="1" strokeLinecap="round" />
      <path d="M 102,130 Q 101,148 104,162" stroke="#8c5830" strokeWidth="1" strokeLinecap="round" />

      {/* Tree Leaves / Foliage Clusters */}
      <g>
        <circle cx="100" cy="100" r="42" fill="#1e3a10" />
        <circle cx="75" cy="108" r="28" fill="#1e3a10" />
        <circle cx="125" cy="108" r="28" fill="#1e3a10" />

        <circle cx="100" cy="92" r="34" fill="#365314" stroke="#1c2d0c" strokeWidth="1" />
        <circle cx="72" cy="106" r="24" fill="#3f6212" stroke="#1c2d0c" strokeWidth="1" />
        <circle cx="128" cy="106" r="24" fill="#3f6212" stroke="#1c2d0c" strokeWidth="1" />
        <circle cx="82" cy="85" r="22" fill="#4d7c0f" stroke="#1c2d0c" strokeWidth="1" />
        <circle cx="118" cy="85" r="22" fill="#4d7c0f" stroke="#1c2d0c" strokeWidth="1" />
        <circle cx="100" cy="74" r="20" fill="#65a30d" stroke="#1c2d0c" strokeWidth="1" />

        <path
          d="M 92,62 Q 100,56 108,62 Q 114,75 108,82 Q 100,85 92,82 Q 86,74 92,62 Z"
          fill="#84cc16"
          stroke="#365314"
          strokeWidth="1"
        />
        <path
          d="M 74,80 Q 80,72 88,76 Q 92,88 84,94 Q 76,96 72,88 Z"
          fill="#84cc16"
          stroke="#365314"
          strokeWidth="0.8"
        />
        <path
          d="M 126,80 Q 120,72 112,76 Q 108,88 116,94 Q 124,96 128,88 Z"
          fill="#84cc16"
          stroke="#365314"
          strokeWidth="0.8"
        />
        <circle cx="100" cy="105" r="16" fill="#3f6212" opacity="0.9" />
      </g>
    </svg>
  );

  const iconSizes = {
    sm: 'w-7 h-8',
    md: 'w-9 h-11',
    lg: 'w-12 h-14',
    xl: 'w-16 h-20',
  };

  const renderVisual = () => {
    if (isCustomImage && logoUrl) {
      return (
        <img
          src={logoUrl}
          alt={businessName}
          onError={() => setImgError(true)}
          className="max-h-full max-w-full object-contain rounded-md"
        />
      );
    }
    return <Emblem />;
  };

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${iconSizes[size]} ${className}`}>
        {renderVisual()}
      </div>
    );
  }

  if (variant === 'invoice') {
    return (
      <div className={`flex items-center gap-3.5 ${className}`}>
        <div className="w-14 h-16 shrink-0 flex items-center justify-center">
          {renderVisual()}
        </div>
        <div>
          <h1
            className="text-xl sm:text-2xl font-serif font-black tracking-tight leading-tight"
            style={{ color: '#3d2514', fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {businessName}
          </h1>
          <p className="text-[10px] font-medium tracking-wide uppercase text-amber-800/80">
            Agricultural & Farm Solutions
          </p>
        </div>
      </div>
    );
  }

  // Full default variant with emblem + stylized text
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-9 h-11 shrink-0 flex items-center justify-center">
        {renderVisual()}
      </div>
      <div className="leading-none">
        <div
          className="text-base font-serif font-extrabold tracking-tight text-white"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          {businessName}
        </div>
        <div className="text-[10px] text-amber-400 font-mono tracking-wide mt-1">
          GST Billing & Accounts
        </div>
      </div>
    </div>
  );
};
