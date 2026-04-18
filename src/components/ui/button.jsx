import * as React from "react";

const buttonVariants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary: "bg-white text-surface-700 border border-surface-300 hover:bg-surface-50 shadow-sm",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  ghost: "bg-transparent text-surface-600 hover:bg-surface-100",
};

const Button = React.forwardRef(({ className = "", variant = "primary", size = "default", ...props }, ref) => {
  const sizeClasses = size === "sm" ? "h-8 px-3 text-xs" : size === "icon" ? "h-9 w-9 p-2" : "h-10 px-4 py-2";
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${buttonVariants[variant]} ${sizeClasses} ${className}`}
      {...props}
    />
  );
});
Button.displayName = "Button";

export { Button };
