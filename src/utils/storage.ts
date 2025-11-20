import AsyncStorage from '@react-native-async-storage/async-storage';

export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Error saving to AsyncStorage:', error);
    throw error;
  }
};

export const getItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('Error reading from AsyncStorage:', error);
    return null;
  }
};

export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from AsyncStorage:', error);
    throw error;
  }
};

// Helper function to set boolean values
export const setBooleanItem = async (key: string, value: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving boolean to AsyncStorage:', error);
    throw error;
  }
};

// Helper function to get boolean values
export const getBooleanItem = async (key: string): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value === 'true' || value === 'true';
  } catch (error) {
    console.error('Error reading boolean from AsyncStorage:', error);
    return false;
  }
};