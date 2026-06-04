export function addOneMonth(date = new Date()) {
  const d = new Date(date);
  const day = d.getDate();

  d.setMonth(d.getMonth() + 1);

  // handle month rollover (e.g. Jan 31 -> Feb)
  if (d.getDate() < day) d.setDate(0);

  return d;
}