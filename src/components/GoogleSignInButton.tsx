import type { ReactNode } from "react";
import { secondaryButtonClass, textButtonClass } from "@/components/button-styles";
import { GoogleMark } from "@/components/icons";

type GoogleSignInButtonProps = {
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "google" | "text";
  className?: string;
  children?: ReactNode;
};

export function GoogleSignInButton({
  href,
  onClick,
  type = "button",
  variant = "google",
  className,
  children,
}: GoogleSignInButtonProps) {
  const label = children ?? (variant === "google" ? "Sign in with Google" : "Sign in");
  const classNames = [
    variant === "google" ? secondaryButtonClass : textButtonClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {variant === "google" ? <GoogleMark /> : null}
      {label}
    </>
  );

  if (href) {
    return (
      <a href={href} onClick={onClick} className={classNames}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classNames}>
      {content}
    </button>
  );
}
