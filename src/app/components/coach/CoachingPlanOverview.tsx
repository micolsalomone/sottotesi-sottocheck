import svgPaths from '@/imports/svg-9yb2rlr0ju';

interface CoachingPlanOverviewProps {
  studentName: string;
  planStatus: string;
  startDate: string;
  expectedEndDate: string;
}

export function CoachingPlanOverview({
  studentName,
  planStatus,
  startDate,
  expectedEndDate
}: CoachingPlanOverviewProps) {
  return (
    <div className="mb-[32px]">
      <div className="content-stretch flex flex-col gap-[24px] items-start pb-px relative w-full">
        {/* Border bottom */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none" />
        
        {/* Top row - Title and badges */}
        <div className="h-[45px] relative shrink-0 w-full">
          <div className="absolute h-[45px] left-0 top-0 w-full">
            <p className="absolute font-['Alegreya:Bold',sans-serif] font-bold leading-[45px] left-0 text-[#0a0a0a] text-[30px] top-0">
              Piano Coaching · {studentName}
            </p>
          </div>
          
          {/* Badge: Coaching Plus */}
          <div className="absolute bg-[#f3f4f6] h-[26px] left-[calc(100%-201px)] rounded-[8px] top-[9.5px] px-[12px] flex items-center">
            <p className="font-['Inter:Medium',sans-serif] font-medium leading-[18px] text-[#4a5565] text-[12px] tracking-[0.6px] uppercase">
              Coaching Plus
            </p>
          </div>
          
          {/* Badge: Status */}
          <div className="absolute bg-[#eff6ff] h-[26px] left-[calc(100%-71px)] rounded-[8px] top-[9.5px] px-[12px] flex items-center">
            <p className="font-['Inter:Medium',sans-serif] font-medium leading-[18px] text-[#1e40af] text-[12px] tracking-[0.6px] uppercase">
              In corso
            </p>
          </div>
        </div>
        
        {/* Bottom row - Info grid */}
        <div className="h-[106px] relative shrink-0 w-full">
          {/* Left column */}
          <div className="absolute content-stretch flex flex-col gap-[12px] h-[106px] items-start left-0 top-0 w-[302.656px]">
            {/* Inizio */}
            <div className="h-[47px] relative shrink-0 w-full">
              <div className="bg-clip-padding content-stretch flex flex-col gap-[2px] items-start relative size-full">
                <div className="h-[21px] relative shrink-0 w-full">
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#717680] text-[14px] top-0">
                    Inizio
                  </p>
                </div>
                <div className="h-[24px] relative shrink-0 w-full">
                  <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 text-[#0a0a0a] text-[16px] top-[-1px]">
                    {startDate}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Fine prevista */}
            <div className="flex-[1_0_0] min-h-px min-w-px relative w-full">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
                <div className="h-[21px] relative shrink-0 w-full">
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#717680] text-[14px] top-0">
                    Fine prevista
                  </p>
                </div>
                <div className="h-[24px] relative shrink-0 w-full">
                  <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 text-[#0a0a0a] text-[16px] top-[-1px]">
                    {expectedEndDate}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column */}
          <div className="absolute content-stretch flex flex-col gap-[12px] h-[106px] items-start left-[326.66px] top-0 w-[302.672px]">
            {/* Studente */}
            <div className="h-[47px] relative shrink-0 w-full">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[2px] items-start relative size-full">
                <div className="h-[21px] relative shrink-0 w-full">
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#717680] text-[14px] top-0">
                    Studente
                  </p>
                </div>
                <div className="h-[24px] relative shrink-0 w-full">
                  <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 text-[#0a0a0a] text-[16px] top-[-1px]">
                    {studentName}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Referente SottoTesi */}
            <div className="flex-[1_0_0] min-h-px min-w-px relative w-full">
              <div className="bg-clip-padding  content-stretch flex flex-col gap-[2px] items-start relative size-full">
                <div className="h-[21px] relative shrink-0 w-full">
                  <p className="absolute font-['Inter:Regular',sans-serif] font-normal leading-[21px] left-0 text-[#717680] text-[14px] top-0">
                    Referente SottoTesi
                  </p>
                </div>
                <div className="h-[24px] relative shrink-0 w-full">
                  <p className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[24px] left-0 text-[#0a0a0a] text-[16px] top-[-1px]">
                    Marco Bianchi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}