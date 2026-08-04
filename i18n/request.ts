import { getRequestConfig } from "next-intl/server";

// Server-side defaults to "en". The client-side ClientIntlProvider
// takes over after hydration and switches to the user's stored locale.
export default getRequestConfig(async () => {
  const locale = "en";
  return {
    locale,
    timeZone: "UTC",
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
