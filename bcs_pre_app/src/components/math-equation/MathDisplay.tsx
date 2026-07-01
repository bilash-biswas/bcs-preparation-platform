// components/MathDisplay.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Katex from 'react-native-katex';

interface MathDisplayProps {
  content: string;
  displayMode?: boolean;
  style?: any;
}

export function MathDisplay({ content, displayMode = false, style }: MathDisplayProps): React.JSX.Element {

  // Clean up LaTeX content
  const cleanContent = content
    .replace(/\\\[/g, '')
    .replace(/\\\]/g, '')
    .replace(/\\\(/g, '')
    .replace(/\\\)/g, '');

  return (
    <View style={[styles.container, style]}>
      <Katex
        expression={cleanContent}
        style={styles.katex}
        displayMode={displayMode}
        inlineStyle={inlineStyle}
        onError={(error) => console.warn('KaTeX error:', error)}
        onLoadEnd={() => console.log('KaTeX loaded successfully')}
      />
    </View>
  );
}

const { width } = Dimensions.get('window');

const inlineStyle = `
  body {
    margin: 0;
    padding: 0;
  }
  .katex {
    font-size: 16px;
    color: #000;
  }
  .katex-display {
    margin: 0;
  }
`;

const displayStyle = `
  body {
    margin: 0;
    padding: 0;
  }
  .katex {
    font-size: 18px;
    color: #000;
  }
  .katex-display {
    margin: 0;
    text-align: center;
  }
`;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
  },
  katex: {
    flex: 1,
    minHeight: 24,
  },
});