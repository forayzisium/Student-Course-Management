export function weightedGpa(
  grades: { point: number; credits: number }[],
): number | null {
  if (
    !grades.length ||
    grades.some(
      (g) =>
        !Number.isFinite(g.point) ||
        !Number.isFinite(g.credits) ||
        g.credits <= 0,
    )
  )
    return null;
  const credits = grades.reduce((sum, grade) => sum + grade.credits, 0);
  return (
    grades.reduce((sum, grade) => sum + grade.point * grade.credits, 0) /
    credits
  );
}
