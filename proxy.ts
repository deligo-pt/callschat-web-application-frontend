import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// No locale-prefix routing needed – locale is handled purely client-side
// via localStorage + ClientIntlProvider.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
