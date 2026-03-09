// File: src/screens/user/ChatScreen.tsx
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '../../contexts/ThemeContext';
import { MAP_CONFIG, ML_API_URL } from '../../constants/config';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    type: 'text' | 'rich_response' | 'ai_prediction' | 'crowd_forecast';
    data?: any;
}

const SUGGESTIONS = [
    { label: "🚌 ETA for 400/4", query: "What is the ETA for 400/4?" },
    { label: "👥 Crowds tmrw 9am", query: "Will 400/4 be crowded tomorrow 9am?" },
    { label: "📍 Find bus to Malabe", query: "Find bus to Malabe" },
];

export const ChatScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hello! I'm your Smart Bus Assistant. Ask me about arrival times, passenger density, or bus routes.",
            sender: 'bot',
            timestamp: new Date(),
            type: 'text',
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const sendMessage = (text: string) => {
        if (!text.trim()) return;

        const newUserMsg: Message = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date(),
            type: 'text',
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputText('');
        setIsTyping(true);

        fetch(`${ML_API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.success && data.message) {
                    const botMsg = { ...data.message, timestamp: new Date(data.message.timestamp) };
                    setMessages(prev => [...prev, botMsg]);
                } else {
                    throw new Error("Invalid response");
                }
            })
            .catch(() => {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: "I'm having trouble connecting to the server. Please check your connection and try again.",
                    sender: 'bot',
                    timestamp: new Date(),
                    type: 'text',
                }]);
            })
            .finally(() => {
                setIsTyping(false);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            });
    };

    // ── Helper to derive crowd color/label ──────────────────
    const getCrowdColor = (level: number) => {
        if (level >= 75) return '#EF4444';
        if (level >= 45) return '#F59E0B';
        return '#22C55E';
    };
    const getCrowdLabel = (level: number) => {
        if (level >= 75) return 'Very Busy';
        if (level >= 45) return 'Moderate';
        return 'Quiet';
    };

    // ── Renders one message bubble ───────────────────────────
    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        const textColor = isUser ? '#FFF' : colors.text;
        const subTextColor = isUser ? 'rgba(255,255,255,0.75)' : colors.textLight;

        return (
            <View style={[styles.msgRow, isUser ? styles.userRow : styles.botRow]}>
                {!isUser && (
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                        <Ionicons name="bus" size={14} color="#FFF" />
                    </View>
                )}

                <View style={[
                    styles.bubble,
                    isUser
                        ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                        : { backgroundColor: colors.card, borderTopLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
                    { maxWidth: width * 0.82 }
                ]}>
                    <Text style={{ fontSize: 15, lineHeight: 22, color: textColor }}>{item.text}</Text>

                    {/* ━━━ ETA CARD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    {item.type === 'ai_prediction' && item.data && (
                        <View style={[styles.predCard, {
                            backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : '#EEF2FF',
                            borderColor: isDark ? 'rgba(99,102,241,0.3)' : '#C7D2FE',
                        }]}>
                            {/* Header */}
                            <View style={styles.cardHeader}>
                                <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#E0E7FF' }]}>
                                    <Ionicons name="time-outline" size={16} color="#6366F1" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text style={{ color: '#6366F1', fontWeight: '700', fontSize: 13 }}>
                                        Arrival Estimate · Route {item.data.route}
                                    </Text>
                                    <Text style={{ color: colors.textLight, fontSize: 11 }}>Based on real-time traffic patterns</Text>
                                </View>
                                <View style={[styles.confBadge, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#E0E7FF' }]}>
                                    <Text style={{ color: '#6366F1', fontSize: 10, fontWeight: '700' }}>{item.data.confidence}</Text>
                                </View>
                            </View>

                            {/* ETA Comparison */}
                            <View style={styles.etaRow}>
                                <View style={styles.etaBox}>
                                    <Text style={{ color: colors.textLight, fontSize: 10, marginBottom: 2 }}>Scheduled</Text>
                                    <Text style={{ color: colors.textLight, fontSize: 20, fontWeight: '700', textDecorationLine: 'line-through' }}>
                                        {item.data.standardEta}
                                    </Text>
                                </View>
                                <View style={[styles.arrowCircle, { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#E0E7FF' }]}>
                                    <Ionicons name="arrow-forward" size={16} color="#6366F1" />
                                </View>
                                <View style={styles.etaBox}>
                                    <Text style={{ color: '#6366F1', fontSize: 10, marginBottom: 2 }}>Updated ETA</Text>
                                    <Text style={{ color: '#6366F1', fontSize: 24, fontWeight: '800' }}>
                                        {item.data.aiEta}
                                    </Text>
                                </View>
                            </View>

                            {/* Reason Banner */}
                            <View style={[styles.reasonRow, {
                                backgroundColor: item.data.reason.toLowerCase().includes('higher')
                                    ? (isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2')
                                    : (isDark ? 'rgba(34,197,94,0.1)' : '#F0FDF4'),
                                borderLeftColor: item.data.reason.toLowerCase().includes('higher') ? '#EF4444' : '#22C55E',
                            }]}>
                                <Ionicons
                                    name={item.data.reason.toLowerCase().includes('higher') ? 'warning-outline' : 'checkmark-circle-outline'}
                                    size={14}
                                    color={item.data.reason.toLowerCase().includes('higher') ? '#EF4444' : '#22C55E'}
                                />
                                <Text style={{
                                    marginLeft: 6, fontSize: 12, fontWeight: '600',
                                    color: item.data.reason.toLowerCase().includes('higher') ? '#EF4444' : '#22C55E',
                                    flex: 1,
                                }}>
                                    {item.data.reason}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* ━━━ CROWD CARD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    {item.type === 'crowd_forecast' && item.data && (() => {
                        const occ = item.data.currentOccupancy;
                        const crowdColor = getCrowdColor(occ);
                        const crowdLabel = getCrowdLabel(occ);

                        return (
                            <View style={[styles.predCard, {
                                backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB',
                                borderColor: isDark ? 'rgba(245,158,11,0.3)' : '#FDE68A',
                            }]}>
                                {/* Header */}
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7' }]}>
                                        <MaterialCommunityIcons name="account-group" size={16} color="#F59E0B" />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={{ color: '#D97706', fontWeight: '700', fontSize: 13 }}>
                                            Passenger Density · Route {item.data.route}
                                        </Text>
                                        <Text style={{ color: colors.textLight, fontSize: 11 }}>{item.data.context}</Text>
                                    </View>
                                </View>

                                {/* Big occupancy circle + mini bar chart */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                    {/* Circle gauge */}
                                    <View style={[styles.gaugeCircle, { borderColor: crowdColor }]}>
                                        <Text style={{ color: crowdColor, fontSize: 22, fontWeight: '800' }}>{occ}%</Text>
                                        <Text style={{ color: crowdColor, fontSize: 9, fontWeight: '600' }}>{crowdLabel}</Text>
                                    </View>

                                    {/* Mini bar chart */}
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 60, marginLeft: 16 }}>
                                        {item.data.forecast.map((f: any, i: number) => {
                                            const fc = getCrowdColor(f.level);
                                            const isTarget = f.time === 'Target';
                                            return (
                                                <View key={i} style={{ alignItems: 'center' }}>
                                                    <Text style={{ fontSize: 9, color: colors.textLight, marginBottom: 3 }}>{f.level}%</Text>
                                                    <View style={{
                                                        width: isTarget ? 22 : 14,
                                                        height: Math.max(8, (f.level / 100) * 44),
                                                        backgroundColor: isTarget ? fc : `${fc}60`,
                                                        borderRadius: 4,
                                                        borderWidth: isTarget ? 1.5 : 0,
                                                        borderColor: isTarget ? fc : 'transparent',
                                                    }} />
                                                    <Text style={{ fontSize: 9, color: colors.textLight, marginTop: 3 }}>{f.time}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>

                                {/* Recommendation */}
                                <View style={[styles.reasonRow, {
                                    backgroundColor: crowdColor === '#EF4444'
                                        ? (isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2')
                                        : (isDark ? 'rgba(34,197,94,0.1)' : '#F0FDF4'),
                                    borderLeftColor: crowdColor,
                                }]}>
                                    <Ionicons
                                        name={occ >= 75 ? 'alert-circle-outline' : 'thumbs-up-outline'}
                                        size={14}
                                        color={crowdColor}
                                    />
                                    <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: '600', color: crowdColor, flex: 1 }}>
                                        {item.data.recommendation}
                                    </Text>
                                </View>
                            </View>
                        );
                    })()}

                    {/* ━━━ RICH RESPONSE (map) ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    {item.type === 'rich_response' && item.data && (
                        <View style={{ marginTop: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <View style={[styles.iconCircle, { backgroundColor: '#22C55E' }]}>
                                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 11 }}>{item.data.busRoute}</Text>
                                </View>
                                <View style={{ marginLeft: 8 }}>
                                    <Text style={{ color: textColor, fontWeight: '600' }}>Route {item.data.busRoute}</Text>
                                    <Text style={{ color: subTextColor, fontSize: 12 }}>Seats: {item.data.seatsAvailable ? 'Available' : 'Full'}</Text>
                                </View>
                            </View>
                            {item.data.coordinates && (
                                <View style={{ height: 130, borderRadius: 12, overflow: 'hidden' }}>
                                    <MapView
                                        provider={PROVIDER_DEFAULT}
                                        style={StyleSheet.absoluteFillObject}
                                        initialRegion={{
                                            latitude: item.data.coordinates.latitude,
                                            longitude: item.data.coordinates.longitude,
                                            latitudeDelta: 0.01,
                                            longitudeDelta: 0.01,
                                        }}
                                        scrollEnabled={false}
                                        zoomEnabled={false}
                                    >
                                        <UrlTile urlTemplate={MAP_CONFIG.osmTileUrl} maximumZ={19} flipY={false} />
                                        <Marker coordinate={item.data.coordinates} />
                                    </MapView>
                                </View>
                            )}
                        </View>
                    )}

                    <Text style={{ fontSize: 10, marginTop: 6, alignSelf: 'flex-end', color: subTextColor }}>
                        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
                        <Ionicons name="bus" size={18} color="#FFF" />
                    </View>
                    <View>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Bus Assistant</Text>
                        <Text style={{ fontSize: 12, color: '#22C55E', fontWeight: '600' }}>● Online</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListFooterComponent={
                    isTyping ? (
                        <View style={[styles.msgRow, styles.botRow]}>
                            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                                <Ionicons name="bus" size={14} color="#FFF" />
                            </View>
                            <View style={[styles.bubble, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
                                <Text style={{ color: colors.textLight, fontStyle: 'italic', fontSize: 13 }}>Calculating...</Text>
                            </View>
                        </View>
                    ) : null
                }
            />

            {/* Suggestion Chips — ALWAYS VISIBLE */}
            <View style={[styles.suggestionsWrap, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                    {SUGGESTIONS.map((s, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => sendMessage(s.query)}
                        >
                            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>{s.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Input */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={[styles.inputBar, {
                    backgroundColor: colors.card,
                    borderTopColor: colors.border,
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom + 4 : 12,
                }]}>
                    <TextInput
                        style={[styles.input, { backgroundColor: isDark ? colors.background : '#F1F5F9', color: colors.text }]}
                        placeholder="Ask me about your bus..."
                        placeholderTextColor={colors.textLight}
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={() => sendMessage(inputText)}
                        returnKeyType="send"
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.border }]}
                        onPress={() => sendMessage(inputText)}
                        disabled={!inputText.trim()}
                    >
                        <Ionicons name="send" size={18} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    headerIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 10 },

    msgRow: { marginBottom: 14, flexDirection: 'row', alignItems: 'flex-end' },
    userRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
    botRow: { alignSelf: 'flex-start' },
    avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    bubble: { padding: 12, borderRadius: 18 },

    // Prediction Cards
    predCard: { marginTop: 12, borderRadius: 14, borderWidth: 1, padding: 12, gap: 10 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    confBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },

    // ETA specific
    etaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 8 },
    etaBox: { alignItems: 'center' },
    arrowCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

    // Crowd specific
    gaugeCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },

    // Shared
    reasonRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, borderLeftWidth: 3 },

    // Input area
    suggestionsWrap: { borderTopWidth: 1, paddingVertical: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1 },
    input: { flex: 1, height: 44, borderRadius: 22, paddingHorizontal: 16, marginRight: 10, fontSize: 14 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
