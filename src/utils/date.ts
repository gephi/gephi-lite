export function displayStringDateTime(value: string, options?: { time: boolean }): string | undefined {
  try {
    const date = new Date(value);
    if (date)
      return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "short",
        timeStyle: options?.time === false ? undefined : "short",
      }).format(date);
  } catch (_e) {}
  return undefined;
}

/**
 * Display the date to the "from ago" format.
 */
export function dateToFromAgo(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const prefix = seconds < 0 ? "in " : "";
  const suffix = seconds < 0 ? "" : " ago";
  const absSecond = Math.abs(seconds);

  const times = [
    absSecond / 60 / 60 / 24 / 365, // years
    absSecond / 60 / 60 / 24 / 30, // months
    absSecond / 60 / 60 / 24 / 7, // weeks
    absSecond / 60 / 60 / 24, // days
    absSecond / 60 / 60, // hours
    absSecond / 60, // minutes
    absSecond, // seconds
  ];

  return (
    ["year", "month", "week", "day", "hour", "minute", "second"]
      .map((name, index) => {
        const time = Math.floor(times[index]);
        if (time > 0) return `${prefix}${time} ${name}${time > 1 ? "s" : ""}${suffix}`;
        return null;
      })
      .reduce((acc, curr) => (acc === null && curr !== null ? curr : null), null) || "now"
  );
}
