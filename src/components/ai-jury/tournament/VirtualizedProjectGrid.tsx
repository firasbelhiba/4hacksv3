'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VirtualizedProjectGridProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  itemsPerRow: number;
  gap?: number;
  renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  overscan?: number; // Number of items to render outside visible area
}

export function VirtualizedProjectGrid<T>({
  items,
  itemHeight,
  containerHeight,
  itemsPerRow,
  gap = 16,
  renderItem,
  className,
  onScroll,
  overscan = 5,
}: VirtualizedProjectGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(items.length / itemsPerRow);
  const totalHeight = totalRows * rowHeight;

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const visibleRowStart = Math.floor(scrollTop / rowHeight);
    const visibleRowEnd = Math.min(
      totalRows - 1,
      Math.ceil((scrollTop + containerHeight) / rowHeight)
    );

    // Add overscan
    const startRow = Math.max(0, visibleRowStart - overscan);
    const endRow = Math.min(totalRows - 1, visibleRowEnd + overscan);

    const startIndex = startRow * itemsPerRow;
    const endIndex = Math.min(items.length - 1, (endRow + 1) * itemsPerRow - 1);

    return {
      startRow,
      endRow,
      startIndex,
      endIndex,
      visibleRowStart,
      visibleRowEnd,
    };
  }, [scrollTop, containerHeight, rowHeight, totalRows, itemsPerRow, items.length, overscan]);

  // Generate visible items
  const visibleItems = useMemo(() => {
    const result = [];

    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (i >= items.length) break;

      const item = items[i];
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;

      const isInVisibleRange = row >= visibleRange.visibleRowStart && row <= visibleRange.visibleRowEnd;

      result.push({
        item,
        index: i,
        row,
        col,
        isVisible: isInVisibleRange,
        style: {
          position: 'absolute' as const,
          top: row * rowHeight,
          left: `${(col * 100) / itemsPerRow}%`,
          width: `${100 / itemsPerRow}%`,
          height: itemHeight,
          padding: `0 ${gap / 2}px ${gap}px ${gap / 2}px`,
        },
      });
    }

    return result;
  }, [items, visibleRange, itemsPerRow, rowHeight, itemHeight, gap]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  return (
    <div
      ref={scrollElementRef}
      className={cn(
        'relative overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-300',
        className
      )}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total content height placeholder */}
      <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
        <AnimatePresence mode="popLayout">
          {visibleItems.map(({ item, index, isVisible, style }) => (
            <motion.div
              key={index}
              style={style}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                duration: 0.2,
                delay: Math.min(0.1, (index - visibleRange.startIndex) * 0.02),
              }}
            >
              {renderItem(item, index, isVisible)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Scroll indicators */}
      <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded px-2 py-1 border border-border/50">
        {visibleRange.startIndex + 1}-{Math.min(visibleRange.endIndex + 1, items.length)} of {items.length}
      </div>
    </div>
  );
}

// Hook for calculating grid dimensions based on container size
export function useGridDimensions(containerRef: React.RefObject<HTMLElement>) {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    itemsPerRow: 4,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;

      const { width, height } = containerRef.current.getBoundingClientRect();

      // Calculate items per row based on width
      let itemsPerRow = 4;
      if (width < 640) itemsPerRow = 1;          // sm
      else if (width < 768) itemsPerRow = 2;     // md
      else if (width < 1024) itemsPerRow = 3;    // lg
      else if (width < 1280) itemsPerRow = 4;    // xl
      else if (width < 1536) itemsPerRow = 5;    // 2xl
      else itemsPerRow = 6;                      // 3xl+

      setDimensions({ width, height, itemsPerRow });
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [containerRef]);

  return dimensions;
}

// Performance-optimized project card wrapper
export const VirtualizedProjectCard = React.memo<{
  children: React.ReactNode;
  isVisible: boolean;
}>(({ children, isVisible }) => {
  // Only render expensive content when visible
  if (!isVisible) {
    return (
      <div className="w-full h-full bg-card/30 border border-border/30 rounded-lg animate-pulse" />
    );
  }

  return <>{children}</>;
});

VirtualizedProjectCard.displayName = 'VirtualizedProjectCard';