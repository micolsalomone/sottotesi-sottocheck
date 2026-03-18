import React, { useMemo } from 'react';
import { AVAILABLE_COACHES, COACH_ID_MAP } from '../data/LavorazioniContext';
import { useAreeTematiche } from '../data/AreeTematicheContext';

// ─── Props ───────────────────────────────────────────────────
interface SmartCoachSelectProps {
  value: string;
  onChange: (value: string) => void;
  areaTematica?: string;
  style?: React.CSSProperties;
  title?: string;
  emptyLabel?: string;
}

/**
 * Select coach con suggerimenti basati sull'area tematica.
 * Se un'area tematica è selezionata, mostra prima i coach assegnati a quell'area
 * (optgroup "Consigliati"), poi tutti gli altri (optgroup "Altri coach").
 * Se nessuna area è selezionata, mostra tutti i coach in lista piatta.
 */
export function SmartCoachSelect({
  value,
  onChange,
  areaTematica,
  style,
  title,
  emptyLabel = 'Nessuno',
}: SmartCoachSelectProps) {
  const { aree } = useAreeTematiche();

  const { suggested, others } = useMemo(() => {
    if (!areaTematica) {
      return { suggested: [] as string[], others: AVAILABLE_COACHES };
    }

    // Trova l'area tematica per nome
    const area = aree.find(a => a.name === areaTematica && a.isActive);
    if (!area || area.coachIds.length === 0) {
      return { suggested: [] as string[], others: AVAILABLE_COACHES };
    }

    // Mappa gli ID coach dell'area ai nomi
    const suggestedNames = area.coachIds
      .map(id => {
        // Cerca nome per ID
        const entry = Object.entries(COACH_ID_MAP).find(([, cid]) => cid === id);
        return entry ? entry[0] : null;
      })
      .filter((n): n is string => n !== null && AVAILABLE_COACHES.includes(n));

    const suggestedSet = new Set(suggestedNames);
    const otherNames = AVAILABLE_COACHES.filter(c => !suggestedSet.has(c));

    return { suggested: suggestedNames, others: otherNames };
  }, [areaTematica, aree]);

  const hasSuggested = suggested.length > 0;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={style}
      title={title}
    >
      <option value="">{emptyLabel}</option>
      {hasSuggested ? (
        <>
          <optgroup label={`Consigliati — ${areaTematica}`}>
            {suggested.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </optgroup>
          <optgroup label="Altri coach">
            {others.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </optgroup>
        </>
      ) : (
        AVAILABLE_COACHES.map(c => (
          <option key={c} value={c}>{c}</option>
        ))
      )}
    </select>
  );
}
