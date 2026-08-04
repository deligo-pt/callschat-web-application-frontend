import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware navigation primitives to use across the app instead of
// the raw next/navigation equivalents.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
