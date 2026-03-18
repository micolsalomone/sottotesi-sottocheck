interface PlagiarismCheckProps {
  onStartCheck: () => void;
}

export function PlagiarismCheck({ onStartCheck }: PlagiarismCheckProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="font-medium mb-3">Controllo Plagio</h3>
      <p className="text-sm text-gray-600 mb-4">
        Esegui un controllo plagio indipendente sul tuo documento per verificare l'originalità del contenuto.
      </p>
      <button
        onClick={onStartCheck}
        className="w-full border border-gray-300 text-gray-700 rounded-lg px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
      >
        Avvia Controllo Plagio
      </button>
    </div>
  );
}
