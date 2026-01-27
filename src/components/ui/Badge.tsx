import React from 'react';

export type BadgeVariant = 'draft' | 'in_review' | 'testing' | 'active' | 'deprecated' | 'archived' | 'default';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    draft: 'bg-zinc-800 text-zinc-300',
    in_review: 'bg-yellow-900/40 text-yellow-300',
    testing: 'bg-blue-900/40 text-blue-300',
    active: 'bg-green-900/40 text-green-300',
    deprecated: 'bg-orange-900/40 text-orange-300',
    archived: 'bg-zinc-800 text-zinc-400',
    default: 'bg-[var(--pl-surface)] text-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
