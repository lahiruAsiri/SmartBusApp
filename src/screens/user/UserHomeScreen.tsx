// ============================================
// COMPLETE USER HOME SCREEN WITH DARK MODE
// ============================================

// File: src/screens/user/UserHomeScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { getInitialMapRegion, MAP_CONFIG } from '../../constants/config';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Alert } from 'react-native';
import { subscribeToAllBuses, getNearbyBuses, Bus } from '../../services/busService';
import { getCurrentLocation, UserLocation } from '../../services/locationService';

const { width } = Dimensions.get('window');

const SAVED_LOCATIONS = [
  { id: '1', name: 'Home', route: '71', from: 'Negombo', arrivalTime: '7 min' },
  { id: '2', name: 'Office', route: '138', from: 'Town Hall', arrivalTime: '15 min' },
];

export const UserHomeScreen = ({ navigation }: any) => {
  const { userData, logout } = useAuth();
  const { isDark, colors, toggleTheme } = useTheme();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [buses, setBuses] = useState<Bus[]>([]);
  const [nearbyBuses, setNearbyBuses] = useState<Bus[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [miniMapRegion, setMiniMapRegion] = useState(MAP_CONFIG.initialRegion);


  // Fetch user location on mount
  useEffect(() => {
    const fetchLocation = async () => {
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation(location);
      } else {
        Alert.alert(
          'Location Required',
          'Please enable location services to see nearby buses.',
          [{ text: 'OK' }]
        );
        // Use default location (Negombo)
        setUserLocation({ latitude: 7.2906, longitude: 79.8570 });
      }
    };
    fetchLocation();
  }, []);

  // Subscribe to nearby buses based on user location
  useEffect(() => {
    if (!userLocation) return;

    setLoading(true);
    const unsubscribe = getNearbyBuses(
      userLocation.latitude,
      userLocation.longitude,
      10, // 10km radius
      (buses) => {
        setNearbyBuses(buses);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userLocation]);

  // Subscribe to all buses for map view
  useEffect(() => {
    const unsubscribe = subscribeToAllBuses(
      (buses) => {
        setBuses(buses);
      },
      (error) => {
        console.error('Error loading buses:', error);
        Alert.alert('Error', 'Failed to load bus data');
      }
    );

    return () => unsubscribe();
  }, []);

  // Load user location for mini map
  useEffect(() => {
    const loadLocation = async () => {
      const region = await getInitialMapRegion();
      setMiniMapRegion(region);
    };
    loadLocation();
  }, []);

  const toggleSidebar = () => {
    const toValue = sidebarVisible ? -width * 0.8 : 0;
    const overlayTo = sidebarVisible ? 0 : 1;

    Animated.parallel([
      Animated.spring(sidebarAnim, {
        toValue,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(overlayAnim, {
        toValue: overlayTo,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setSidebarVisible(!sidebarVisible);
  };

  const getOccupancyColor = (occ: number) => {
    if (occ < 50) return '#22C55E';
    if (occ <= 75) return '#F59E0B';
    return '#EF4444';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
          <Ionicons name="menu-outline" size={28} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Image
                        source={require('../../../assets/AppLogo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                      />
        </View>

        <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greeting, { color: colors.text }]}>{getGreeting()},</Text>
          <Text style={[styles.userName, { color: colors.primary }]}>
            {userData?.displayName}
          </Text>
        </View>

        {/* Search Bar */}
        <TouchableOpacity style={[styles.searchBar, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={22} color={colors.textLight} />
          <Text style={[styles.searchPlaceholder, { color: colors.textLight }]}>
            Enter the destination
          </Text>
          <View style={[styles.miniMapIconBtn, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="location" size={18} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Mini Map Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Live Tracking</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Map')}>
              <Text style={[styles.showAllText, { color: colors.primary }]}>View full map</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.miniMapContainer, { backgroundColor: colors.card }]}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Map')}
          >
            <MapView
              style={styles.miniMap}
              provider={PROVIDER_DEFAULT}
              initialRegion={miniMapRegion}  // Use dynamic region
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              pointerEvents="none"
            >
              <UrlTile urlTemplate={MAP_CONFIG.osmTileUrl} maximumZ={19} flipY={false} />

              {nearbyBuses.map((bus) => (
                <Marker key={bus.id} coordinate={bus.location}>
                  <View
                    style={[
                      styles.mapMarker,
                      { backgroundColor: getOccupancyColor(bus.occupancy) },
                    ]}
                  >
                    <Ionicons name="bus" size={12} color="#FFF" />
                  </View>
                </Marker>
              ))}
            </MapView>

            <View style={[styles.miniMapOverlay, { backgroundColor: colors.card }]}>
              <View style={styles.miniMapInfo}>
                <View style={styles.miniMapInfoLeft}>
                  <Ionicons name="bus" size={20} color={colors.primary} />
                  <Text style={[styles.miniMapInfoText, { color: colors.text }]}>
                    {nearbyBuses.length} buses nearby
                  </Text>
                </View>
                <View style={[styles.miniMapBadge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="expand-outline" size={16} color="#FFF" />
                  <Text style={styles.miniMapBadgeText}>Expand</Text>
                </View>
              </View>

              <View style={styles.quickBusList}>
                {nearbyBuses.slice(0, 2).map((bus) => (
                  <View
                    key={bus.id}
                    style={[
                      styles.quickBusItem,
                      { backgroundColor: isDark ? colors.background : '#F8FAFC' },
                    ]}
                  >
                    <View
                      style={[
                        styles.quickBusBadge,
                        { backgroundColor: getOccupancyColor(bus.occupancy) },
                      ]}
                    >
                      <Text style={styles.quickBusNumber}>{bus.routeNumber}</Text>
                    </View>
                    <View style={styles.quickBusInfo}>
                      <Text
                        style={[styles.quickBusDestination, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {bus.destination}
                      </Text>
                      <Text style={[styles.quickBusTime, { color: colors.textLight }]}>
                        {bus.arrivalTime}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View
              style={[
                styles.mapLegend,
                { backgroundColor: isDark ? colors.card : 'rgba(255,255,255,0.95)' },
              ]}
            >
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
                <Text style={[styles.legendText, { color: colors.textLight }]}>Available</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={[styles.legendText, { color: colors.textLight }]}>Moderate</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={[styles.legendText, { color: colors.textLight }]}>Crowded</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Your Routes Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your routes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Map')}>
              <Text style={[styles.showAllText, { color: colors.primary }]}>View map</Text>
            </TouchableOpacity>
          </View>

          {nearbyBuses.slice(0, 2).map((bus) => (
            <TouchableOpacity
              key={bus.id}
              style={[styles.routeCard, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate('BusDetails', { bus })}
            >
              <View
                style={[
                  styles.routeBadge,
                  { backgroundColor: getOccupancyColor(bus.occupancy) },
                ]}
              >
                <Text style={styles.routeNumber}>{bus.routeNumber}</Text>
              </View>

              <View style={styles.routeInfo}>
                <Text style={[styles.routeDestination, { color: colors.text }]}>
                  {bus.destination}
                </Text>
                <Text style={[styles.routeFrom, { color: colors.textLight }]}>
                  from {bus.from}
                </Text>
              </View>

              <View style={styles.routeTime}>
                <Text style={[styles.arrivalText, { color: colors.text }]}>
                  in {bus.arrivalTime}
                </Text>
                <Text
                  style={[
                    styles.statusText,
                    { color: bus.status === 'On time' ? '#22C55E' : '#F59E0B' },
                  ]}
                >
                  {bus.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Your Addresses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your addresses</Text>
            <TouchableOpacity>
              <Text style={[styles.showAllText, { color: colors.primary }]}>Manage</Text>
            </TouchableOpacity>
          </View>

          {SAVED_LOCATIONS.map((loc) => (
            <TouchableOpacity
              key={loc.id}
              style={[styles.addressCard, { backgroundColor: colors.card }]}
            >
              <View
                style={[
                  styles.addressIcon,
                  { backgroundColor: isDark ? colors.background : '#F1F5F9' },
                ]}
              >
                <Ionicons
                  name={loc.name === 'Home' ? 'home-outline' : 'briefcase-outline'}
                  size={22}
                  color={colors.textLight}
                />
              </View>

              <View style={styles.addressInfo}>
                <View style={styles.addressNameRow}>
                  <Text style={[styles.addressName, { color: colors.text }]}>{loc.name}</Text>
                  <View style={[styles.routeSmallBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.routeSmallText}>{loc.route}</Text>
                  </View>
                </View>
                <Text style={[styles.addressFrom, { color: colors.textLight }]}>
                  from {loc.from}
                </Text>
              </View>

              <Text style={[styles.addressTime, { color: colors.text }]}>
                in {loc.arrivalTime}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Nearby Buses Section */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Nearby buses</Text>
            <TouchableOpacity>
              <Text style={[styles.showAllText, { color: colors.primary }]}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {nearbyBuses.map((bus) => (
            <TouchableOpacity
              key={bus.id}
              style={[styles.busCard, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate('BusDetails', { bus })}
            >
              <View style={styles.busCardLeft}>
                <View
                  style={[
                    styles.busRouteBadge,
                    { backgroundColor: getOccupancyColor(bus.occupancy) },
                  ]}
                >
                  <Text style={styles.busRouteNumber}>{bus.routeNumber}</Text>
                </View>
                <View style={styles.busInfo}>
                  <Text style={[styles.busDestination, { color: colors.text }]}>
                    {bus.destination}
                  </Text>
                  <Text style={[styles.busFrom, { color: colors.textLight }]}>
                    from {bus.from}
                  </Text>
                </View>
              </View>

              <View style={styles.busCardRight}>
                <Text style={[styles.busArrival, { color: colors.text }]}>
                  {bus.arrivalTime}
                </Text>
                <View style={[styles.occupancyIndicator, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.occupancyBar,
                      {
                        width: `${bus.occupancy}%`,
                        backgroundColor: getOccupancyColor(bus.occupancy),
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.occupancyText,
                    { color: getOccupancyColor(bus.occupancy) },
                  ]}
                >
                  {bus.occupancy}% full
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Sidebar Overlay */}
      <Animated.View
        pointerEvents={sidebarVisible ? 'auto' : 'none'}
        style={[styles.overlay, { opacity: overlayAnim }]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={toggleSidebar}
        />
      </Animated.View>

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          { transform: [{ translateX: sidebarAnim }], backgroundColor: colors.card },
        ]}
      >
        <View style={[styles.sidebarHeader, { backgroundColor: colors.primary }]}>
          <View style={styles.sidebarAvatar}>
            <Text style={[styles.sidebarAvatarText, { color: colors.primary }]}>
              {userData?.displayName?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.sidebarName}>{userData?.displayName}</Text>
          <Text style={styles.sidebarEmail}>{userData?.email}</Text>
        </View>

        <ScrollView style={styles.sidebarMenu}>
          <MenuItem icon="home-outline" label="Home" colors={colors} onPress={toggleSidebar} />
          <MenuItem
            icon="map-outline"
            label="Live Map"
            colors={colors}
            onPress={() => {
              toggleSidebar();
              navigation.navigate('Map');
            }}
          />
          <MenuItem icon="star-outline" label="Favorites" colors={colors} />
          <MenuItem icon="time-outline" label="Trip History" colors={colors} />
          <MenuItem icon="ticket-outline" label="My Tickets" colors={colors} />
          <MenuItem icon="notifications-outline" label="Notifications" colors={colors} />
          <MenuItem
            icon="settings-outline"
            label="Settings"
            colors={colors}
            onPress={() => {
              toggleSidebar();
              navigation.navigate('Settings');
            }}
          />

          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

          {/* Theme Toggle */}
          <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={22}
              color={colors.primary}
            />
            <Text style={[styles.menuLabel, { color: colors.text }]}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Text>
          </TouchableOpacity>

          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

          <MenuItem icon="help-circle-outline" label="Help & Support" colors={colors} />
          <MenuItem icon="information-circle-outline" label="About" colors={colors} />
          <MenuItem
            icon="log-out-outline"
            label="Logout"
            colors={colors}
            isLogout
            onPress={() => {
              toggleSidebar();
              logout();
            }}
          />
        </ScrollView>
      </Animated.View>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          { backgroundColor: colors.card, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color={colors.primary} />
          <Text style={[styles.navLabelActive, { color: colors.primary }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="ticket-outline" size={24} color={colors.textLight} />
          <Text style={[styles.navLabel, { color: colors.textLight }]}>Tickets</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Map')}>
          <Ionicons name="map-outline" size={24} color={colors.textLight} />
          <Text style={[styles.navLabel, { color: colors.textLight }]}>Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={toggleSidebar}>
          <Ionicons name="menu-outline" size={24} color={colors.textLight} />
          <Text style={[styles.navLabel, { color: colors.textLight }]}>More</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Menu Item Component
const MenuItem = ({ icon, label, onPress, isLogout, colors }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Ionicons name={icon} size={22} color={isLogout ? '#EF4444' : colors.text} />
    <Text style={[styles.menuLabel, { color: isLogout ? '#EF4444' : colors.text }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 20,
  },
  menuButton: {
    padding: 4,
  },
  themeButton: {
    padding: 4,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 200, height: 50 },
  content: {
    flex: 1,
  },
  greetingSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '300',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 25,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  miniMapIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  showAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  miniMapContainer: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  miniMap: {
    height: 180,
    width: '100%',
  },
  mapMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  miniMapOverlay: {
    padding: 16,
  },
  miniMapInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  miniMapInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniMapInfoText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  miniMapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  miniMapBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 4,
  },
  quickBusList: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBusItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
  },
  quickBusBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBusNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  quickBusInfo: {
    flex: 1,
    marginLeft: 8,
  },
  quickBusDestination: {
    fontSize: 13,
    fontWeight: '600',
  },
  quickBusTime: {
    fontSize: 11,
    marginTop: 2,
  },
  mapLegend: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    borderRadius: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '500',
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  routeBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  routeInfo: {
    flex: 1,
    marginLeft: 14,
  },
  routeDestination: {
    fontSize: 16,
    fontWeight: '600',
  },
  routeFrom: {
    fontSize: 13,
    marginTop: 2,
  },
  routeTime: {
    alignItems: 'flex-end',
  },
  arrivalText: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  addressIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressInfo: {
    flex: 1,
    marginLeft: 14,
  },
  addressNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
  },
  routeSmallBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  routeSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  addressFrom: {
    fontSize: 13,
    marginTop: 2,
  },
  addressTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  busCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  busCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  busRouteBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busRouteNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  busInfo: {
    marginLeft: 14,
    flex: 1,
  },
  busDestination: {
    fontSize: 15,
    fontWeight: '600',
  },
  busFrom: {
    fontSize: 12,
    marginTop: 2,
  },
  busCardRight: {
    alignItems: 'flex-end',
  },
  busArrival: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  occupancyIndicator: {
    width: 60,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  occupancyBar: {
    height: '100%',
    borderRadius: 3,
  },
  occupancyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.8,
    zIndex: 101,
  },
  sidebarHeader: {
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sidebarAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sidebarAvatarText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  sidebarName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  sidebarEmail: {
    fontSize: 13,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
  },
  sidebarMenu: {
    flex: 1,
    paddingTop: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuLabel: {
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    marginVertical: 10,
    marginHorizontal: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingBottom: 25,
    borderTopWidth: 1,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  navLabelActive: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
});