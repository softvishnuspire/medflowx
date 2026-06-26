import { useState, KeyboardEvent } from 'react';

interface UseKeyboardNavProps {
  itemCount: number;
  onSelect: (index: number) => void;
  onClose?: () => void;
}

export function useKeyboardNav({ itemCount, onSelect, onClose }: UseKeyboardNavProps) {
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLDivElement>) => {
    if (itemCount === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < itemCount - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : itemCount - 1));
        break;
      case 'Enter':
        if (activeIndex >= 0 && activeIndex < itemCount) {
          e.preventDefault();
          onSelect(activeIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setActiveIndex(-1);
        if (onClose) onClose();
        break;
      default:
        break;
    }
  };

  return {
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    resetIndex: () => setActiveIndex(-1),
  };
}
