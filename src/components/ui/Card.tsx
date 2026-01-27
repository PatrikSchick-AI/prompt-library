import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  const hoverStyles = hoverable ? 'hover:border-[var(--pl-accent)] transition-colors cursor-pointer' : '';

  return (
    <div
      className={`bg-[var(--pl-surface)] border border-[var(--pl-border)] p-6 ${hoverStyles} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
