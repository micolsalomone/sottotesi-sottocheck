import React, { useState, useCallback } from 'react';

export function useTableResize(initialWidths: Record<string, number>) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(initialWidths);

  const handleResize = useCallback((columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.pageX;
    const startWidth = columnWidths[columnKey];

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.pageX - startX;
      setColumnWidths(prev => ({
        ...prev,
        [columnKey]: Math.max(50, startWidth + diff)
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columnWidths]);

  return { columnWidths, handleResize, setColumnWidths };
}
