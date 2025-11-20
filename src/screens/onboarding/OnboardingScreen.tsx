import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { setBooleanItem } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants/config';

const { width } = Dimensions.get('window');

interface OnboardingItem {
  id: string;
  title: string;
  description: string;
}

const onboardingData: OnboardingItem[] = [
  { id: '1', title: 'Welcome to Smart Bus', description: 'Your intelligent transport companion for easy and efficient travel' },
  { id: '2', title: 'Find Your Routes', description: 'Get personalized route suggestions based on your destination' },
  { id: '3', title: 'Track Buses Live', description: 'See real-time bus locations and never miss your ride' },
];

export const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const completeOnboarding = async () => {
    await setBooleanItem(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
    // No navigation needed – AppNavigator detects it instantly now!
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  // ← YOUR EXACT renderItem – NOT CHANGED AT ALL
  const renderItem = ({ item }: { item: OnboardingItem }) => (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>🚌</Text>
        </View>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {onboardingData.map((_, index) => (
        <View
          key={index}
          style={[styles.dot, index === currentIndex && styles.activeDot]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={completeOnboarding}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {renderDots()}

      <View style={styles.buttonContainer}>
        {currentIndex < onboardingData.length - 1 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.getStartedButton} onPress={completeOnboarding}>
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  skipButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  skipText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  slide: { width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  imageContainer: { marginBottom: 40 },
  imagePlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 125,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 100 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 16 },
  description: { fontSize: 16, color: COLORS.textLight, textAlign: 'center', lineHeight: 24 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border, marginHorizontal: 4 },
  activeDot: { backgroundColor: COLORS.primary, width: 24 },
  buttonContainer: { paddingHorizontal: 40, paddingBottom: 50 },
  nextButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  nextText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  getStartedButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  getStartedText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});