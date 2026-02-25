import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react';

type Variant = 'ghost' | 'primary';

type BaseProps = {
  children: ReactNode;
  className?: string;
  variant?: Variant;
};

const variantClass: Record<Variant, string> = {
  ghost: 'ghost-btn',
  primary: 'primary-btn',
};

function withVariant(variant: Variant, className?: string) {
  return `${variantClass[variant]}${className ? ` ${className}` : ''}`;
}

export function AppButton({ children, className, variant = 'ghost', ...props }: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={withVariant(variant, className)}>
      {children}
    </button>
  );
}

export function AppButtonLink({ children, className, variant = 'ghost', href, ...props }: BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a {...props} href={href} className={withVariant(variant, className)}>
      {children}
    </a>
  );
}

export function AppLinkButton({ children, className, variant = 'ghost', href }: BaseProps & { href: string }) {
  return (
    <Link href={href} className={withVariant(variant, className)}>
      {children}
    </Link>
  );
}

export function AppLabelButton({ children, className, variant = 'ghost', ...props }: BaseProps & LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label {...props} className={withVariant(variant, className)}>
      {children}
    </label>
  );
}
