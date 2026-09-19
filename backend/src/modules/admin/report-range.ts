export function reportRange(start: unknown, end: unknown) {
  if (start === undefined && end === undefined)
    return { start: null, end: null, filter: undefined };
  function date(value: unknown) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
      throw new Error("Provide both start and end dates in YYYY-MM-DD format.");
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== value
    )
      throw new Error("Invalid report date.");
    return parsed;
  }
  const from = date(start),
    through = date(end);
  if (from > through)
    throw new Error("Start date must be on or before end date.");
  return {
    start: start as string,
    end: end as string,
    filter: { gte: from, lt: new Date(through.getTime() + 86400000) },
  };
}
