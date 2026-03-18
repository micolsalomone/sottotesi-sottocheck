interface ServicesLinkProps {
  onNavigate: () => void;
}

export function ServicesLink({ onNavigate }: ServicesLinkProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <button
        onClick={onNavigate}
        className="w-full text-left group"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 group-hover:text-black transition-colors">
              I Tuoi Servizi
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Visualizza e gestisci i tuoi servizi attivi
            </p>
          </div>
          <svg 
            className="size-5 text-gray-400 group-hover:text-gray-600 transition-colors" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </div>
  );
}
