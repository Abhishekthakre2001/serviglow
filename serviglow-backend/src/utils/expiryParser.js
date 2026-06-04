export function parseExpiryToMs(expiry) {
  if (!expiry) return 30000; // default 30 sec

  const value = parseInt(expiry);
  const unit = expiry.replace(value, "").trim();

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    default:
      return value; // assume ms
  }
}