import clsx from "clsx";
import svgPaths from "./svg-mjihwyq004";
type Wrapper8Props = {
  additionalClassNames?: string;
};

function Wrapper8({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper8Props>) {
  return (
    <div className={additionalClassNames}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">{children}</div>
    </div>
  );
}
type Wrapper7Props = {
  additionalClassNames?: string;
  text: string;
};

function Wrapper7({ children, additionalClassNames = "", text }: React.PropsWithChildren<Wrapper7Props>) {
  return (
    <Wrapper8 additionalClassNames={clsx("flex-[1_0_0] min-h-px min-w-px relative", additionalClassNames)}>
      <div className="flex-[1_0_0] h-[24px] min-h-px min-w-px relative">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
          <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[#0a0a0a] text-[16px] top-[-1px] whitespace-nowrap">{text}</p>
        </div>
      </div>
    </Wrapper8>
  );
}
type Container9Props = {
  additionalClassNames?: string;
};

function Container9({ children, additionalClassNames = "" }: React.PropsWithChildren<Container9Props>) {
  return <Wrapper8 additionalClassNames={clsx("relative shrink-0", additionalClassNames)}>{children}</Wrapper8>;
}

function Container8({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex-[1_0_0] h-[44px] min-h-px min-w-px relative">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">{children}</div>
    </div>
  );
}
type Container7Props = {
  additionalClassNames?: string;
};

function Container7({ children, additionalClassNames = "" }: React.PropsWithChildren<Container7Props>) {
  return (
    <div className={clsx("flex-[1_0_0] min-h-px min-w-px relative", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center relative size-full">{children}</div>
    </div>
  );
}
type Container6Props = {
  additionalClassNames?: string;
};

function Container6({ children, additionalClassNames = "" }: React.PropsWithChildren<Container6Props>) {
  return (
    <div className={clsx("h-[21px] relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center pl-[16px] relative size-full">{children}</div>
    </div>
  );
}
type Wrapper6Props = {
  additionalClassNames?: string;
};

function Wrapper6({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper6Props>) {
  return (
    <div className={clsx("size-[12px]", additionalClassNames)}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        {children}
      </svg>
    </div>
  );
}
type Wrapper5Props = {
  additionalClassNames?: string;
};

function Wrapper5({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper5Props>) {
  return (
    <div className={clsx("size-[16px]", additionalClassNames)}>
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        {children}
      </svg>
    </div>
  );
}
type Wrapper4Props = {
  additionalClassNames?: string;
};

function Wrapper4({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper4Props>) {
  return (
    <div className={additionalClassNames}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">{children}</div>
    </div>
  );
}
type Wrapper3Props = {
  additionalClassNames?: string;
};

function Wrapper3({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper3Props>) {
  return <Wrapper4 additionalClassNames={clsx("relative shrink-0", additionalClassNames)}>{children}</Wrapper4>;
}
type Wrapper2Props = {
  additionalClassNames?: string;
};

function Wrapper2({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper2Props>) {
  return <Wrapper4 additionalClassNames={clsx("flex-[1_0_0] min-h-px min-w-px relative", additionalClassNames)}>{children}</Wrapper4>;
}
type Wrapper1Props = {
  additionalClassNames?: string;
};

function Wrapper1({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper1Props>) {
  return (
    <div className={additionalClassNames}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center pl-[16px] relative size-full">{children}</div>
    </div>
  );
}
type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({ children, additionalClassNames = "" }: React.PropsWithChildren<WrapperProps>) {
  return <Wrapper1 additionalClassNames={clsx("relative shrink-0", additionalClassNames)}>{children}</Wrapper1>;
}
type Container5Props = {
  additionalClassNames?: string;
};

function Container5({ additionalClassNames = "" }: Container5Props) {
  return (
    <Wrapper1 additionalClassNames={clsx("relative shrink-0 w-[203.375px]", additionalClassNames)}>
      <SpanText4 text="Starter Pack" additionalClassNames="w-[92.516px]" />
    </Wrapper1>
  );
}
type Container4Props = {
  additionalClassNames?: string;
};

function Container4({ additionalClassNames = "" }: Container4Props) {
  return (
    <Wrapper1 additionalClassNames={clsx("relative shrink-0 w-[184.891px]", additionalClassNames)}>
      <SpanText4 text="Sperimentale" additionalClassNames="w-[97.938px]" />
    </Wrapper1>
  );
}

function Container3() {
  return (
    <Wrapper additionalClassNames="h-[67px] w-[203.375px]">
      <Wrapper3 additionalClassNames="h-[21px] w-[14px]">
        <p className="absolute font-['Inter:Italic',sans-serif] font-normal italic leading-[21px] left-0 text-[#717680] text-[14px] top-0 whitespace-nowrap">{"—"}</p>
      </Wrapper3>
    </Wrapper>
  );
}
type Container2Props = {
  additionalClassNames?: string;
};

function Container2({ additionalClassNames = "" }: Container2Props) {
  return (
    <Wrapper1 additionalClassNames={clsx("relative shrink-0 w-[203.375px]", additionalClassNames)}>
      <SpanText4 text="Coaching" additionalClassNames="w-[76.813px]" />
    </Wrapper1>
  );
}
type Container1Props = {
  additionalClassNames?: string;
};

function Container1({ additionalClassNames = "" }: Container1Props) {
  return (
    <Wrapper1 additionalClassNames={clsx("relative shrink-0 w-[110.938px]", additionalClassNames)}>
      <div className="relative rounded-[8px] shrink-0 size-[32px]">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
          <Wrapper5 additionalClassNames="relative shrink-0">
            <g id="MoreVertical">
              <path d={svgPaths.p36e45a00} id="Vector" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
              <path d={svgPaths.p150f5b00} id="Vector_2" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
              <path d={svgPaths.p2d6e5280} id="Vector_3" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
            </g>
          </Wrapper5>
        </div>
      </div>
    </Wrapper1>
  );
}
type SpanText5Props = {
  text: string;
};

function SpanText5({ text }: SpanText5Props) {
  return (
    <Wrapper2 additionalClassNames="h-[21px]">
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#0a0a0a] text-[14px] top-0 whitespace-nowrap">{text}</p>
    </Wrapper2>
  );
}

function Calendar() {
  return (
    <Wrapper6 additionalClassNames="relative shrink-0">
      <g id="Calendar">
        <path d="M4 1V3" id="Vector" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 1V3" id="Vector_2" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" />
        <path d={svgPaths.p333d5300} id="Vector_3" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1.5 5H10.5" id="Vector_4" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </Wrapper6>
  );
}
type ContainerProps = {
  additionalClassNames?: string;
};

function Container({ additionalClassNames = "" }: ContainerProps) {
  return (
    <Wrapper1 additionalClassNames={clsx("relative shrink-0 w-[184.891px]", additionalClassNames)}>
      <SpanText4 text="Compilativa" additionalClassNames="w-[89.734px]" />
    </Wrapper1>
  );
}
type SpanText4Props = {
  text: string;
  additionalClassNames?: string;
};

function SpanText4({ text, additionalClassNames = "" }: SpanText4Props) {
  return (
    <div className={clsx("bg-white h-[26px] relative rounded-[16px] shrink-0", additionalClassNames)}>
      <div aria-hidden="true" className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center px-[11px] py-[4px] relative size-full">
        <p className="font-['Inter:Medium',sans-serif] font-medium leading-[18px] not-italic relative shrink-0 text-[#0a0a0a] text-[12px] whitespace-nowrap">{text}</p>
      </div>
    </div>
  );
}
type SpanText3Props = {
  text: string;
  additionalClassNames?: string;
};

function SpanText3({ text, additionalClassNames = "" }: SpanText3Props) {
  return (
    <Wrapper4 additionalClassNames={clsx("h-[18px] relative shrink-0", additionalClassNames)}>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[18px] left-0 not-italic text-[#717680] text-[12px] top-0 whitespace-nowrap">{text}</p>
    </Wrapper4>
  );
}
type SpanText2Props = {
  text: string;
  additionalClassNames?: string;
};

function SpanText2({ text, additionalClassNames = "" }: SpanText2Props) {
  return (
    <Wrapper4 additionalClassNames={clsx("bg-[rgba(46,144,250,0.12)] h-[18.5px] relative rounded-[10px] shrink-0", additionalClassNames)}>
      <div className="absolute left-[6px] size-[10px] top-[4.25px]">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <g clipPath="url(#clip0_56_331)" id="Bell">
            <path d={svgPaths.p1c107180} id="Vector" stroke="var(--stroke-0, #2E90FA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
            <path d={svgPaths.p1284d700} id="Vector_2" stroke="var(--stroke-0, #2E90FA)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          </g>
          <defs>
            <clipPath id="clip0_56_331">
              <rect fill="white" height="10" width="10" />
            </clipPath>
          </defs>
        </svg>
      </div>
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] left-[19px] not-italic text-[#2e90fa] text-[11px] top-px whitespace-nowrap">{text}</p>
    </Wrapper4>
  );
}

function SpanText1({ text }: SpanText1Props) {
  return (
    <div className="flex-[1_0_0] h-[24px] min-h-px min-w-px relative">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 not-italic text-[#0a0a0a] text-[16px] top-[-1px] whitespace-nowrap">{text}</p>
      </div>
    </div>
  );
}

function ChevronDown() {
  return (
    <Wrapper6 additionalClassNames="relative shrink-0">
      <g id="ChevronDown" opacity="0.3">
        <path d="M3 4.5L6 7.5L9 4.5" id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </Wrapper6>
  );
}
type SpanTextProps = {
  text: string;
  additionalClassNames?: string;
};

function SpanText({ text, additionalClassNames = "" }: SpanTextProps) {
  return (
    <Wrapper4 additionalClassNames={clsx("h-[21px] relative shrink-0", additionalClassNames)}>
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-0 not-italic text-[#717680] text-[14px] top-0 tracking-[0.7px] uppercase whitespace-nowrap">{text}</p>
    </Wrapper4>
  );
}
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return (
    <div className={clsx("bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full", additionalClassNames)}>
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-[24px] not-italic relative shrink-0 text-[#0a0a0a] text-[16px] whitespace-nowrap">{text}</p>
    </div>
  );
}

export default function Main() {
  return (
    <div className="content-stretch flex flex-col items-start relative size-full" data-name="main">
      <div className="h-[711.25px] relative shrink-0 w-full" data-name="div">
        <div className="content-stretch flex flex-col gap-[24px] items-start pt-[32px] px-[40px] relative size-full">
          <div className="content-stretch flex flex-col gap-[4px] h-[82px] items-start relative shrink-0 w-full" data-name="Container">
            <div className="h-[54px] relative shrink-0 w-full" data-name="h1">
              <p className="absolute font-['Alegreya:Bold',sans-serif] font-bold leading-[54px] left-0 text-[#0a0a0a] text-[36px] top-0 whitespace-nowrap">I Miei Studenti</p>
            </div>
            <div className="h-[24px] relative shrink-0 w-full" data-name="p">
              <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#717680] text-[16px] top-[-1px] whitespace-nowrap">Gestisci i percorsi di coaching dei tuoi studenti</p>
            </div>
          </div>
          <div className="h-[47.25px] relative shrink-0 w-full" data-name="Container">
            <div aria-hidden="true" className="absolute border-[#e5e7eb] border-b border-solid inset-0 pointer-events-none" />
            <div className="absolute h-[46.25px] left-0 top-0 w-[159.547px]" data-name="button">
              <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[66px] not-italic text-[#0a0a0a] text-[14px] text-center top-[12px] whitespace-nowrap">Percorsi attivi</p>
              <div className="absolute bg-[#0a0a0a] left-[119.55px] rounded-[10px] size-[20px] top-[14.25px]" data-name="span">
                <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] left-[10.17px] not-italic text-[11px] text-center text-white top-[1.75px] whitespace-nowrap">5</p>
              </div>
              <div className="absolute bg-[#0a0a0a] h-[2px] left-0 top-[44.25px] w-[159.547px]" data-name="div" />
            </div>
            <div className="absolute h-[46.25px] left-[159.55px] top-0 w-[175.078px]" data-name="button">
              <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[74.5px] not-italic text-[#717680] text-[14px] text-center top-[12px] whitespace-nowrap">Percorsi passati</p>
              <div className="absolute bg-[#f5f5f5] left-[135.08px] rounded-[10px] size-[20px] top-[14.25px]" data-name="span">
                <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] left-[10.11px] not-italic text-[#717680] text-[11px] text-center top-[1.75px] whitespace-nowrap">2</p>
              </div>
            </div>
            <div className="absolute h-[45px] left-[334.63px] top-[0.63px] w-[112.516px]" data-name="button">
              <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[56.5px] not-italic text-[#717680] text-[14px] text-center top-[12px] whitespace-nowrap">Calendario</p>
            </div>
          </div>
          <div className="h-[46px] relative shrink-0 w-full" data-name="Container">
            <div className="absolute bg-white h-[46px] left-0 rounded-[8px] top-0 w-[1632px]" data-name="Container">
              <div className="content-stretch flex items-center overflow-clip p-px relative rounded-[inherit] size-full">
                <div className="h-[16px] relative shrink-0 w-[48px]" data-name="Container">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[16px] relative size-full">
                    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Search">
                      <div className="absolute inset-[12.5%_20.83%_20.83%_12.5%]" data-name="Vector">
                        <div className="absolute inset-[-6.25%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                            <path d={svgPaths.p1b38bb40} id="Vector" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute inset-[69.58%_12.5%_12.5%_69.58%]" data-name="Vector">
                        <div className="absolute inset-[-23.26%]">
                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.2 4.2">
                            <path d={svgPaths.p3195c6c0} id="Vector" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-[1_0_0] h-[44px] min-h-px min-w-px relative" data-name="input">
                  <Text text="Cerca per nome..." additionalClassNames="overflow-clip rounded-[inherit]" />
                </div>
              </div>
              <div aria-hidden="true" className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[8px]" />
            </div>
            <div className="absolute h-[46px] left-[1648px] top-0 w-[203px]" data-name="Container">
              <div className="absolute bg-white border border-[#e5e7eb] border-solid h-[46px] left-0 rounded-[8px] top-0 w-[203px]" data-name="select">
                <div className="absolute left-[-1949px] size-0 top-[-282.25px]" data-name="option" />
                <div className="absolute left-[-1949px] size-0 top-[-282.25px]" data-name="option" />
                <div className="absolute left-[-1949px] size-0 top-[-282.25px]" data-name="option" />
                <div className="absolute left-[-1949px] size-0 top-[-282.25px]" data-name="option" />
              </div>
              <Wrapper5 additionalClassNames="absolute left-[175px] top-[15px]">
                <g id="ChevronDown">
                  <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                </g>
              </Wrapper5>
            </div>
          </div>
          <div className="bg-white h-[400px] relative rounded-[8px] shrink-0 w-full" data-name="Container">
            <div className="overflow-clip rounded-[inherit] size-full">
              <div className="content-stretch flex flex-col items-start p-px relative size-full">
                <div className="bg-[#f5f5f5] content-stretch flex flex-col h-[55px] items-start pb-px relative shrink-0 w-full" data-name="Container">
                  <div aria-hidden="true" className="absolute border-[#e5e7eb] border-b border-solid inset-0 pointer-events-none" />
                  <div className="content-stretch flex h-[54px] items-center relative shrink-0 w-full" data-name="Container">
                    <Container6 additionalClassNames="w-[332.813px]">
                      <SpanText text="Nome" additionalClassNames="w-[45.344px]" />
                      <Wrapper6 additionalClassNames="relative shrink-0">
                        <g id="ChevronUp">
                          <path d="M9 7.5L6 4.5L3 7.5" id="Vector" stroke="var(--stroke-0, #0A0A0A)" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                      </Wrapper6>
                    </Container6>
                    <Container6 additionalClassNames="w-[277.344px]">
                      <SpanText text="Corso di Laurea" additionalClassNames="w-[137.109px]" />
                      <ChevronDown />
                    </Container6>
                    <Container6 additionalClassNames="w-[184.891px]">
                      <SpanText text="Tipologia" additionalClassNames="w-[81.438px]" />
                      <ChevronDown />
                    </Container6>
                    <Container6 additionalClassNames="w-[203.375px]">
                      <SpanText text="Lavorazione" additionalClassNames="w-[106.25px]" />
                      <ChevronDown />
                    </Container6>
                    <Container6 additionalClassNames="w-[221.875px]">
                      <SpanText text="Stato" additionalClassNames="w-[48.563px]" />
                      <ChevronDown />
                    </Container6>
                    <Container6 additionalClassNames="w-[203.375px]">
                      <SpanText text="Inizio piano" additionalClassNames="w-[97.922px]" />
                      <ChevronDown />
                    </Container6>
                    <Container6 additionalClassNames="w-[203.375px]">
                      <SpanText text="Scadenza piano" additionalClassNames="w-[134.547px]" />
                      <ChevronDown />
                    </Container6>
                    <Wrapper additionalClassNames="h-0 w-[110.938px]">
                      <div className="shrink-0 size-0" data-name="span" />
                    </Wrapper>
                  </div>
                </div>
                <div className="content-stretch flex flex-col h-[343px] items-start relative shrink-0 w-full" data-name="Container">
                  <div className="content-stretch flex h-[69px] items-start pb-px relative shrink-0 w-full" data-name="Container">
                    <div aria-hidden="true" className="absolute border-[#e5e7eb] border-b border-solid inset-0 pointer-events-none" />
                    <Wrapper additionalClassNames="h-[68px] w-[332.813px]">
                      <Container9 additionalClassNames="h-[44px] w-[143.547px]">
                        <Container8>
                          <Container7 additionalClassNames="w-[143.547px]">
                            <SpanText1 text="Alex Johnson" />
                            <SpanText2 text="3" additionalClassNames="w-[31.906px]" />
                          </Container7>
                          <SpanText3 text="UniMI" additionalClassNames="w-[143.547px]" />
                        </Container8>
                      </Container9>
                    </Wrapper>
                    <div className="h-[68px] relative shrink-0 w-[277.344px]" data-name="Container">
                      <Text text="Letteratura Comparata" additionalClassNames="px-[16px] py-[12px]" />
                    </div>
                    <Container additionalClassNames="h-[68px]" />
                    <Wrapper additionalClassNames="h-[68px] w-[203.375px]">
                      <SpanText4 text="Coaching Plus" additionalClassNames="w-[104.406px]" />
                    </Wrapper>
                    <Wrapper additionalClassNames="h-[68px] w-[221.875px]">
                      <div className="h-[18px] relative shrink-0 w-[45.313px]" data-name="Container">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
                          <Wrapper2 additionalClassNames="w-[45.313px]">
                            <div className="absolute bg-[#0bb63f] left-0 rounded-[3px] size-[6px] top-[6px]" data-name="Text" />
                            <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[18px] left-[12px] not-italic text-[#0bb63f] text-[12px] top-0 whitespace-nowrap">Attivo</p>
                          </Wrapper2>
                        </div>
                      </div>
                    </Wrapper>
                    <Wrapper additionalClassNames="h-[68px] w-[203.375px]">
                      <div className="h-[21px] relative shrink-0 w-[93.797px]" data-name="Container">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
                          <Calendar />
                          <SpanText5 text="5 gen 2026" />
                        </div>
                      </div>
                    </Wrapper>
                    <Wrapper additionalClassNames="h-[68px] w-[203.375px]">
                      <div className="h-[21px] relative shrink-0 w-[90.484px]" data-name="Container">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
                          <Calendar />
                          <SpanText5 text="5 apr 2026" />
                        </div>
                      </div>
                    </Wrapper>
                    <Container1 additionalClassNames="h-[68px]" />
                  </div>
                  <div className="content-stretch flex h-[68px] items-start pb-px relative shrink-0 w-full" data-name="Container">
                    <div aria-hidden="true" className="absolute border-[#e5e7eb] border-b border-solid inset-0 pointer-events-none" />
                    <Wrapper additionalClassNames="h-[67px] w-[332.813px]">
                      <Container9 additionalClassNames="h-[24px] w-[101.109px]">
                        <div className="flex-[1_0_0] h-[24px] min-h-px min-w-px relative" data-name="Container">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
                            <Wrapper7 additionalClassNames="w-[101.109px]" text="Elena Ferrara" />
                          </div>
                        </div>
                      </Container9>
                    </Wrapper>
                    <div className="h-[67px] relative shrink-0 w-[277.344px]" data-name="Container">
                      <Text text="Scienze Politiche" additionalClassNames="px-[16px] py-[12px]" />
                    </div>
                    <Container additionalClassNames="h-[67px]" />
                    <Container2 additionalClassNames="h-[67px]" />
                    <Wrapper additionalClassNames="h-[67px] w-[221.875px]">
                      <div className="h-[38.5px] relative shrink-0 w-[142.422px]" data-name="Container">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-start relative size-full">
                          <Wrapper2 additionalClassNames="w-[142.422px]">
                            <div className="absolute bg-[#f79009] left-0 rounded-[3px] size-[6px] top-[6px]" data-name="Text" />
                            <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[18px] left-[12px] not-italic text-[#f79009] text-[12px] top-0 whitespace-nowrap">In attesa di pagamento</p>
                          </Wrapper2>
                          <Wrapper3 additionalClassNames="h-[16.5px] w-[142.422px]">
                            <Wrapper6 additionalClassNames="absolute left-0 top-[2.25px]">
                              <g id="AlertTriangle">
                                <path d={svgPaths.pbb9d080} id="Vector" stroke="var(--stroke-0, #F79009)" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M6 4.5V6.5" id="Vector_2" stroke="var(--stroke-0, #F79009)" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M6 8.5H6.005" id="Vector_3" stroke="var(--stroke-0, #F79009)" strokeLinecap="round" strokeLinejoin="round" />
                              </g>
                            </Wrapper6>
                            <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[16.5px] left-[16px] not-italic text-[#f79009] text-[11px] top-0 whitespace-nowrap">Timeline mancante</p>
                          </Wrapper3>
                        </div>
                      </div>
                    </Wrapper>
                    <Container3 />
                    <Container3 />
                    <Container1 additionalClassNames="h-[67px]" />
                  </div>
                  <div className="content-stretch flex h-[69px] items-start pb-px relative shrink-0 w-full" data-name="Container">
                    <div aria-hidden="true" className="absolute border-[#e5e7eb] border-b border-solid inset-0 pointer-events-none" />
                    <Wrapper additionalClassNames="h-[68px] w-[332.813px]">
                      <Container9 additionalClassNames="h-[44px] w-[126.5px]">
                        <Container8>
                          <Container7 additionalClassNames="w-[126.5px]">
                            <SpanText1 text="Giulia Verdi" />
                            <SpanText2 text="2" additionalClassNames="w-[31.781px]" />
                          </Container7>
                          <SpanText3 text="UniMI" additionalClassNames="w-[126.5px]" />
                        </Container8>
                      </Container9>
                    </Wrapper>
                    <div className="h-[68px] relative shrink-0 w-[277.344px]" data-name="Container">
                      <Text text="Magistrale Psicologia" additionalClassNames="px-[16px] py-[12px]" />
                    </div>
                    <Container4 additionalClassNames="h-[68px]" />
                    <Container2 additionalClassNames="h-[68px]" />
                    <Wrapper additionalClassNames="h-[68px] w-[221.875px]">
                      <div className="h-[18px] relative shrink-0 w-[45.313px]" data-name="Container">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
                          <Wrapper2 additionalClassNames="w-[45.313px]">
                            <div className="absolute bg-[#0bb63f] left-0 rounded-[3px] size-[6px] top-[6px]" data-name="Text" />
                            <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[18px] left-[12px] not-italic text-[#0bb63f] text-[12px] top-0 whitespace-nowrap">Attivo</p>
                          </Wrapper2>
                        </div>
                      </div>
                    </Wrapper>
                    <Wrapper additionalClassNames="h-[68px] w-[203.375px]">
                      <div className="h-[21px] relative shrink-0 w-[94.578px]" data-name="Container">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
                          <Calendar />
                          <SpanText5 text="10 dic 2025" />
                        </div>
                      </div>
                    </Wrapper>
                    <Wrapper additionalClassNames="h-[68px] w-[203.375px]">
                      <div className="h-[21px] relative shrink-0 w-[103.188px]" data-name="Container">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
                          <Calendar />
                          <SpanText5 text="15 mag 2026" />
                        </div>
                      </div>
                    </Wrapper>
                    <Container1 additionalClassNames="h-[68px]" />
                  </div>
                  <div className="content-stretch flex h-[69px] items-start pb-px relative shrink-0 w-full" data-name="Container">
                    <div aria-hidden="true" className="absolute border-[#e5e7eb] border-b border-solid inset-0 pointer-events-none" />
                    <Wrapper additionalClassNames="h-[68px] w-[332.813px]">
                      <Container9 additionalClassNames="h-[44px] w-[73.266px]">
                        <Container8>
                          <Wrapper7 additionalClassNames="w-[73.266px]" text="Luca Neri" />
                          <SpanText3 text="Sapienza" additionalClassNames="w-[73.266px]" />
                        </Container8>
                      </Container9>
                    </Wrapper>
                    <div className="h-[68px] relative shrink-0 w-[277.344px]" data-name="Container">
                      <Text text="Ingegneria Informatica" additionalClassNames="px-[16px] py-[12px]" />
                    </div>
                    <Container4 additionalClassNames="h-[68px]" />
                    <Container5 additionalClassNames="h-[68px]" />
                    <Wrapper additionalClassNames="h-[68px] w-[221.875px]">
                      <div className="h-[18px] relative shrink-0 w-[60.547px]" data-name="Container">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
                          <Wrapper2 additionalClassNames="w-[60.547px]">
                            <div className="absolute bg-[#717680] left-0 rounded-[3px] size-[6px] top-[6px]" data-name="Text" />
                            <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[18px] left-[12px] not-italic text-[#717680] text-[12px] top-0 whitespace-nowrap">In pausa</p>
                          </Wrapper2>
                        </div>
                      </div>
                    </Wrapper>
                    <Wrapper additionalClassNames="h-[68px] w-[203.375px]">
                      <div className="h-[21px] relative shrink-0 w-[98.359px]" data-name="Container">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
                          <Calendar />
                          <SpanText5 text="15 nov 2025" />
                        </div>
                      </div>
                    </Wrapper>
                    <Wrapper additionalClassNames="h-[68px] w-[203.375px]">
                      <div className="h-[21px] relative shrink-0 w-[99.656px]" data-name="Container">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
                          <Calendar />
                          <SpanText5 text="30 apr 2026" />
                        </div>
                      </div>
                    </Wrapper>
                    <Container1 additionalClassNames="h-[68px]" />
                  </div>
                  <div className="content-stretch flex h-[68px] items-start pb-px relative shrink-0 w-full" data-name="Container">
                    <div aria-hidden="true" className="absolute border-[#e5e7eb] border-b border-solid inset-0 pointer-events-none" />
                    <Wrapper additionalClassNames="h-[67px] w-[332.813px]">
                      <Container9 additionalClassNames="h-[24px] w-[129.75px]">
                        <div className="flex-[1_0_0] h-[24px] min-h-px min-w-px relative" data-name="Container">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
                            <Container7 additionalClassNames="w-[129.75px]">
                              <SpanText1 text="Sara Martini" />
                              <SpanText2 text="1" additionalClassNames="w-[29.578px]" />
                            </Container7>
                          </div>
                        </div>
                      </Container9>
                    </Wrapper>
                    <div className="h-[67px] relative shrink-0 w-[277.344px]" data-name="Container">
                      <Text text="Ingegneria Gestionale" additionalClassNames="px-[16px] py-[12px]" />
                    </div>
                    <Container4 additionalClassNames="h-[67px]" />
                    <Container5 additionalClassNames="h-[67px]" />
                    <Wrapper additionalClassNames="h-[67px] w-[221.875px]">
                      <div className="h-[18px] relative shrink-0 w-[45.313px]" data-name="Container">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
                          <Wrapper2 additionalClassNames="w-[45.313px]">
                            <div className="absolute bg-[#0bb63f] left-0 rounded-[3px] size-[6px] top-[6px]" data-name="Text" />
                            <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[18px] left-[12px] not-italic text-[#0bb63f] text-[12px] top-0 whitespace-nowrap">Attivo</p>
                          </Wrapper2>
                        </div>
                      </div>
                    </Wrapper>
                    <Wrapper additionalClassNames="h-[67px] w-[203.375px]">
                      <div className="h-[21px] relative shrink-0 w-[102.859px]" data-name="Container">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
                          <Calendar />
                          <SpanText5 text="20 gen 2026" />
                        </div>
                      </div>
                    </Wrapper>
                    <Wrapper additionalClassNames="h-[67px] w-[203.375px]">
                      <div className="h-[21px] relative shrink-0 w-[98.094px]" data-name="Container">
                        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[6px] items-center relative size-full">
                          <Calendar />
                          <SpanText5 text="20 giu 2026" />
                        </div>
                      </div>
                    </Wrapper>
                    <Container1 additionalClassNames="h-[67px]" />
                  </div>
                </div>
              </div>
            </div>
            <div aria-hidden="true" className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
          </div>
        </div>
      </div>
    </div>
  );
}