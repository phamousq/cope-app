import { useState, useEffect, useRef, RefObject } from 'react';

interface CursorPosition {
  x: number;
  y: number;
}

export function useCursorPosition(ref: RefObject<HTMLElement | null>) {
  const [position, setPosition] = useState<CursorPosition>({ x: 50, y: 50 });
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPosition({ x, y });
    };
    
    const handleMouseLeave = () => {
      setPosition({ x: 50, y: 50 });
    };
    
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref]);
  
  return position;
}
