import * as React from "react";
import { cn } from "../../lib/utils";
import { ChevronDown } from "lucide-react";

const Select = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
    </div>
  );
});
Select.displayName = "Select";

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <Select ref={ref} className={className} {...props}>
    {children}
  </Select>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }) => (
  <span className="text-muted-foreground">{placeholder}</span>
);

const SelectContent = ({ children }) => children;
const SelectItem = ({ value, children }) => (
  <option value={value}>{children}</option>
);

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
