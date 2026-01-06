// src/components/rewards/TierBadge.tsx
// Visual badge component for displaying driver tier

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TierType, getTierInfo } from '../../utils/rewardCalculations';

interface TierBadgeProps {
  tier: TierType;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ 
  tier, 
  size = 'medium', 
  showLabel = true 
}) => {
  const tierInfo = getTierInfo(tier);
  
  const sizes = {
    small: { container: 50, icon: 24, text: 10 },
    medium: { container: 80, icon: 36, text: 12 },
    large: { container: 120, icon: 52, text: 14 }
  };
  
  const currentSize = sizes[size];
  
  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.badge, 
          { 
            width: currentSize.container, 
            height: currentSize.container,
            backgroundColor: `${tierInfo.color}20`,
            borderColor: tierInfo.color
          }
        ]}
      >
        <Ionicons 
          name={tierInfo.icon as any} 
          size={currentSize.icon} 
          color={tierInfo.color} 
        />
      </View>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.tierName, { fontSize: currentSize.text + 2 }]}>
            {tierInfo.name}
          </Text>
          <Text style={[styles.tierDesc, { fontSize: currentSize.text }]}>
            {tierInfo.description}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badge: {
    borderRadius: 100,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelContainer: {
    alignItems: 'center',
  },
  tierName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  tierDesc: {
    color: '#666',
    textAlign: 'center',
  },
});
