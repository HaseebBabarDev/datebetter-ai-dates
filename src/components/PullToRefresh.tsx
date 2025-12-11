import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({ 
  pullDistance, 
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 360;
  const opacity = Math.min(progress * 1.5, 1);
  
  if (pullDistance <= 0 && !isRefreshing) return null;

  return (
    <div 
      className="absolute left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
      style={{ 
        top: Math.max(pullDistance - 40, 0),
        opacity,
        transition: isRefreshing ? 'none' : 'opacity 0.15s ease-out',
      }}
    >
      <div 
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full bg-background shadow-lg border border-border",
          isRefreshing && "animate-pulse"
        )}
      >
        <RefreshCw 
          className={cn(
            "w-5 h-5 text-primary transition-transform",
            isRefreshing && "animate-spin"
          )}
          style={{ 
            transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
          }}
        />
      </div>
    </div>
  );
}
