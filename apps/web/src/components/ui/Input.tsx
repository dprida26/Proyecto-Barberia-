import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-xl border border-slate-300 px-4 py-3.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 min-h-[56px] ${className}`}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
