import * as React from "react";
import { Check } from "lucide-react";

const Checkbox = React.forwardRef(({ className = "", checked, indeterminate, onCheckedChange, ...props }, ref) => {
  const checkboxRef = React.useRef();
  const resolvedRef = ref || checkboxRef;

  React.useEffect(() => {
    if (typeof indeterminate === "boolean" && resolvedRef.current) {
      resolvedRef.current.indeterminate = !checked && indeterminate;
    }
  }, [resolvedRef, indeterminate, checked]);

  return (
    <div className="relative flex items-center justify-center">
      <input
        type="checkbox"
        ref={resolvedRef}
        className={`peer h-4 w-4 shrink-0 rounded-[4px] border border-surface-300 bg-white shadow-sm appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 checked:bg-brand-600 checked:border-brand-600 ${className}`}
        checked={checked === "indeterminate" ? false : checked}
        onChange={(e) => {
          if (onCheckedChange) {
             onCheckedChange(typeof checked === "indeterminate" ? true : e.target.checked);
          }
        }}
        {...props}
      />
      <Check className="absolute h-3 w-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" />
      {indeterminate && !checked && (
        <div className="absolute h-[2px] w-[8px] bg-white pointer-events-none opacity-0 peer-indeterminate:opacity-100" />
      )}
    </div>
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
