export const normalizeEnrollmentId = (raw: string): string => {
  const value = (raw ?? '').toString().trim();
  if (!value) return '';

  // Common legacy format in this app: "<CLASS>_<ROLL>".
  // For matching a scan value like "01" against stored values like "CSE1_01",
  // we normalize by taking the last underscore segment.
  const upper = value.toUpperCase().replace(/\s+/g, '');
  const lastSegment = upper.includes('_') ? upper.split('_').pop() || upper : upper;

  // If it is purely numeric, compare by numeric value so "01" === "1".
  if (/^\d+$/.test(lastSegment)) {
    return `NUM:${Number.parseInt(lastSegment, 10)}`;
  }

  return `STR:${lastSegment}`;
};

export const enrollmentIdsEqual = (a: string, b: string): boolean => {
  const na = normalizeEnrollmentId(a);
  const nb = normalizeEnrollmentId(b);
  if (!na || !nb) return false;
  return na === nb;
};
