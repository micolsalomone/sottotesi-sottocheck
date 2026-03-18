import svgPaths from '@/imports/svg-xq5j01l2g2';
import { FileText } from 'lucide-react';

export type TimelineEventType = 'note' | 'document';

export interface NoteEvent {
  type: 'note';
  id: string;
  author: 'tutor' | 'student';
  content: string;
  timestamp: string;
}

export interface DocumentEvent {
  type: 'document';
  id: string;
  description: string;
  fileNameDetail: string;
  timestamp: string;
}

export type TimelineEventItem = NoteEvent | DocumentEvent;

interface TimelineEventProps {
  event: TimelineEventItem;
}

export function TimelineEvent({ event }: TimelineEventProps) {
  if (event.type === 'note') {
    return (
      <div className="h-auto relative w-full py-[12px]">
        {/* Icon */}
        <div className="absolute content-stretch flex flex-col items-start left-0 top-[16px] w-[16px]">
          <div className="h-[16px] overflow-clip relative w-full">
            <div className="absolute inset-[12.47%_12.47%_8.33%_8.33%]">
              <div className="absolute inset-[-5.26%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.0053 14.0053">
                  <path d={svgPaths.p4eeac00} stroke="#155DFC" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pl-[28px]">
          <div className="flex items-start justify-between mb-[4px]">
            <p className="font-['Inter:Medium',sans-serif] font-medium leading-[21px] text-[#0a0a0a] text-[14px]">
              {event.author === 'tutor' ? 'Nota del Tutor' : 'Nota dello Studente'}
            </p>
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[18px] text-[#717680] text-[12px] ml-auto">
              {event.timestamp}
            </p>
          </div>
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[21px] text-[#4a5565] text-[14px] whitespace-pre-wrap">
            {event.content}
          </p>
        </div>
      </div>
    );
  }

  if (event.type === 'document') {
    return (
      <div className="h-auto relative w-full py-[12px]">
        {/* Icon */}
        <div className="absolute content-stretch flex flex-col items-start left-0 top-[16px] w-[16px]">
          <div className="h-[16px] overflow-clip relative w-full">
            <FileText className="size-full text-[#717680]" strokeWidth="1.33333" />
          </div>
        </div>

        {/* Content */}
        <div className="pl-[28px]">
          <div className="flex items-start justify-between mb-[4px]">
            <p className="font-['Inter:Medium',sans-serif] font-medium leading-[21px] text-[#0a0a0a] text-[14px]">
              Documento caricato
            </p>
            <p className="font-['Inter:Regular',sans-serif] font-normal leading-[18px] text-[#717680] text-[12px] ml-auto">
              {event.timestamp}
            </p>
          </div>
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[21px] text-[#4a5565] text-[14px]">
            {event.description}
          </p>
          <p className="font-['Inter:Regular',sans-serif] font-normal leading-[18px] text-[#717680] text-[12px] mt-[4px]">
            {event.fileNameDetail}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
