// File: src/utils/busHelpers.ts
export const getOccupancyColor = (occupancy: number): string => {
  if (occupancy < 50) return '#22C55E';
  if (occupancy <= 75) return '#F59E0B';
  return '#EF4444';
};

export const getOccupancyLabel = (occupancy: number): string => {
  if (occupancy < 50) return 'Available';
  if (occupancy <= 75) return 'Moderate';
  return 'Crowded';
};

export const formatLastUpdated = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};