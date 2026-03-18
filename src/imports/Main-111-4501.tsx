import clsx from "clsx";
import svgPaths from "./svg-873p0kvqe9";
import imgSelect from "figma:asset/60b3f7a1339795410e4cd0fbcb214d5c9302077e.png";
type Container1Props = {
  additionalClassNames?: string;
};

function Container1({ children, additionalClassNames = "" }: React.PropsWithChildren<Container1Props>) {
  return (
    <div className={clsx("h-[46px] relative", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">{children}</div>
    </div>
  );
}
type ContainerProps = {
  additionalClassNames?: string;
};

function Container({ children, additionalClassNames = "" }: React.PropsWithChildren<ContainerProps>) {
  return (
    <div className={clsx("relative rounded-[8px] shrink-0 size-[40px]", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">{children}</div>
    </div>
  );
}

function Wrapper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        {children}
      </svg>
    </div>
  );
}

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
type ButtonText2Props = {
  text: string;
};

function ButtonText2({ text }: ButtonText2Props) {
  return (
    <div className="absolute bg-[#f79009] h-[29px] left-[16px] rounded-[16px] top-[17px] w-[80.969px]">
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[40px] not-italic text-[14px] text-center text-white top-[4px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type ButtonText1Props = {
  text: string;
};

function ButtonText1({ text }: ButtonText1Props) {
  return (
    <div className="absolute bg-[#fef3f2] h-[29px] left-[16px] rounded-[16px] top-[17px] w-[79.078px]">
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[40px] not-italic text-[#b42318] text-[14px] text-center top-[4px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type TdText4Props = {
  text: string;
  additionalClassNames?: string;
};

function TdText4({ text, additionalClassNames = "" }: TdText4Props) {
  return (
    <div className={clsx("absolute border-[#e5e7eb] border-solid border-t left-[1724.05px] top-[-1px] w-[107.922px]", additionalClassNames)}>
      <p className="-translate-x-1/2 absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-[53.95px] not-italic text-[#0a0a0a] text-[16px] text-center top-[18.5px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type ButtonTextProps = {
  text: string;
};

function ButtonText({ text }: ButtonTextProps) {
  return (
    <div className="absolute bg-[#0bb63f] h-[29px] left-[16px] rounded-[16px] top-[17px] w-[70.281px]">
      <p className="-translate-x-1/2 absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-[35.5px] not-italic text-[14px] text-center text-white top-[4px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type TdText3Props = {
  text: string;
  additionalClassNames?: string;
};

function TdText3({ text, additionalClassNames = "" }: TdText3Props) {
  return (
    <div className={clsx("absolute border-[#e5e7eb] border-solid border-t top-[-1px] w-[148.391px]", additionalClassNames)}>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-[16px] not-italic text-[#0a0a0a] text-[14px] top-[21px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type SpanText1Props = {
  text: string;
};

function SpanText1({ text }: SpanText1Props) {
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
type TdText2Props = {
  text: string;
  additionalClassNames?: string;
};

function TdText2({ text, additionalClassNames = "" }: TdText2Props) {
  return (
    <div className={clsx("absolute border-[#e5e7eb] border-solid border-t left-[685.31px] top-[-1px] w-[134.906px]", additionalClassNames)}>
      <p className="absolute font-['Inter:Bold',sans-serif] font-bold leading-[21px] left-[16px] not-italic text-[#0a0a0a] text-[14px] top-[21px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type Text1Props = {
  text: string;
  additionalClassNames?: string;
};

function Text1({ text, additionalClassNames = "" }: Text1Props) {
  return (
    <div className={additionalClassNames}>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-[16px] not-italic text-[#717680] text-[14px] top-[21px] whitespace-nowrap">{text}</p>
    </div>
  );
}
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return <Text1 text={text} additionalClassNames={clsx("absolute border-[#e5e7eb] border-solid border-t h-[64.5px] top-[-1px]", additionalClassNames)} />;
}
type TdText1Props = {
  text: string;
  additionalClassNames?: string;
};

function TdText1({ text, additionalClassNames = "" }: TdText1Props) {
  return <Text1 text={text} additionalClassNames={clsx("absolute border-[#e5e7eb] border-solid border-t h-[65px] top-[-1px]", additionalClassNames)} />;
}
type TdTextProps = {
  text: string;
  additionalClassNames?: string;
};

function TdText({ text, additionalClassNames = "" }: TdTextProps) {
  return (
    <div className={clsx("absolute border-[#e5e7eb] border-solid border-t left-[64.75px] overflow-clip top-[-1px] w-[242.828px]", additionalClassNames)}>
      <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-[16px] not-italic text-[#0a0a0a] text-[16px] top-[18.5px] whitespace-nowrap">{text}</p>
    </div>
  );
}

function ChevronsUpDown() {
  return (
    <Wrapper>
      <g id="ChevronsUpDown" opacity="0.4">
        <path d={svgPaths.p5d39000} id="Vector" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
        <path d={svgPaths.p35591e00} id="Vector_2" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
      </g>
    </Wrapper>
  );
}
type ContainerTextProps = {
  text: string;
  additionalClassNames?: string;
};

function ContainerText({ text, additionalClassNames = "" }: ContainerTextProps) {
  return (
    <div className={clsx("absolute h-[21px]", additionalClassNames)}>
      <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#717680] text-[14px] top-0 whitespace-nowrap">{text}</p>
    </div>
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

export default function Main() {
  return (
    <div className="content-stretch flex flex-col items-start px-[40px] relative size-full" data-name="main">
      <div className="h-[1646.188px] relative shrink-0 w-full" data-name="div">
        <div className="absolute h-[176.188px] left-0 top-[118px] w-[1915px]" data-name="Container">
          <div className="absolute bg-[#fef3f2] border-2 border-[#b42318] border-solid h-[176.188px] left-0 rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] top-0 w-[622.328px]" data-name="Container">
            <div className="absolute content-stretch flex h-[40px] items-center justify-between left-[24px] top-[24px] w-[570.328px]" data-name="Container">
              <div className="h-[21px] relative shrink-0 w-[71.891px]" data-name="span">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                  <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[21px] left-0 not-italic text-[#b42318] text-[14px] top-0 tracking-[0.7px] uppercase whitespace-nowrap">Scadute</p>
                </div>
              </div>
              <Container additionalClassNames="bg-[#b42318]">
                <Wrapper1>
                  <g id="AlertTriangle">
                    <path d={svgPaths.p377dab00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                    <path d="M10 7.5V10.8333" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                    <path d="M10 14.1667H10.0083" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                  </g>
                </Wrapper1>
              </Container>
            </div>
            <div className="absolute h-[43.188px] left-[24px] top-[80px] w-[570.328px]" data-name="Container">
              <p className="absolute font-['Alegreya:Bold',sans-serif] font-bold leading-[43.2px] left-0 text-[#b42318] text-[36px] top-0 whitespace-nowrap">€936,00</p>
            </div>
            <div className="absolute h-[21px] left-[24px] top-[127.19px] w-[570.328px]" data-name="Container">
              <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 not-italic text-[#b42318] text-[14px] top-0 whitespace-nowrap">2 rate</p>
            </div>
          </div>
          <div className="absolute bg-white border border-[#e5e7eb] border-solid h-[176.188px] left-[646.33px] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] top-0 w-[622.328px]" data-name="Container">
            <div className="absolute content-stretch flex h-[40px] items-center justify-between left-[24px] top-[24px] w-[572.328px]" data-name="Container">
              <SpanText text="In attesa" additionalClassNames="w-[78.781px]" />
              <Container additionalClassNames="bg-[#0bb63f]">
                <Wrapper1>
                  <g clipPath="url(#clip0_111_4513)" id="Clock">
                    <path d={svgPaths.p14d24500} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                    <path d="M10 5V10L13.3333 11.6667" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                  </g>
                  <defs>
                    <clipPath id="clip0_111_4513">
                      <rect fill="white" height="20" width="20" />
                    </clipPath>
                  </defs>
                </Wrapper1>
              </Container>
            </div>
            <div className="absolute h-[43.188px] left-[24px] top-[80px] w-[572.328px]" data-name="Container">
              <p className="absolute font-['Alegreya:Bold',sans-serif] font-bold leading-[43.2px] left-0 text-[#0a0a0a] text-[36px] top-0 whitespace-nowrap">€857,22</p>
            </div>
            <ContainerText text="3 rate" additionalClassNames="left-[24px] top-[127.19px] w-[572.328px]" />
          </div>
          <div className="absolute bg-white border border-[#e5e7eb] border-solid h-[176.188px] left-[1292.66px] rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)] top-0 w-[622.328px]" data-name="Container">
            <div className="absolute content-stretch flex h-[40px] items-center justify-between left-[24px] top-[24px] w-[572.328px]" data-name="Container">
              <SpanText text="Incassato" additionalClassNames="w-[86.703px]" />
              <Container additionalClassNames="bg-[#0bb63f]">
                <Wrapper1>
                  <g id="Check">
                    <path d={svgPaths.p32ddfd00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
                  </g>
                </Wrapper1>
              </Container>
            </div>
            <div className="absolute h-[43.188px] left-[24px] top-[80px] w-[572.328px]" data-name="Container">
              <p className="absolute font-['Alegreya:Bold',sans-serif] font-bold leading-[43.2px] left-0 text-[#0bb63f] text-[36px] top-0 whitespace-nowrap">€4054,44</p>
            </div>
            <ContainerText text="13 rate" additionalClassNames="left-[24px] top-[127.19px] w-[572.328px]" />
          </div>
        </div>
        <div className="absolute bg-white h-[1225px] left-0 rounded-[8px] top-[388.19px] w-[1915px]" data-name="Container">
          <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] size-full">
            <div className="h-[1223px] overflow-clip relative shrink-0 w-full" data-name="Container">
              <div className="absolute h-[1223px] left-0 top-0 w-[1913px]" data-name="table">
                <div className="absolute bg-[#f5f5f5] h-[53.5px] left-0 top-0 w-[1913px]" data-name="thead">
                  <div className="absolute bg-[#f5f5f5] h-[53.5px] left-0 top-0 w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-b border-solid h-[53.5px] left-0 top-0 w-[64.75px]" data-name="th">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[17px]" data-name="Checkbox" />
                      <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[60.75px] top-0 w-[4px]" data-name="div" />
                    </div>
                    <div className="absolute border-[#e5e7eb] border-b border-solid h-[53.5px] left-[64.75px] top-0 w-[242.828px]" data-name="th">
                      <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] top-[16px] w-[210.828px]" data-name="div">
                        <SpanText text="Studente" additionalClassNames="w-[80.797px]" />
                        <ChevronsUpDown />
                      </div>
                      <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[236.83px] top-0 w-[6px]" data-name="div" />
                    </div>
                    <div className="absolute border-[#e5e7eb] border-b border-solid h-[53.5px] left-[307.58px] top-0 w-[269.813px]" data-name="th">
                      <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] top-[16px] w-[237.813px]" data-name="div">
                        <SpanText text="Servizio" additionalClassNames="w-[69.172px]" />
                        <ChevronsUpDown />
                      </div>
                      <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[263.81px] top-0 w-[6px]" data-name="div" />
                    </div>
                    <div className="absolute border-[#e5e7eb] border-b border-solid h-[53.5px] left-[577.39px] top-0 w-[107.922px]" data-name="th">
                      <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] pr-[37.469px] top-[16px] w-[75.922px]" data-name="div">
                        <SpanText text="Rata" additionalClassNames="w-[38.453px]" />
                      </div>
                      <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[101.92px] top-0 w-[6px]" data-name="div" />
                    </div>
                    <div className="absolute border-[#e5e7eb] border-b border-solid h-[53.5px] left-[685.31px] top-0 w-[134.906px]" data-name="th">
                      <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] top-[16px] w-[102.906px]" data-name="div">
                        <SpanText text="Netto" additionalClassNames="w-[51.125px]" />
                        <ChevronsUpDown />
                      </div>
                      <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[128.91px] top-0 w-[6px]" data-name="div" />
                    </div>
                    <div className="absolute border-[#e5e7eb] border-b border-solid h-[53.5px] left-[820.22px] top-0 w-[134.906px]" data-name="th">
                      <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] pr-[51.234px] top-[16px] w-[102.906px]" data-name="div">
                        <SpanText text="Lordo" additionalClassNames="w-[51.672px]" />
                      </div>
                      <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[128.91px] top-0 w-[6px]" data-name="div" />
                    </div>
                    <div className="absolute border-[#e5e7eb] border-b border-solid h-[53.5px] left-[955.13px] top-0 w-[161.875px]" data-name="th">
                      <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] pr-[18.25px] top-[16px] w-[129.875px]" data-name="div">
                        <SpanText text="Data fattura" additionalClassNames="w-[111.625px]" />
                      </div>
                      <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[155.88px] top-0 w-[6px]" data-name="div" />
                    </div>
                    <div className="absolute border-[#e5e7eb] border-b border-solid h-[53.5px] left-[1117px] top-0 w-[148.391px]" data-name="th">
                      <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] top-[16px] w-[116.391px]" data-name="div">
                        <SpanText text="Scadenza" additionalClassNames="w-[82.563px]" />
                        <Wrapper>
                          <g id="ChevronUp">
                            <path d="M10.5 8.75L7 5.25L3.5 8.75" id="Vector" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                          </g>
                        </Wrapper>
                      </div>
                      <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[142.39px] top-0 w-[6px]" data-name="div" />
                    </div>
                    <div className="absolute border-[#e5e7eb] border-b border-solid h-[53.5px] left-[1265.39px] top-0 w-[148.391px]" data-name="th">
                      <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] top-[16px] w-[116.391px]" data-name="div">
                        <SpanText text="Stato" additionalClassNames="w-[48.563px]" />
                        <ChevronsUpDown />
                      </div>
                      <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[142.39px] top-0 w-[6px]" data-name="div" />
                    </div>
                    <div className="absolute border-[#e5e7eb] border-b border-solid h-[53.5px] left-[1413.78px] top-0 w-[148.391px]" data-name="th">
                      <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] pr-[39.031px] top-[16px] w-[116.391px]" data-name="div">
                        <SpanText text="Pagato il" additionalClassNames="w-[77.359px]" />
                      </div>
                      <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[142.39px] top-0 w-[6px]" data-name="div" />
                    </div>
                    <div className="absolute border-[#e5e7eb] border-b border-solid h-[53.5px] left-[1562.17px] top-0 w-[161.875px]" data-name="th">
                      <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] pr-[64.156px] top-[16px] w-[129.875px]" data-name="div">
                        <SpanText text="Metodo" additionalClassNames="w-[65.719px]" />
                      </div>
                      <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[155.88px] top-0 w-[6px]" data-name="div" />
                    </div>
                    <div className="absolute border-[#e5e7eb] border-b border-solid h-[53.5px] left-[1724.05px] top-0 w-[107.922px]" data-name="th">
                      <div className="absolute content-stretch flex h-[21px] items-center justify-between left-[16px] pr-[7.688px] top-[16px] w-[75.922px]" data-name="div">
                        <SpanText text="Fattura" additionalClassNames="w-[68.234px]" />
                      </div>
                      <div className="absolute border-[#e5e7eb] border-r-2 border-solid h-[53px] left-[101.92px] top-0 w-[6px]" data-name="div" />
                    </div>
                  </div>
                </div>
                <div className="absolute h-[1169.5px] left-0 top-[53.5px] w-[1913px]" data-name="tbody">
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-0 w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Sara Martini" additionalClassNames="h-[65px]" />
                    <TdText1 text="Coaching" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="1/3" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€312,00" additionalClassNames="h-[65px]" />
                    <TdText1 text="€400,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="20/09/2024" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText text="Pagata" />
                    </div>
                    <TdText3 text="18/09/2024" additionalClassNames="h-[65px] left-[1413.78px]" />
                    <TdText1 text="Bonifico" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[65px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Sara Martini" additionalClassNames="h-[65px]" />
                    <TdText1 text="Coaching" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="2/3" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€312,00" additionalClassNames="h-[65px]" />
                    <TdText1 text="€400,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="20/10/2024" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText text="Pagata" />
                    </div>
                    <TdText3 text="19/10/2024" additionalClassNames="h-[65px] left-[1413.78px]" />
                    <TdText1 text="Bonifico" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[130px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Francesca Moretti" additionalClassNames="h-[65px]" />
                    <TdText1 text="Starter Pack" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="1/1" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€77,22" additionalClassNames="h-[65px]" />
                    <TdText1 text="€99,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="10/11/2024" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText text="Pagata" />
                    </div>
                    <TdText3 text="09/11/2024" additionalClassNames="h-[65px] left-[1413.78px]" />
                    <TdText1 text="Carta di credito" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[195px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Sara Martini" additionalClassNames="h-[65px]" />
                    <TdText1 text="Coaching" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="3/3" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€312,00" additionalClassNames="h-[65px]" />
                    <TdText1 text="€400,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="20/11/2024" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText text="Pagata" />
                    </div>
                    <TdText3 text="17/11/2024" additionalClassNames="h-[65px] left-[1413.78px]" />
                    <TdText1 text="Carta di credito" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[260px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Alessandro Brun" additionalClassNames="h-[65px]" />
                    <TdText1 text="Coaching" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="1/3" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€312,00" additionalClassNames="h-[65px]" />
                    <TdText1 text="€400,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="15/09/2025" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText text="Pagata" />
                    </div>
                    <TdText3 text="12/09/2025" additionalClassNames="h-[65px] left-[1413.78px]" />
                    <TdText1 text="Bonifico" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[325px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Alessandro Brun" additionalClassNames="h-[65px]" />
                    <TdText1 text="Coaching" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="2/3" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€312,00" additionalClassNames="h-[65px]" />
                    <TdText1 text="€400,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="15/10/2025" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText text="Pagata" />
                    </div>
                    <TdText3 text="13/10/2025" additionalClassNames="h-[65px] left-[1413.78px]" />
                    <TdText1 text="Bonifico" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[390px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Francesca Moretti" additionalClassNames="h-[65px]" />
                    <TdText1 text="Coaching Plus" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="1/3" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€468,00" additionalClassNames="h-[65px]" />
                    <TdText1 text="€600,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="20/10/2025" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText text="Pagata" />
                    </div>
                    <TdText3 text="18/10/2025" additionalClassNames="h-[65px] left-[1413.78px]" />
                    <TdText1 text="Bonifico" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[455px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Marco De Luca" additionalClassNames="h-[65px]" />
                    <TdText1 text="Starter Pack" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="1/1" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€77,22" additionalClassNames="h-[65px]" />
                    <TdText1 text="€99,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="01/11/2025" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText text="Pagata" />
                    </div>
                    <TdText3 text="30/10/2025" additionalClassNames="h-[65px] left-[1413.78px]" />
                    <TdText1 text="Carta di credito" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[520px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Alessandro Brun" additionalClassNames="h-[65px]" />
                    <TdText1 text="Coaching" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="3/3" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€312,00" additionalClassNames="h-[65px]" />
                    <TdText1 text="€400,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="15/11/2025" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText text="Pagata" />
                    </div>
                    <TdText3 text="14/11/2025" additionalClassNames="h-[65px] left-[1413.78px]" />
                    <TdText1 text="Bonifico" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[585px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Francesca Moretti" additionalClassNames="h-[65px]" />
                    <TdText1 text="Coaching Plus" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="2/3" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€468,00" additionalClassNames="h-[65px]" />
                    <TdText1 text="€600,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="20/11/2025" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText text="Pagata" />
                    </div>
                    <TdText3 text="19/11/2025" additionalClassNames="h-[65px] left-[1413.78px]" />
                    <TdText1 text="Bonifico" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[650px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Giulia Verdi" additionalClassNames="h-[65px]" />
                    <TdText1 text="Coaching" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="1/3" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€312,00" additionalClassNames="h-[65px]" />
                    <TdText1 text="€400,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="01/12/2025" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText text="Pagata" />
                    </div>
                    <TdText3 text="28/11/2025" additionalClassNames="h-[65px] left-[1413.78px]" />
                    <TdText1 text="Bonifico" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[715px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Francesca Moretti" additionalClassNames="h-[65px]" />
                    <TdText1 text="Coaching Plus" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="3/3" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€468,00" additionalClassNames="h-[65px]" />
                    <TdText1 text="€600,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="20/12/2025" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText1 text="Scaduta" />
                    </div>
                    <TdText1 text="—" additionalClassNames="left-[1413.78px] w-[148.391px]" />
                    <TdText1 text="—" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[780px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Giulia Verdi" additionalClassNames="h-[65px]" />
                    <TdText1 text="Coaching" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="2/3" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€312,00" additionalClassNames="h-[65px]" />
                    <TdText1 text="€400,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="01/01/2026" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText text="Pagata" />
                    </div>
                    <TdText3 text="30/12/2025" additionalClassNames="h-[65px] left-[1413.78px]" />
                    <TdText1 text="Bonifico" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[845px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Luca Neri" additionalClassNames="h-[65px]" />
                    <TdText1 text="Coaching Plus" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="1/3" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€468,00" additionalClassNames="h-[65px]" />
                    <TdText1 text="€600,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="15/01/2026" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText text="Pagata" />
                    </div>
                    <TdText3 text="12/01/2026" additionalClassNames="h-[65px] left-[1413.78px]" />
                    <TdText1 text="Carta di credito" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[910px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Giulia Verdi" additionalClassNames="h-[65px]" />
                    <TdText1 text="Coaching" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="3/3" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€312,00" additionalClassNames="h-[65px]" />
                    <TdText1 text="€400,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="01/02/2026" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText2 text="In attesa" />
                    </div>
                    <TdText1 text="—" additionalClassNames="left-[1413.78px] w-[148.391px]" />
                    <TdText1 text="—" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[975px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Luca Neri" additionalClassNames="h-[65px]" />
                    <TdText1 text="Coaching Plus" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="2/3" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€468,00" additionalClassNames="h-[65px]" />
                    <TdText1 text="€600,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="05/02/2026" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText1 text="Scaduta" />
                    </div>
                    <TdText1 text="—" additionalClassNames="left-[1413.78px] w-[148.391px]" />
                    <TdText1 text="—" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[1040px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Paolo Russo" additionalClassNames="h-[65px]" />
                    <TdText1 text="Starter Pack" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <TdText1 text="1/1" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€77,22" additionalClassNames="h-[65px]" />
                    <TdText1 text="€99,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="10/02/2026" additionalClassNames="h-[65px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[65px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText2 text="In attesa" />
                    </div>
                    <TdText1 text="—" additionalClassNames="left-[1413.78px] w-[148.391px]" />
                    <TdText1 text="—" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[65px]" />
                  </div>
                  <div className="absolute border-[#e5e7eb] border-solid border-t h-[64.5px] left-0 top-[1105px] w-[1913px]" data-name="tr">
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[64.5px] left-0 top-[-1px] w-[64.75px]" data-name="td">
                      <div className="absolute bg-white border border-[#e5e7eb] border-solid left-[16px] rounded-[4px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] size-[16px] top-[22.5px]" data-name="Checkbox" />
                    </div>
                    <TdText text="Luca Neri" additionalClassNames="h-[64.5px]" />
                    <Text text="Coaching Plus" additionalClassNames="left-[307.58px] overflow-clip w-[269.813px]" />
                    <Text text="3/3" additionalClassNames="left-[577.39px] w-[107.922px]" />
                    <TdText2 text="€468,00" additionalClassNames="h-[64.5px]" />
                    <Text text="€600,00" additionalClassNames="left-[820.22px] w-[134.906px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[64.5px] left-[955.13px] top-[-1px] w-[161.875px]" data-name="td">
                      <SpanText1 text="—" />
                    </div>
                    <TdText3 text="05/03/2026" additionalClassNames="h-[64.5px] left-[1117px]" />
                    <div className="absolute border-[#e5e7eb] border-solid border-t h-[64.5px] left-[1265.39px] top-[-1px] w-[148.391px]" data-name="td">
                      <ButtonText2 text="In attesa" />
                    </div>
                    <Text text="—" additionalClassNames="left-[1413.78px] w-[148.391px]" />
                    <Text text="—" additionalClassNames="left-[1562.17px] overflow-clip w-[161.875px]" />
                    <TdText4 text="—" additionalClassNames="h-[64.5px]" />
                  </div>
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[53.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[118.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[183.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[248.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[313.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[378.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[443.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[508.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[573.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[638.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[703.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[768.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[833.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[898.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[963.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[1028.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[65px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[1093.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-white border-[#e5e7eb] border-solid border-t h-[64.5px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-[1158.5px] w-[81.031px]" data-name="td">
                <div className="absolute left-[24.52px] rounded-[6px] size-[32px] top-[15.5px]" data-name="Button">
                  <MoreVertical />
                </div>
              </div>
              <div className="absolute bg-[#f5f5f5] border-[#e5e7eb] border-b border-solid h-[53.5px] left-[1831.97px] shadow-[-2px_0px_4px_0px_rgba(0,0,0,0.05)] top-0 w-[81.031px]" data-name="th" />
            </div>
          </div>
          <div aria-hidden="true" className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
        </div>
        <ContainerText text="18 di 18 rate" additionalClassNames="left-0 top-[1625.19px] w-[1915px]" />
        <div className="absolute content-stretch flex flex-col gap-[8px] h-[86px] items-start left-0 top-0 w-[1915px]" data-name="Container">
          <div className="h-[54px] relative shrink-0 w-full" data-name="h1">
            <p className="absolute font-['Alegreya:Bold',sans-serif] font-bold leading-[54px] left-0 text-[#0a0a0a] text-[36px] top-0 whitespace-nowrap">Incassi</p>
          </div>
          <div className="h-[24px] relative shrink-0 w-full" data-name="p">
            <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[24px] left-0 not-italic text-[#717680] text-[16px] top-[-1px] whitespace-nowrap">Rate studenti — cosa incassare e cosa è stato incassato</p>
          </div>
        </div>
        <div className="absolute content-stretch flex gap-[16px] h-[46px] items-center left-0 top-[318.19px] w-[1915px]" data-name="Container">
          <Container1 additionalClassNames="flex-[1_0_0] min-h-px min-w-px">
            <div className="bg-white flex-[1_0_0] h-[46px] min-h-px min-w-px relative rounded-[8px]" data-name="input">
              <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center px-[16px] py-[10px] relative size-full">
                  <p className="font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[#717680] text-[16px] whitespace-nowrap">Cerca studente, servizio, ID rata...</p>
                </div>
              </div>
              <div aria-hidden="true" className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[8px]" />
            </div>
          </Container1>
          <Container1 additionalClassNames="shrink-0 w-[142px]">
            <div className="flex-[1_0_0] h-[46px] min-h-px min-w-px relative rounded-[8px]" data-name="select">
              <div aria-hidden="true" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 pointer-events-none rounded-[8px]">
                <div className="absolute bg-clip-padding bg-white border-0 border-[transparent] border-solid inset-0 rounded-[8px]" />
                <div className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 overflow-hidden rounded-[8px]">
                  <img alt="" className="absolute h-[17.39%] left-0 max-w-none top-[41.3%] w-[8.45%]" src={imgSelect} />
                </div>
              </div>
              <div aria-hidden="true" className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[8px]" />
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-px pl-[-2093px] pr-[2235px] pt-[-463.188px] relative size-full">
                <div className="h-0 shrink-0 w-full" data-name="option" />
                <div className="h-0 shrink-0 w-full" data-name="option" />
                <div className="h-0 shrink-0 w-full" data-name="option" />
                <div className="h-0 shrink-0 w-full" data-name="option" />
              </div>
            </div>
          </Container1>
        </div>
      </div>
    </div>
  );
}