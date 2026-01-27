import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  variant = 'rectangular',
}) => {
  const baseStyles = 'animate-pulse bg-zinc-800';

  const variantStyles = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
};

export const PromptCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[var(--pl-surface)] border border-[var(--pl-border)] p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton width="60%" height="24px" className="mb-2" />
          <Skeleton width="40%" height="16px" />
        </div>
        <Skeleton width="80px" height="24px" />
      </div>
      <Skeleton width="100%" height="60px" className="mb-4" />
      <div className="flex gap-2 mb-4">
        <Skeleton width="60px" height="20px" />
        <Skeleton width="80px" height="20px" />
        <Skeleton width="70px" height="20px" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton width="120px" height="16px" />
        <Skeleton width="100px" height="16px" />
      </div>
    </div>
  );
};

export const PromptDetailSkeleton: React.FC = () => {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Skeleton width="50%" height="32px" className="mb-3" />
            <Skeleton width="70%" height="20px" />
          </div>
          <Skeleton width="100px" height="28px" />
        </div>
        <Skeleton width="100%" height="100px" className="mb-4" />
        <div className="flex gap-2 mb-4">
          <Skeleton width="80px" height="24px" />
          <Skeleton width="100px" height="24px" />
          <Skeleton width="90px" height="24px" />
        </div>
      </div>

      <div className="border-b border-[var(--pl-border)] mb-6">
        <div className="flex gap-6">
          <Skeleton width="80px" height="40px" />
          <Skeleton width="80px" height="40px" />
          <Skeleton width="80px" height="40px" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton width="100%" height="200px" />
        <Skeleton width="100%" height="150px" />
      </div>
    </div>
  );
};
