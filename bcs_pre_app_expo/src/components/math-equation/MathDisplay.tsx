// src/components/math-equation/MathDisplay.tsx
import React from 'react';
import { Text } from 'react-native';

interface MathDisplayProps {
  content: string;
  style?: any;
  className?: string;
  displayMode?: boolean;
}

export const parseMathToUnicode = (text: string): string => {
  if (!text) return '';

  let processed = text;

  // 1. Convert Fractions: \frac{a}{b} -> (a/b)
  const fracRegex = /\\frac\s*{([^}]+)}{([^}]+)}/g;
  while (fracRegex.test(processed)) {
    processed = processed.replace(fracRegex, '($1/$2)');
  }

  // 2. Convert Square Roots: \sqrt{x} -> √x
  const sqrtRegex = /\\sqrt\s*{([^}]+)}/g;
  while (sqrtRegex.test(processed)) {
    processed = processed.replace(sqrtRegex, '√$1');
  }

  // 3. Convert Superscripts: e.g. x^2 or x^{2+y}
  const superMap: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'x': 'ˣ', 'y': 'ʸ', 'r': 'ʳ', 'i': 'ⁱ'
  };
  processed = processed.replace(/\^{([^}]+)}/g, (match, p1) => {
    return p1.split('').map((char: string) => superMap[char] || char).join('');
  });
  processed = processed.replace(/\^([0-9nxy])/g, (match, p1) => {
    return superMap[p1] || p1;
  });

  // 4. Convert Subscripts: e.g. x_2 or x_{ab}
  const subMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎', 'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ'
  };
  processed = processed.replace(/_{([^}]+)}/g, (match, p1) => {
    return p1.split('').map((char: string) => subMap[char] || char).join('');
  });
  processed = processed.replace(/_([0-9a-ox])/g, (match, p1) => {
    return subMap[p1] || p1;
  });

  // 5. Replace LaTeX Math Symbols
  const symbolMap: Record<string, string> = {
    '\\\\times': '×',
    '\\\\div': '÷',
    '\\\\pm': '±',
    '\\\\neq': '≠',
    '\\\\ne': '≠',
    '\\\\leq': '≤',
    '\\\\le': '≤',
    '\\\\geq': '≥',
    '\\\\ge': '≥',
    '\\\\approx': '≈',
    '\\\\infty': '∞',
    '\\\\propto': '∝',
    '\\\\pi': 'π',
    '\\\\theta': 'θ',
    '\\\\alpha': 'α',
    '\\\\beta': 'β',
    '\\\\gamma': 'γ',
    '\\\\Delta': 'Δ',
    '\\\\lambda': 'λ',
    '\\\\sigma': 'σ',
    '\\\\omega': 'ω',
    '\\\\phi': 'φ',
    '\\\\mu': 'μ',
    '\\\\cdot': '·',
    '\\\\bullet': '•',
    '\\\\deg': '°',
    '\\\\degree': '°',
    '\\\\angle': '∠',
    '\\\\triangle': '△',
    '\\\\subset': '⊂',
    '\\\\supset': '⊃',
    '\\\\subseteq': '⊆',
    '\\\\supseteq': '⊇',
    '\\\\cap': '∩',
    '\\\\cup': '∪',
    '\\\\in': '∈',
    '\\\\notin': '∉',
    '\\\\emptyset': '∅',
    '\\\\empty': '∅',
    '\\\\log': 'log',
    '\\\\ln': 'ln',
    '\\\\sin': 'sin',
    '\\\\cos': 'cos',
    '\\\\tan': 'tan',
    '\\\\sec': 'sec',
    '\\\\csc': 'csc',
    '\\\\cot': 'cot',
    '\\\\parallel': '||',
    '\\\\percent': '%',
  };

  Object.entries(symbolMap).forEach(([latex, unicode]) => {
    const regex = new RegExp(latex, 'g');
    processed = processed.replace(regex, unicode);
  });

  // 6. Clean delimiters and formatting wrappers
  processed = processed
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
    .replace(/\\\[/g, '')
    .replace(/\\\]/g, '')
    .replace(/\\\(/g, '')
    .replace(/\\\)/g, '')
    .replace(/\\text\s*{([^}]+)}/g, '$1')
    .replace(/\\mathrm\s*{([^}]+)}/g, '$1')
    .replace(/\\quad/g, ' ')
    .replace(/\\qquad/g, '  ')
    .replace(/\\,/g, ' ')
    .replace(/\\;/g, ' ')
    .replace(/\\!/g, '')
    .replace(/\\{/g, '{')
    .replace(/\\}/g, '}');

  return processed;
};

export const MathDisplay = ({ content, style, className }: MathDisplayProps): React.JSX.Element => {
  const unicodeText = parseMathToUnicode(content);
  return (
    <Text style={style} className={className}>
      {unicodeText}
    </Text>
  );
};