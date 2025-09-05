export function displayDateTime(value: string | Date, options?: { time: boolean }): string | undefined {
  try {
    const date = new Date(value);
    if (date)
      return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "short",
        timeStyle: options?.time === false ? undefined : "short",
      }).format(date);
  } catch (_e) {
    // nothing todo
  }
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

export const DATE_FORMATS: Array<{ example: string; format: string; description: string }> = [
  // ISO 8601 variants
  { example: "2016", format: "yyyy", description: "Year only" },
  { example: "2016-05", format: "yyyy-MM", description: "Year and month with dash" },
  { example: "201605", format: "yyyyMM", description: "Year and month compact" },
  { example: "2016-05-25", format: "yyyy-MM-dd", description: "Date with dashes" },
  { example: "20160525", format: "yyyyMMdd", description: "Date compact" },

  // ISO 8601 with time variants (no timezone)
  { example: "2016-05-25T09", format: "yyyy-MM-dd'T'HH", description: "Date with hour" },
  { example: "2016-05-25T09:24", format: "yyyy-MM-dd'T'HH:mm", description: "Date with hour and minute" },
  { example: "2016-05-25T09:24:15", format: "yyyy-MM-dd'T'HH:mm:ss", description: "Date with seconds" },
  { example: "2016-05-25T09:24:15.123", format: "yyyy-MM-dd'T'HH:mm:ss.SSS", description: "Date with milliseconds" },
  { example: "2016-05-25T0924", format: "yyyy-MM-dd'T'HHmm", description: "Date with compact time HHMM" },
  { example: "2016-05-25T092415", format: "yyyy-MM-dd'T'HHmmss", description: "Date with compact time HHMMSS" },
  {
    example: "2016-05-25T092415.123",
    format: "yyyy-MM-dd'T'HHmmss.SSS",
    description: "Date with compact time and milliseconds",
  },
  {
    example: "2016-05-25T09:24:15,123",
    format: "yyyy-MM-dd'T'HH:mm:ss,SSS",
    description: "Date with comma-separated milliseconds",
  },

  // ISO 8601 with time variants (with Z)
  { example: "2016-05-25T09Z", format: "yyyy-MM-dd'T'HH'Z'", description: "Date with hour and Z" },
  { example: "2016-05-25T09:24Z", format: "yyyy-MM-dd'T'HH:mm'Z'", description: "Date with hour, minute and Z" },
  { example: "2016-05-25T09:24:15Z", format: "yyyy-MM-dd'T'HH:mm:ss'Z'", description: "Date with seconds and Z" },
  {
    example: "2016-05-25T09:24:15.123Z",
    format: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
    description: "Date with milliseconds and Z",
  },
  { example: "2016-05-25T0924Z", format: "yyyy-MM-dd'T'HHmm'Z'", description: "Date with compact time HHMM and Z" },
  {
    example: "2016-05-25T092415Z",
    format: "yyyy-MM-dd'T'HHmmss'Z'",
    description: "Date with compact time HHMMSS and Z",
  },
  {
    example: "2016-05-25T092415.123Z",
    format: "yyyy-MM-dd'T'HHmmss.SSS'Z'",
    description: "Date with compact time, milliseconds and Z",
  },
  {
    example: "2016-05-25T09:24:15,123Z",
    format: "yyyy-MM-dd'T'HH:mm:ss,SSS'Z'",
    description: "Date with comma-separated milliseconds and Z",
  },

  // ISO 8601 with time variants (with timezone offset)
  { example: "2016-05-25T09+06:00", format: "yyyy-MM-dd'T'HHZZ", description: "Date with hour and timezone offset" },
  {
    example: "2016-05-25T09:24+06:00",
    format: "yyyy-MM-dd'T'HH:mmZZ",
    description: "Date with hour, minute and timezone offset",
  },
  {
    example: "2016-05-25T09:24:15+06:00",
    format: "yyyy-MM-dd'T'HH:mm:ssZZ",
    description: "Date with seconds and timezone offset",
  },
  {
    example: "2016-05-25T09:24:15.123+06:00",
    format: "yyyy-MM-dd'T'HH:mm:ss.SSSZZ",
    description: "Date with milliseconds and timezone offset",
  },
  {
    example: "2016-05-25T0924+0600",
    format: "yyyy-MM-dd'T'HHmmZZZ",
    description: "Date with compact time HHMM and compact timezone offset",
  },
  {
    example: "2016-05-25T092415+0600",
    format: "yyyy-MM-dd'T'HHmmssZZZ",
    description: "Date with compact time HHMMSS and compact timezone offset",
  },
  {
    example: "2016-05-25T092415.123+0600",
    format: "yyyy-MM-dd'T'HHmmss.SSSZZZ",
    description: "Date with compact time, milliseconds and timezone offset",
  },
  {
    example: "2016-05-25T09:24:15,123+06:00",
    format: "yyyy-MM-dd'T'HH:mm:ss,SSSZZ",
    description: "Date with comma-separated milliseconds and timezone offset",
  },

  // ISO 8601 Week dates
  { example: "2016-W21-3", format: "kkkk-'W'WW-c", description: "Week date with dashes" },
  { example: "2016W213", format: "kkkk'W'WWc", description: "Week date compact" },
  { example: "2016-W21-3T09:24:15.123", format: "kkkk-'W'WW-c'T'HH:mm:ss.SSS", description: "Week date with time" },
  { example: "2016W213T09:24:15.123", format: "kkkk'W'WWc'T'HH:mm:ss.SSS", description: "Week date compact with time" },
  {
    example: "2016-W21-3T09:24:15.123Z",
    format: "kkkk-'W'WW-c'T'HH:mm:ss.SSS'Z'",
    description: "Week date with time and Z",
  },
  {
    example: "2016W213T09:24:15.123Z",
    format: "kkkk'W'WWc'T'HH:mm:ss.SSS'Z'",
    description: "Week date compact with time and Z",
  },
  {
    example: "2016-W21-3T09:24:15.123+06:00",
    format: "kkkk-'W'WW-c'T'HH:mm:ss.SSSZZ",
    description: "Week date with time and timezone offset",
  },
  {
    example: "2016W213T09:24:15.123+06:00",
    format: "kkkk'W'WWc'T'HH:mm:ss.SSSZZ",
    description: "Week date compact with time and timezone offset",
  },

  // ISO 8601 Ordinal dates
  { example: "2016-200", format: "yyyy-ooo", description: "Ordinal date with dash" },
  { example: "2016200", format: "yyyyooo", description: "Ordinal date compact" },
  { example: "2016-200T09:24:15.123", format: "yyyy-ooo'T'HH:mm:ss.SSS", description: "Ordinal date with time" },
  {
    example: "2016-200T09:24:15.123Z",
    format: "yyyy-ooo'T'HH:mm:ss.SSS'Z'",
    description: "Ordinal date with time and Z",
  },
  {
    example: "2016-200T09:24:15.123+06:00",
    format: "yyyy-ooo'T'HH:mm:ss.SSSZZ",
    description: "Ordinal date with time and timezone offset",
  },

  // RFC 2822 variants
  {
    example: "Tue, 01 Nov 2016 13:23:12 +0630",
    format: "EEE, dd MMM yyyy HH:mm:ss ZZZ",
    description: "RFC 2822 with timezone",
  },
  { example: "Sunday, 06-Nov-94 08:49:37 GMT", format: "EEEE, dd-MMM-yy HH:mm:ss 'GMT'", description: "RFC 850 style" },
  { example: "Sun, 06 Nov 1994 08:49:37 GMT", format: "EEE, dd MMM yyyy HH:mm:ss 'GMT'", description: "RFC 2822 GMT" },

  // Common date formats
  { example: "2017-05-15 09:24:15", format: "yyyy-MM-dd HH:mm:ss", description: "ISO datetime with space" },
  { example: "May 25 1982", format: "MMM dd yyyy", description: "Month name with day and year" },

  // US date formats
  { example: "10/14/1983", format: "MM/dd/yyyy", description: "US date format (MM/dd/yyyy)" },
  { example: "1983/10/14", format: "yyyy/MM/dd", description: "Year first with slashes" },
  { example: "1983/14/10", format: "yyyy/dd/MM", description: "Year first, day/month with slashes" },

  // European date formats
  { example: "14/10/1983", format: "dd/MM/yyyy", description: "European date format (dd/MM/yyyy)" },

  // Named month formats
  { example: "Oct 14, 1983", format: "MMM dd, yyyy", description: "Short month name with comma" },
  { example: "Fri, Oct 14, 1983", format: "EEE, MMM dd, yyyy", description: "Day name with short month" },
  { example: "October 14, 1983", format: "MMMM dd, yyyy", description: "Full month name with comma" },
  { example: "Friday, October 14, 1983", format: "EEEE, MMMM dd, yyyy", description: "Full day and month names" },

  // With time components
  { example: "10/14/1983, 1:30:23 PM", format: "MM/dd/yyyy, h:mm:ss a", description: "US date with 12-hour time" },
  {
    example: "Oct 14, 1983, 1:30:23 PM",
    format: "MMM dd, yyyy, h:mm:ss a",
    description: "Short month with 12-hour time",
  },
];
