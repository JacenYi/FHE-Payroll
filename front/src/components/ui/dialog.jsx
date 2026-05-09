import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const DialogContext = React.createContext(null);

const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <DialogContext.Provider value={{ onOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
        />
        <div className="relative z-50 w-full max-w-lg">
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  );
};

const DialogContent = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'border-glow relative rounded-2xl bg-surface/95 p-6 shadow-xl backdrop-blur-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const DialogHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)} {...props} />
);

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6', className)}
    {...props}
  />
);

const DialogTitle = ({ className, ...props }) => (
  <h2
    className={cn('text-lg font-semibold leading-none tracking-tight text-text-primary', className)}
    {...props}
  />
);

const DialogDescription = ({ className, ...props }) => (
  <p className={cn('text-sm text-text-muted', className)} {...props} />
);

const DialogClose = ({ className, onClick, asChild, children, ...props }) => {
  const context = React.useContext(DialogContext);
  const onOpenChange = context?.onOpenChange;
  
  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (onOpenChange) onOpenChange(false);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      ...props,
    });
  }

  return (
    <button
      className={cn(
        'absolute right-4 top-4 rounded-lg p-1.5 text-text-muted hover:bg-card hover:text-text-primary transition-colors',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children || <X className="w-5 h-5" />}
    </button>
  );
};

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
};
