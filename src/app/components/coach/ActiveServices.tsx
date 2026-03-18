import { CheckCircle2, Plus } from 'lucide-react';

interface Service {
  name: string;
  status: string;
}

interface ActiveServicesProps {
  services: Service[];
  onAddService: () => void;
}

export function ActiveServices({ services, onAddService }: ActiveServicesProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8">
      <h3 className="text-lg mb-6">Servizi Attivi</h3>
      
      <div className="space-y-4 mb-6">
        {services.map((service, index) => (
          <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
            <CheckCircle2 className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">{service.name}</p>
              <p className="text-sm text-gray-500">{service.status}</p>
            </div>
          </div>
        ))}
      </div>
      
      <button 
        onClick={onAddService}
        className="w-full border border-gray-300 text-gray-700 rounded-lg px-6 py-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
      >
        <Plus className="size-4" />
        <span className="text-sm">Aggiungi un Altro Servizio</span>
      </button>
    </div>
  );
}
