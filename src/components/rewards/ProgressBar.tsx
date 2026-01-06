// src/components/rewards/ProgressBar.tsx
// Animated progress bar component

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  height?: number;
  showPercentage?: boolean;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  color = '#22C55E',
  height = 8,
  showPercentage = true,
  label
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {showPercentage && (
            <Text style={styles.percentage}>{Math.round(clampedProgress)}%</Text>
          )}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View 
          style={[
            styles.fill, 
            { 
              width: `${clampedProgress}%`, 
              backgroundColor: color,
              height 
            }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  percentage: {
    fontSize: 13,
    color: '#666',
    fontWeight: 'bold',
  },
  track: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 100,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 100,
  },
});
