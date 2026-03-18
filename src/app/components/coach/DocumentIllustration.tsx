export function DocumentIllustration() {
  return (
    <svg 
      viewBox="0 0 240 240" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Background circle */}
      <circle cx="120" cy="120" r="100" fill="#F3F4F6" />
      
      {/* Document */}
      <rect x="70" y="60" width="100" height="120" rx="4" fill="white" stroke="#D1D5DB" strokeWidth="2"/>
      
      {/* Document lines */}
      <line x1="85" y1="80" x2="140" y2="80" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
      <line x1="85" y1="95" x2="155" y2="95" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
      <line x1="85" y1="110" x2="145" y2="110" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
      <line x1="85" y1="125" x2="150" y2="125" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
      
      {/* Pencil/Edit icon */}
      <g transform="translate(145, 140)">
        <path d="M0 20 L5 15 L20 0 L25 5 L10 20 L5 25 L0 20Z" fill="#3B82F6" />
        <path d="M0 20 L5 15 L10 20 L5 25 L0 20Z" fill="#2563EB" />
      </g>
    </svg>
  );
}
