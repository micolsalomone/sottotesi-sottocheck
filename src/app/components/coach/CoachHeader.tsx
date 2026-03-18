import { ChevronDown } from 'lucide-react';

const svgPaths = {
  p1cfa5b00: '',
  p3e8d2c00: '',
  p33ac6980: '',
  p58d4000: '',
  p21ee900: '',
  p1633e500: '',
  p2cfad780: '',
  p68c1d00: '',
};

export function CoachHeader() {
  return (
    <header
      className="h-[72px] flex items-center justify-between px-[32px] bg-[var(--background)] border-b border-[var(--border)] shrink-0"
    >
      {/* Logo */}
      <div className="h-[38px] w-[122px] overflow-clip relative">
        <LogoSvg />
      </div>

      {/* User pill */}
      <div className="flex items-center gap-[10px]">
        <span
          className="text-[var(--muted-foreground)]"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-regular)',
          }}
        >
          coach
        </span>
        <div className="flex items-center gap-[8px] bg-[var(--muted)] px-[12px] h-[33px]" style={{ borderRadius: 'var(--radius-badge)' }}>
          <div className="relative w-[24px] h-[24px] shrink-0">
            <svg className="block w-full h-full" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="12" fill="var(--accent)" />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-[var(--accent-foreground)]"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '9px',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              MB
            </span>
          </div>
          <span
            className="text-[var(--foreground)]"
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 'var(--text-label)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            Marco Bianchi
          </span>
          <ChevronDown className="w-[14px] h-[14px] text-[var(--foreground)]" />
        </div>
      </div>
    </header>
  );
}

function LogoSvg() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-[15.45%_47.44%_6.12%_23.23%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 35.7794 29.802">
          <path d={svgPaths.p1cfa5b00} fill="var(--foreground)" />
        </svg>
      </div>
      <div className="absolute inset-[0_82.53%_2.99%_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.3159 36.8618">
          <path d={svgPaths.p3e8d2c00} fill="var(--foreground)" />
        </svg>
      </div>
      <div className="absolute inset-[30.16%_36.98%_3.25%_45.25%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.6699 25.3064">
          <path d={svgPaths.p33ac6980} fill="var(--foreground)" />
        </svg>
      </div>
      <div className="absolute inset-[32.69%_68.2%_6.27%_14.35%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.2792 23.1941">
          <path d={svgPaths.p58d4000} fill="var(--foreground)" />
        </svg>
      </div>
      <div className="absolute inset-[13.83%_4.79%_1.1%_82.42%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.5998 32.3254">
          <path d={svgPaths.p21ee900} fill="var(--foreground)" />
        </svg>
      </div>
      <div className="absolute inset-[27.19%_18.49%_0.35%_69.01%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.2501 27.5314">
          <path d={svgPaths.p1633e500} fill="var(--foreground)" />
        </svg>
      </div>
      <div className="absolute inset-[16.68%_25.74%_2.13%_54.62%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.9583 30.8547">
          <path d={svgPaths.p2cfad780} fill="var(--foreground)" />
        </svg>
      </div>
      <div className="absolute inset-[17.48%_0_0.05%_96.28%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.53642 31.3353">
          <path d={svgPaths.p68c1d00} fill="var(--foreground)" />
        </svg>
      </div>
    </div>
  );
}
