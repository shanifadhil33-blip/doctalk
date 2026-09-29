import type { ReactNode } from "react";
import { GoogleMark } from "@/components/icons";

type GoogleSignInButtonProps = {
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "google" | "text";
  className?: string;
  children?: ReactNode;
};

const googleClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50";

const textClass =
  "inline-flex h-10 items-center justify-center rounded-md px-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950";

export function GoogleSignInButton({
  href,
  onClick,
  type = "button",
  variant = "google",
  className,
  children,
}: GoogleSignInButtonProps) {
  const label = children ?? (variant === "google" ? "Sign in with Google" : "Sign in");
  const classNames = [variant === "google" ? googleClass : textClass, className]
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
