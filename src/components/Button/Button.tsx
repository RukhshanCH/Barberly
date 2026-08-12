import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ink" | "danger";
  size?: "sm" | "md";
  fullWidth?: boolean;
}

const VARIANT_CLASS: Record<string, string> = {
  primary: "btn--primary",
  outline: "btn--outline",
  ink: "",
  danger: "btn--danger",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "ink", size = "md", fullWidth, className, ...props }, ref) => {
    const classes = [
      "btn",
      VARIANT_CLASS[variant],
      size === "sm" ? "btn--sm" : "",
      fullWidth ? "btn--full" : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    return <button ref={ref} className={classes} {...props} />;
  }
);

Button.displayName = "Button";
