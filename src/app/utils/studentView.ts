import { STUDENTS_DATA, type StudentData } from '@/pages/coach/studentsData';

export const STUDENT_VIEW_STUDENT_ID = 'S-052';
/**
 * Prototype identity bridge: id of the structured `Student` record (in
 * `LavorazioniContext`) that corresponds to the flat Student-view mock `S-052`.
 * Only `/student-view/profilo` reads this — header / dashboard / timeline keep
 * using the flat `STUDENT_VIEW_STUDENT_ID`. This is an explicit prototype shim,
 * not a production identity mapping.
 */
export const STUDENT_VIEW_STUDENT_RECORD_ID = 'STU-052';
export const STUDENT_VIEW_BASE_PATH = '/student-view';

export function isStudentViewPath(pathname: string) {
  return pathname.startsWith(STUDENT_VIEW_BASE_PATH);
}

export function getStudentViewStudent(): StudentData {
  const student = STUDENTS_DATA.find((item) => item.id === STUDENT_VIEW_STUDENT_ID);

  if (!student) {
    throw new Error(`Studente mock non trovato: ${STUDENT_VIEW_STUDENT_ID}`);
  }

  return student;
}

export function getStudentViewTimelinePath() {
  return `${STUDENT_VIEW_BASE_PATH}/studenti/${STUDENT_VIEW_STUDENT_ID}`;
}
