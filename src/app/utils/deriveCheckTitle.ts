/**
 * Default display title for a TesiCheck, derived from the uploaded filename by
 * removing ONLY the final extension segment.
 *
 * No other normalization is applied: version numbers, words like
 * `FINAL` / `finalissima`, thesis-section guesses etc. are all left untouched.
 *
 *   capitolo_3_metodologia.docx  ->  capitolo_3_metodologia
 *   tesi_finale_v7_CORRETTA.pdf  ->  tesi_finale_v7_CORRETTA
 *
 * The title describes the CHECK/version shown in History and is a separate
 * concept from `document.name` (the uploaded artifact). It is never written back
 * onto the document. Editing the title is a later slice — for now this is the
 * only source of a check's title.
 */
export function deriveDefaultCheckTitle(fileName: string): string {
  const trimmed = (fileName ?? '').trim();
  const withoutExtension = trimmed.replace(/\.[^./\\]+$/, '').trim();
  return withoutExtension || trimmed;
}
