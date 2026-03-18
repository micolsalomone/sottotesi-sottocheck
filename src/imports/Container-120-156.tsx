import clsx from "clsx";
import svgPaths from "./svg-b4lpzaili2";
type XaProps = {
  additionalClassNames?: string;
};

function Xa({ children, additionalClassNames = "" }: React.PropsWithChildren<XaProps>) {
  return (
    <div className={clsx("relative w-[384px]", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between relative size-full">{children}</div>
    </div>
  );
}
type Container1Props = {
  additionalClassNames?: string;
};

function Container1({ children, additionalClassNames = "" }: React.PropsWithChildren<Container1Props>) {
  return (
    <div className={clsx("h-[32px] relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[4px] items-center relative size-full">{children}</div>
    </div>
  );
}

function Wrapper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative rounded-[8px] shrink-0 size-[32px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">{children}</div>
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

function Icon({ children }: React.PropsWithChildren<{}>) {
  return (
    <Wrapper>
      <g id="Icon">{children}</g>
    </Wrapper>
  );
}

function Button() {
  return (
    <div className="flex-[1_0_0] h-[32px] min-h-px min-w-px relative rounded-[8px]">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Wrapper>
          <g clipPath="url(#clip0_120_164)" id="Icon">
            <path d={svgPaths.pce65a00} id="Vector" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
            <path d={svgPaths.p31b8ff80} id="Vector_2" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
          </g>
          <defs>
            <clipPath id="clip0_120_164">
              <rect fill="white" height="14" width="14" />
            </clipPath>
          </defs>
        </Wrapper>
      </div>
    </div>
  );
}
type TextTextProps = {
  text: string;
  additionalClassNames?: string;
};

function TextText({ text, additionalClassNames = "" }: TextTextProps) {
  return (
    <div className={clsx("h-[20px] relative shrink-0", additionalClassNames)}>
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[20px] left-0 not-italic text-[#0a0a0a] text-[14px] top-0 whitespace-nowrap">{text}</p>
      </div>
    </div>
  );
}

export default function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start pt-[8px] relative size-full" data-name="Container">
      <div className="h-[18px] relative shrink-0 w-full" data-name="Paragraph">
        <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[18px] left-0 not-italic text-[#717680] text-[12px] top-0 tracking-[0.6px] uppercase whitespace-nowrap">Contatti studente</p>
      </div>
      <div className="content-stretch flex flex-col gap-[12px] h-[76px] items-start relative shrink-0 w-full" data-name="Container">
        <Xa additionalClassNames="h-[32px] shrink-0">
          <TextText text="+39 3283756889" additionalClassNames="w-[115.656px]" />
          <Container1 additionalClassNames="w-[140px]">
            <Wrapper1>
              <Wrapper>
                <g clipPath="url(#clip0_120_174)" id="Icon">
                  <path d={svgPaths.p2c04e800} id="Vector" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                </g>
                <defs>
                  <clipPath id="clip0_120_174">
                    <rect fill="white" height="14" width="14" />
                  </clipPath>
                </defs>
              </Wrapper>
            </Wrapper1>
            <Wrapper1>
              <Icon>
                <path d={svgPaths.p117c1980} id="Vector" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
              </Icon>
            </Wrapper1>
            <Wrapper1>
              <Wrapper>
                <g clipPath="url(#clip0_120_168)" id="Od">
                  <path d={svgPaths.p28e2e680} fill="var(--fill-0, #717680)" id="Vector" />
                </g>
                <defs>
                  <clipPath id="clip0_120_168">
                    <rect fill="white" height="14" width="14" />
                  </clipPath>
                </defs>
              </Wrapper>
            </Wrapper1>
            <Button />
          </Container1>
        </Xa>
        <Xa additionalClassNames="flex-[1_0_0] min-h-px min-w-px">
          <TextText text="alex.johnson32@gmail.com" additionalClassNames="w-[182.063px]" />
          <Container1 additionalClassNames="w-[68px]">
            <Wrapper1>
              <Icon>
                <path d={svgPaths.p5c184f0} id="Vector" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
                <path d={svgPaths.p2a640080} id="Vector_2" stroke="var(--stroke-0, #717680)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
              </Icon>
            </Wrapper1>
            <Button />
          </Container1>
        </Xa>
      </div>
    </div>
  );
}