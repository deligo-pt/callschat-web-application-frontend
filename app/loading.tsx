import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-transparent min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-[#E0E7FF] animate-pulse">
          <Loader2 className="h-6 w-6 text-[#2563EB] animate-spin" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}
