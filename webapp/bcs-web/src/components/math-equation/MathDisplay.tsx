// components/MathDisplay.tsx
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import React from 'react';

interface MathDisplayProps {
  content: string;
  displayMode?: boolean;
  className?: string;
}

export function MathDisplay({ content, displayMode = false, className = '' }: MathDisplayProps): React.JSX.Element | null {
  if (!content) return null;

  try {
    return displayMode ? (
      <BlockMath math={content} />
    ) : (
      <InlineMath math={content} />
    );
  } catch (error) {
    console.error('KaTeX rendering error:', error);
    return <span className="text-red-500">Invalid equation: {content}</span>;
  }
}