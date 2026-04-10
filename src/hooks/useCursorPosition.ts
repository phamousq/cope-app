import { useState, useEffect, useRef, RefObject } from 'react';

interface CursorPosition {
  x: number;
  y: number;
}

export function useCursorPosition(ref: RefObject<HTMLElement | null>) {
  const [position, setPosition] = useState<CursorPosition>({ x: 50, y: 50 });
  const lastPositionRef = useRef<CursorPosition>({ x: 50, y: 50 });
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      lastPositionRef.current = { x, y };
      setPosition({ x, y });
    };
    
    // Don't reset on mouse leave - keep the last position
    // This makes the gradient "freeze" at the edge where mouse exited
    
    element.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
    };
  }, [ref]);
  
  return position;
}
