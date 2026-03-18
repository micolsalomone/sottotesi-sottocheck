import clsx from "clsx";
import svgPaths from "./svg-6ykurhp7ya";

function Wrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[14px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        {children}
      </svg>
    </div>
  );
}

function MoreVertical() {
  return (
    <div className="absolute left-[8px] size-[16px] top-[8px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="MoreVertical">
          <path d={svgPaths.p36e45a00} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p150f5b00} id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p2d6e5280} id="Vector_3" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}
type Pencil1Props = {
  additionalClassNames?: string;
};

function Pencil1({ additionalClassNames = "" }: Pencil1Props) {
  return (
    <div className={clsx("absolute size-[10px] top-[5.5px]", additionalClassNames)}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g clipPath="url(#clip0_110_3447)" id="Pencil" opacity="0.4">
          <path d={svgPaths.pd5c7f00} id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d="M6.25 2.08333L7.91667 3.75" id="Vector_2" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
        <defs>
          <clipPath id="clip0_110_3447">
            <rect fill="white" height="10" width="10" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}
type SpanText3Props = {
  text: string;
  additionalClassNames?: string;
};

function SpanText3({ text, additionalClassNames = "" }: SpanText3Props) {
  return (
    <div className="absolute h-[21px] left-[16px] top-[21px] w-[53.609px]">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[21px] left-0 not-italic text-[#0a0a0a] text-[14px] top-0 whitespace-nowrap">{text}</p>
      <Pencil additionalClassNames="left-[41.61px]" />
    </div>
  );
}
type TdText3Props = {
  text: string;
};

function TdText3({ text }: TdText3Props) {
  return (
    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1539.86px] top-0 w-[120.047px]">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-[12px] not-italic text-[#717680] text-[14px] top-[21px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type SpanText2Props = {
  text: string;
};

function SpanText2({ text }: SpanText2Props) {
  return (
    <div className="absolute h-[21px] left-[16px] top-[21px] w-[28px]">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#717680] text-[14px] top-0 whitespace-nowrap">{text}</p>
      <div className="absolute left-[18px] size-[10px] top-[5.5px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <g clipPath="url(#clip0_110_3463)" id="Pencil" opacity="0.4">
            <path d={svgPaths.pd5c7f00} id="Vector" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
            <path d="M6.25 2.08333L7.91667 3.75" id="Vector_2" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          </g>
          <defs>
            <clipPath id="clip0_110_3463">
              <rect fill="white" height="10" width="10" />
            </clipPath>
          </defs>
        </svg>
      </div>
    </div>
  );
}
type SpanText1Props = {
  text: string;
  additionalClassNames?: string;
};

function SpanText1({ text, additionalClassNames = "" }: SpanText1Props) {
  return (
    <div className="absolute h-[21px] left-[16px] top-[21px] w-[51.984px]">
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[21px] left-0 not-italic text-[#0a0a0a] text-[14px] top-0 whitespace-nowrap">{text}</p>
      <Pencil additionalClassNames="left-[39.98px]" />
    </div>
  );
}
type PencilProps = {
  additionalClassNames?: string;
};

function Pencil({ additionalClassNames = "" }: PencilProps) {
  return (
    <div className={clsx("absolute size-[12px] top-[4.5px]", additionalClassNames)}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g clipPath="url(#clip0_110_3454)" id="Pencil" opacity="0.5">
          <path d={svgPaths.p27b3900} id="Vector" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 2.5L9.5 4.5" id="Vector_2" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <defs>
          <clipPath id="clip0_110_3454">
            <rect fill="white" height="12" width="12" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}
type TdText2Props = {
  text: string;
  additionalClassNames?: string;
};

function TdText2({ text, additionalClassNames = "" }: TdText2Props) {
  return (
    <div className={clsx("absolute border-[#e5e7eb] border-solid border-t h-[65px] top-0", additionalClassNames)}>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-[16px] not-italic text-[#0a0a0a] text-[14px] top-[21px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type TdText1Props = {
  text: string;
};

function TdText1({ text }: TdText1Props) {
  return (
    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[146.53px] top-0 w-[157px]">
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[16px] not-italic text-[#0a0a0a] text-[16px] top-[18.5px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type TdTextProps = {
  text: string;
  additionalClassNames?: string;
};

function TdText({ text, additionalClassNames = "" }: TdTextProps) {
  return (
    <div className={clsx("absolute border-[#e5e7eb] border-solid border-t h-[65px] top-0", additionalClassNames)}>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-[16px] not-italic text-[#717680] text-[14px] top-[21px] whitespace-nowrap">{text}</p>
    </div>
  );
}

function ChevronsUpDown() {
  return (
    <Wrapper>
      <g id="ChevronsUpDown" opacity="0.5">
        <path d={svgPaths.p5d39000} id="Vector" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
        <path d={svgPaths.p35591e00} id="Vector_2" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
      </g>
    </Wrapper>
  );
}
type SpanTextProps = {
  text: string;
  additionalClassNames?: string;
};

function SpanText({ text, additionalClassNames = "" }: SpanTextProps) {
  return (
    <div className={clsx("h-[21px] relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-0 not-italic text-[#717680] text-[14px] top-0 tracking-[0.7px] uppercase whitespace-nowrap">{text}</p>
      </div>
    </div>
  );
}

export default function Container() {
  return (
    <div className="bg-white relative rounded-[8px] size-full" data-name="Container">
      <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] size-full">
        <div className="h-[379px] overflow-clip relative shrink-0 w-full" data-name="Container">
          <div className="absolute h-[379px] left-0 top-0 w-[1928px]" data-name="table">
            <div className="absolute bg-[#f5f5f5] h-[53.5px] left-0 top-0 w-[1928px]" data-name="thead">
              <div className="absolute h-[53.5px] left-0 top-0 w-[1928px]" data-name="tr">
                <div className="absolute bg-[#f5f5f5] border-[#e5e7eb] border-b border-solid h-[53.5px] left-0 top-0 w-[52.328px]" data-name="th">
                  <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[17px]" data-name="Checkbox" />
                  <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[46.33px] top-0 w-[6px]" data-name="div" />
                </div>
                <div className="absolute bg-[#f5f5f5] border-[#e5e7eb] border-b border-solid h-[53.5px] left-[52.33px] top-0 w-[94.203px]" data-name="th">
                  <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[16px] not-italic text-[#717680] text-[14px] top-[16px] tracking-[0.7px] uppercase whitespace-nowrap">Lav.</p>
                  <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[88.2px] top-0 w-[6px]" data-name="div" />
                </div>
                <div className="absolute bg-[#f5f5f5] border-[#e5e7eb] border-b border-solid h-[53.5px] left-[146.53px] top-0 w-[157px]" data-name="th">
                  <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] top-[16px] w-[125px]" data-name="div">
                    <SpanText text="Coach" additionalClassNames="w-[54.094px]" />
                    <ChevronsUpDown />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[151px] top-0 w-[6px]" data-name="div" />
                </div>
                <div className="absolute bg-[#f5f5f5] border-[#e5e7eb] border-b border-solid h-[53.5px] left-[303.53px] top-0 w-[157px]" data-name="th">
                  <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] top-[16px] w-[125px]" data-name="div">
                    <SpanText text="Studente" additionalClassNames="w-[80.797px]" />
                    <ChevronsUpDown />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[151px] top-0 w-[6px]" data-name="div" />
                </div>
                <div className="absolute bg-[#f5f5f5] border-[#e5e7eb] border-b border-solid h-[53.5px] left-[460.53px] top-0 w-[188.406px]" data-name="th">
                  <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[16px] not-italic text-[#717680] text-[14px] top-[16px] tracking-[0.7px] uppercase whitespace-nowrap">Servizio</p>
                  <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[182.41px] top-0 w-[6px]" data-name="div" />
                </div>
                <div className="absolute bg-[#f5f5f5] border-[#e5e7eb] border-b border-solid h-[53.5px] left-[648.94px] top-0 w-[127.734px]" data-name="th">
                  <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[16px] not-italic text-[#717680] text-[14px] top-[16px] tracking-[0.7px] uppercase whitespace-nowrap">Stato lav.</p>
                  <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[121.73px] top-0 w-[6px]" data-name="div" />
                </div>
                <div className="absolute bg-[#f5f5f5] border-[#e5e7eb] border-b border-solid h-[53.5px] left-[776.67px] top-0 w-[147.781px]" data-name="th">
                  <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] top-[16px] w-[115.781px]" data-name="div">
                    <SpanText text="Compenso" additionalClassNames="w-[87.188px]" />
                    <ChevronsUpDown />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[141.78px] top-0 w-[6px]" data-name="div" />
                </div>
                <div className="absolute bg-[#f5f5f5] border-[#e5e7eb] border-b border-solid h-[53.5px] left-[924.45px] top-0 w-[120.328px]" data-name="th">
                  <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[16px] not-italic text-[#717680] text-[14px] top-[16px] tracking-[0.7px] uppercase whitespace-nowrap">N. Notula</p>
                  <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[114.33px] top-0 w-[6px]" data-name="div" />
                </div>
                <div className="absolute bg-[#f5f5f5] border-[#e5e7eb] border-b border-solid h-[53.5px] left-[1044.78px] top-0 w-[167.313px]" data-name="th">
                  <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] top-[16px] w-[135.313px]" data-name="div">
                    <SpanText text="Data notula" additionalClassNames="w-[105.844px]" />
                    <ChevronsUpDown />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[161.31px] top-0 w-[6px]" data-name="div" />
                </div>
                <div className="absolute bg-[#f5f5f5] border-[#e5e7eb] border-b border-solid h-[53.5px] left-[1212.09px] top-0 w-[160.297px]" data-name="th">
                  <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] top-[16px] w-[128.297px]" data-name="div">
                    <SpanText text="Scad. 40gg" additionalClassNames="w-[92.406px]" />
                    <ChevronsUpDown />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[154.3px] top-0 w-[6px]" data-name="div" />
                </div>
                <div className="absolute bg-[#f5f5f5] border-[#e5e7eb] border-b border-solid h-[53.5px] left-[1372.39px] top-0 w-[167.469px]" data-name="th">
                  <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] top-[16px] w-[135.469px]" data-name="div">
                    <SpanText text="Stato pag." additionalClassNames="w-[87.828px]" />
                    <Wrapper>
                      <g id="ChevronUp">
                        <path d="M10.5 8.75L7 5.25L3.5 8.75" id="Vector" stroke="var(--stroke-0, #0BB63F)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                      </g>
                    </Wrapper>
                  </div>
                  <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[161.47px] top-0 w-[6px]" data-name="div" />
                </div>
                <div className="absolute bg-[#f5f5f5] border-[#e5e7eb] border-b border-solid h-[53.5px] left-[1539.86px] top-0 w-[120.047px]" data-name="th">
                  <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[16px] not-italic text-[#717680] text-[14px] top-[16px] tracking-[0.7px] uppercase whitespace-nowrap">Pagato il</p>
                  <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[114.05px] top-0 w-[6px]" data-name="div" />
                </div>
                <div className="absolute bg-[#f5f5f5] border-[#e5e7eb] border-b border-solid h-[53.5px] left-[1659.91px] top-0 w-[180.031px]" data-name="th">
                  <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[16px] not-italic text-[#717680] text-[14px] top-[16px] tracking-[0.7px] uppercase whitespace-nowrap">Rif. pag.</p>
                  <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[174.03px] top-0 w-[6px]" data-name="div" />
                </div>
              </div>
            </div>
            <div className="absolute h-[325px] left-0 top-[53.5px] w-[1928px]" data-name="tbody">
              <div className="absolute border-[#e5e7eb] border-b border-solid h-[65px] left-0 top-0 w-[1928px]" data-name="tr">
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-0 w-[52.328px]" data-name="td">
                  <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                </div>
                <TdText text="SS-117" additionalClassNames="left-[52.33px] w-[94.203px]" />
                <TdText1 text="Marco Bianchi" />
                <TdText2 text="Luca Neri" additionalClassNames="left-[303.53px] w-[157px]" />
                <TdText text="Coaching Plus" additionalClassNames="left-[460.53px] w-[188.406px]" />
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[648.94px] top-0 w-[127.734px]" data-name="td">
                  <div className="absolute h-[21px] left-[16px] top-[21.75px] w-[62.984px]" data-name="span">
                    <div className="absolute bg-[#717680] left-0 rounded-[4px] size-[8px] top-[6.5px]" data-name="Text" />
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-[14px] not-italic text-[#717680] text-[14px] top-0 whitespace-nowrap">paused</p>
                  </div>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[776.67px] top-0 w-[147.781px]" data-name="td">
                  <SpanText1 text="€720" />
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[924.45px] top-0 w-[120.328px]" data-name="td">
                  <SpanText2 text="—" />
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1044.78px] top-0 w-[167.313px]" data-name="td">
                  <SpanText2 text="—" />
                </div>
                <TdText text="—" additionalClassNames="left-[1212.09px] w-[160.297px]" />
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1372.39px] top-0 w-[167.469px]" data-name="td">
                  <div className="absolute bg-[#f5f5f5] h-[27px] left-[16px] rounded-[8px] top-[18px] w-[128px]" data-name="select">
                    <div className="absolute left-[-1709.39px] size-0 top-[-755.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-755.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-755.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-755.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-755.69px]" data-name="option" />
                  </div>
                </div>
                <TdText3 text="—" />
                <TdText text="—" additionalClassNames="left-[1659.91px] w-[180.031px]" />
              </div>
              <div className="absolute border-[#e5e7eb] border-b border-solid h-[65px] left-0 top-[65px] w-[1928px]" data-name="tr">
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-0 w-[52.328px]" data-name="td">
                  <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                </div>
                <TdText text="SS-101" additionalClassNames="left-[52.33px] w-[94.203px]" />
                <TdText1 text="Martina Rossi" />
                <TdText2 text="Giulia Verdi" additionalClassNames="left-[303.53px] w-[157px]" />
                <TdText text="Coaching" additionalClassNames="left-[460.53px] w-[188.406px]" />
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[648.94px] top-0 w-[127.734px]" data-name="td">
                  <div className="absolute h-[21px] left-[16px] top-[21.75px] w-[51.609px]" data-name="span">
                    <div className="absolute bg-[#2e90fa] left-0 rounded-[4px] size-[8px] top-[6.5px]" data-name="Text" />
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-[14px] not-italic text-[#2e90fa] text-[14px] top-0 whitespace-nowrap">Attiva</p>
                  </div>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[776.67px] top-0 w-[147.781px]" data-name="td">
                  <SpanText3 text="€480" />
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[924.45px] top-0 w-[120.328px]" data-name="td">
                  <div className="absolute h-[21px] left-[16px] top-[21px] w-[68.375px]" data-name="span">
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#0a0a0a] text-[14px] top-0 whitespace-nowrap">14/2026</p>
                    <Pencil1 additionalClassNames="left-[58.38px]" />
                  </div>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1044.78px] top-0 w-[167.313px]" data-name="td">
                  <div className="absolute h-[21px] left-[16px] top-[21px] w-[90.578px]" data-name="span">
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#0a0a0a] text-[14px] top-0 whitespace-nowrap">10/02/2026</p>
                    <Pencil1 additionalClassNames="left-[80.58px]" />
                  </div>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1212.09px] top-0 w-[160.297px]" data-name="td">
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[0] left-[16px] not-italic text-[#0a0a0a] text-[0px] top-[21px] whitespace-nowrap">
                    <span className="leading-[21px] text-[14px]">22/03/2026</span>
                    <span className="leading-[16.5px] text-[#717680] text-[11px]">(-16gg)</span>
                  </p>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1372.39px] top-0 w-[167.469px]" data-name="td">
                  <div className="absolute bg-[#2e90fa] h-[27px] left-[16px] rounded-[8px] top-[18px] w-[128px]" data-name="select">
                    <div className="absolute left-[-1709.39px] size-0 top-[-820.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-820.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-820.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-820.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-820.69px]" data-name="option" />
                  </div>
                </div>
                <TdText3 text="—" />
                <TdText text="—" additionalClassNames="left-[1659.91px] w-[180.031px]" />
              </div>
              <div className="absolute border-[#e5e7eb] border-b border-solid h-[65px] left-0 top-[130px] w-[1928px]" data-name="tr">
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-0 w-[52.328px]" data-name="td">
                  <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                </div>
                <TdText text="SS-110" additionalClassNames="left-[52.33px] w-[94.203px]" />
                <TdText1 text="Elena Ferretti" />
                <TdText2 text="Francesca Moretti" additionalClassNames="left-[303.53px] w-[157px]" />
                <TdText text="Coaching Plus" additionalClassNames="left-[460.53px] w-[188.406px]" />
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[648.94px] top-0 w-[127.734px]" data-name="td">
                  <div className="absolute h-[21px] left-[16px] top-[21.75px] w-[51.609px]" data-name="span">
                    <div className="absolute bg-[#2e90fa] left-0 rounded-[4px] size-[8px] top-[6.5px]" data-name="Text" />
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-[14px] not-italic text-[#2e90fa] text-[14px] top-0 whitespace-nowrap">Attiva</p>
                  </div>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[776.67px] top-0 w-[147.781px]" data-name="td">
                  <SpanText1 text="€720" />
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[924.45px] top-0 w-[120.328px]" data-name="td">
                  <div className="absolute h-[21px] left-[16px] top-[21px] w-[61.953px]" data-name="span">
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#0a0a0a] text-[14px] top-0 whitespace-nowrap">5/2026</p>
                    <Pencil1 additionalClassNames="left-[51.95px]" />
                  </div>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1044.78px] top-0 w-[167.313px]" data-name="td">
                  <div className="absolute h-[21px] left-[16px] top-[21px] w-[87.219px]" data-name="span">
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#0a0a0a] text-[14px] top-0 whitespace-nowrap">15/01/2026</p>
                    <Pencil1 additionalClassNames="left-[77.22px]" />
                  </div>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1212.09px] top-0 w-[160.297px]" data-name="td">
                  <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[21px] left-[16px] not-italic text-[#f79009] text-[14px] top-[21px] whitespace-nowrap">24/02/2026</p>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1372.39px] top-0 w-[167.469px]" data-name="td">
                  <div className="absolute bg-[#f79009] h-[27px] left-[16px] rounded-[8px] top-[18px] w-[128px]" data-name="select">
                    <div className="absolute left-[-1709.39px] size-0 top-[-885.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-885.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-885.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-885.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-885.69px]" data-name="option" />
                  </div>
                </div>
                <TdText3 text="—" />
                <TdText text="—" additionalClassNames="left-[1659.91px] w-[180.031px]" />
              </div>
              <div className="absolute border-[#e5e7eb] border-b border-solid h-[65px] left-0 top-[195px] w-[1928px]" data-name="tr">
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-0 w-[52.328px]" data-name="td">
                  <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                </div>
                <TdText text="SS-125" additionalClassNames="left-[52.33px] w-[94.203px]" />
                <TdText1 text="Martina Rossi" />
                <TdText2 text="Alessandro Brun" additionalClassNames="left-[303.53px] w-[157px]" />
                <TdText text="Coaching" additionalClassNames="left-[460.53px] w-[188.406px]" />
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[648.94px] top-0 w-[127.734px]" data-name="td">
                  <div className="absolute h-[21px] left-[16px] top-[21.75px] w-[90.031px]" data-name="span">
                    <div className="absolute bg-[#0bb63f] left-0 rounded-[4px] size-[8px] top-[6.5px]" data-name="Text" />
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-[14px] not-italic text-[#0bb63f] text-[14px] top-0 whitespace-nowrap">Completata</p>
                  </div>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[776.67px] top-0 w-[147.781px]" data-name="td">
                  <SpanText3 text="€480" />
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[924.45px] top-0 w-[120.328px]" data-name="td">
                  <div className="absolute h-[21px] left-[16px] top-[21px] w-[70.594px]" data-name="span">
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#0a0a0a] text-[14px] top-0 whitespace-nowrap">88/2025</p>
                    <Pencil1 additionalClassNames="left-[60.59px]" />
                  </div>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1044.78px] top-0 w-[167.313px]" data-name="td">
                  <div className="absolute h-[21px] left-[16px] top-[21px] w-[89.625px]" data-name="span">
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#0a0a0a] text-[14px] top-0 whitespace-nowrap">22/12/2025</p>
                    <Pencil1 additionalClassNames="left-[79.63px]" />
                  </div>
                </div>
                <TdText2 text="31/01/2026" additionalClassNames="left-[1212.09px] w-[160.297px]" />
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1372.39px] top-0 w-[167.469px]" data-name="td">
                  <div className="absolute bg-[#0bb63f] h-[27px] left-[16px] rounded-[8px] top-[18px] w-[128px]" data-name="select">
                    <div className="absolute left-[-1709.39px] size-0 top-[-950.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-950.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-950.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-950.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-950.69px]" data-name="option" />
                  </div>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1539.86px] top-0 w-[120.047px]" data-name="td">
                  <div className="absolute h-[21px] left-[12px] top-[21px] w-[90.688px]" data-name="span">
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#0a0a0a] text-[14px] top-0 whitespace-nowrap">30/01/2026</p>
                    <Pencil1 additionalClassNames="left-[80.69px]" />
                  </div>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1659.91px] top-0 w-[180.031px]" data-name="td">
                  <div className="absolute h-[21px] left-[16px] overflow-clip top-[21px] w-[140px]" data-name="span">
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#0a0a0a] text-[14px] top-0 whitespace-nowrap">BON-2026-0130-ROSSI</p>
                    <Pencil1 additionalClassNames="left-[161.3px]" />
                  </div>
                </div>
              </div>
              <div className="absolute border-[#e5e7eb] border-b border-solid h-[65px] left-0 top-[260px] w-[1928px]" data-name="tr">
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-0 w-[52.328px]" data-name="td">
                  <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                </div>
                <TdText text="SS-088" additionalClassNames="left-[52.33px] w-[94.203px]" />
                <TdText1 text="Andrea Conti" />
                <TdText2 text="Sara Martini" additionalClassNames="left-[303.53px] w-[157px]" />
                <TdText text="Coaching" additionalClassNames="left-[460.53px] w-[188.406px]" />
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[648.94px] top-0 w-[127.734px]" data-name="td">
                  <div className="absolute h-[21px] left-[16px] top-[21.75px] w-[90.031px]" data-name="span">
                    <div className="absolute bg-[#0bb63f] left-0 rounded-[4px] size-[8px] top-[6.5px]" data-name="Text" />
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-[14px] not-italic text-[#0bb63f] text-[14px] top-0 whitespace-nowrap">Completata</p>
                  </div>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[776.67px] top-0 w-[147.781px]" data-name="td">
                  <SpanText3 text="€480" />
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[924.45px] top-0 w-[120.328px]" data-name="td">
                  <div className="absolute h-[21px] left-[16px] top-[21px] w-[71px]" data-name="span">
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#0a0a0a] text-[14px] top-0 whitespace-nowrap">62/2024</p>
                    <Pencil1 additionalClassNames="left-[61px]" />
                  </div>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1044.78px] top-0 w-[167.313px]" data-name="td">
                  <div className="absolute h-[21px] left-[16px] top-[21px] w-[87.359px]" data-name="span">
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#0a0a0a] text-[14px] top-0 whitespace-nowrap">10/01/2025</p>
                    <Pencil1 additionalClassNames="left-[77.36px]" />
                  </div>
                </div>
                <TdText2 text="19/02/2025" additionalClassNames="left-[1212.09px] w-[160.297px]" />
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1372.39px] top-0 w-[167.469px]" data-name="td">
                  <div className="absolute bg-[#0bb63f] h-[27px] left-[16px] rounded-[8px] top-[18px] w-[128px]" data-name="select">
                    <div className="absolute left-[-1709.39px] size-0 top-[-1015.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-1015.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-1015.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-1015.69px]" data-name="option" />
                    <div className="absolute left-[-1709.39px] size-0 top-[-1015.69px]" data-name="option" />
                  </div>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1539.86px] top-0 w-[120.047px]" data-name="td">
                  <div className="absolute h-[21px] left-[12px] top-[21px] w-[90.031px]" data-name="span">
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#0a0a0a] text-[14px] top-0 whitespace-nowrap">18/02/2025</p>
                    <Pencil1 additionalClassNames="left-[80.03px]" />
                  </div>
                </div>
                <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1659.91px] top-0 w-[180.031px]" data-name="td">
                  <div className="absolute h-[21px] left-[16px] overflow-clip top-[21px] w-[140px]" data-name="span">
                    <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#0a0a0a] text-[14px] top-0 whitespace-nowrap">BON-2025-0218-CONTI</p>
                    <Pencil1 additionalClassNames="left-[163.48px]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1839.94px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[53.5px] w-[88.063px]" data-name="td">
            <div className="absolute left-[28.03px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
              <MoreVertical />
            </div>
          </div>
          <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1839.94px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[118.5px] w-[88.063px]" data-name="td">
            <div className="absolute left-[28.03px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
              <MoreVertical />
            </div>
          </div>
          <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1839.94px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[183.5px] w-[88.063px]" data-name="td">
            <div className="absolute left-[28.03px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
              <MoreVertical />
            </div>
          </div>
          <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1839.94px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[248.5px] w-[88.063px]" data-name="td">
            <div className="absolute left-[28.03px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
              <MoreVertical />
            </div>
          </div>
          <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1839.94px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[313.5px] w-[88.063px]" data-name="td">
            <div className="absolute left-[28.03px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
              <MoreVertical />
            </div>
          </div>
          <div className="absolute bg-[#f5f5f5] border-[#e5e7eb] border-b border-solid h-[53.5px] left-[1839.94px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-0 w-[88.063px]" data-name="th">
            <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[16px] not-italic text-[#717680] text-[14px] top-[16px] tracking-[0.7px] uppercase whitespace-nowrap">Azioni</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
    </div>
  );
}