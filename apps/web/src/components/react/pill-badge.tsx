import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export function PillBadge({
  label,
  labelClass,
  children,
}: {
  label?: ReactNode;
  labelClass?: string;
  children: ReactNode;
}) {
  return (
    <span className="rounded-full bg-gray-50 border inline-flex text-xs items-center">
      {label !== undefined && (
        <span
          className={twMerge(
            "py-1 px-3 bg-sky-800 text-white rounded-l-full font-medium inline-flex items-center",
            labelClass
          )}
        >
          {label}
        </span>
      )}
      <span className="py-1 px-2 font-semibold rounded-r-full">{children}</span>
    </span>
  );
}
