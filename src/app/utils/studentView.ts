import { STUDENTS_DATA, type StudentData } from '@/pages/coach/studentsData';

export const STUDENT_VIEW_STUDENT_ID = 'S-052';
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
