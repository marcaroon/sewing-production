// components/ui/Button.tsx - IMPROVED VERSION

import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none";

  const variantStyles = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary shadow-sm hover:shadow-md",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary shadow-sm hover:shadow-md",
    outline:
      "border-2 border-input text-foreground bg-background hover:bg-accent hover:text-accent-foreground focus:ring-ring",
    ghost:
      "text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-ring",
    danger:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive shadow-sm hover:shadow-md",
    success:
      "bg-success text-success-foreground hover:bg-success/90 focus:ring-success shadow-sm hover:shadow-md",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2.5 text-base gap-2",
    lg: "px-6 py-3 text-lg gap-2",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
