// File: src/screens/user/ChatScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
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
    Image,
    Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '../../contexts/ThemeContext';
import { MAP_CONFIG, ML_API_URL } from '../../constants/config';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Enhanced Message Interface for Research Demo
interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    type: 'text' | 'rich_response' | 'ai_prediction' | 'crowd_forecast';
    data?: any;
}

const SUGGESTIONS = [
    "Predict ETA for 138",
    "Will 336 be crowded tmrw 9am?",
    "Find bus to Malabe",
];

export const ChatScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hello! I'm your Smart Bus Assistant powered by AI. Ask me about predictions or routes!",
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
            text: text,
            sender: 'user',
            timestamp: new Date(),
            type: 'text',
        };

        setMessages((prev) => [...prev, newUserMsg]);
        setInputText('');
        setIsTyping(true);

        setIsTyping(true);

        // Fetch real response from ML backend
        fetch(`${ML_API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.message) {
                    // Parse date string back to Date object
                    const botMsg = {
                        ...data.message,
                        timestamp: new Date(data.message.timestamp)
                    };
                    setMessages(prev => [...prev, botMsg]);
                } else {
                    throw new Error("Invalid response format");
                }
            })
            .catch(err => {
                console.error("NLP Chat Error:", err);
                // Fallback message
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: "My AI servers are currently unreachable. Please try again later.",
                    sender: 'bot',
                    timestamp: new Date(),
                    type: 'text'
                }]);
            })
            .finally(() => {
                setIsTyping(false);
            });
    };

    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [messages, isTyping]);

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';

        // Dynamic Styles based on Theme
        const bubbleColor = isUser ? colors.primary : colors.card;
        const textColor = isUser ? '#FFF' : colors.text;
        const subTextColor = isUser ? 'rgba(255,255,255,0.7)' : colors.textLight;
        const cardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'; // Subtle contrast
        const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

        return (
            <View style={[
                styles.messageRow,
                isUser ? styles.userRow : styles.botRow
            ]}>
                {!isUser && (
                    <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
                        <Ionicons name="sparkles" size={16} color="#FFF" />
                    </View>
                )}

                <View style={[
                    styles.bubble,
                    isUser
                        ? { backgroundColor: colors.primary, borderBottomRightRadius: 2 }
                        : { backgroundColor: colors.card, borderTopLeftRadius: 2, borderWidth: 1, borderColor: colors.border }
                ]}>
                    <Text style={[styles.messageText, { color: textColor }]}>
                        {item.text}
                    </Text>

                    {/* ---------- NOVELTY 1: PREDICTIVE ETA CARD ---------- */}
                    {item.type === 'ai_prediction' && item.data && (
                        <View style={[styles.aiCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
                            <View style={styles.aiHeader}>
                                <MaterialCommunityIcons name="brain" size={16} color="#A855F7" />
                                <Text style={styles.aiTitle}>AI Predictive ETA</Text>
                            </View>

                            <View style={styles.etaRow}>
                                <View style={styles.etaItem}>
                                    <Text style={[styles.etaLabel, { color: subTextColor }]}>Standard</Text>
                                    <Text style={[styles.etaValue, { color: subTextColor, textDecorationLine: 'line-through' }]}>{item.data.standardEta}</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={16} color={subTextColor} />
                                <View style={styles.etaItem}>
                                    <Text style={[styles.etaLabel, { color: '#A855F7' }]}>AI Forecast</Text>
                                    <Text style={[styles.etaValue, { color: '#A855F7', fontWeight: 'bold' }]}>{item.data.aiEta}</Text>
                                </View>
                            </View>

                            <View style={[styles.warningBadge, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2' }]}>
                                <Ionicons name="warning-outline" size={14} color="#EF4444" />
                                <Text style={styles.warningText}>{item.data.reason}</Text>
                            </View>
                            <Text style={[styles.confText, { color: colors.textLight }]}>{item.data.confidence} Confidence Score</Text>
                        </View>
                    )}

                    {/* ---------- NOVELTY 2: CROWD FORECAST CARD ---------- */}
                    {item.type === 'crowd_forecast' && item.data && (
                        <View style={[styles.aiCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
                            <View style={styles.aiHeader}>
                                <MaterialCommunityIcons name="chart-bar" size={16} color="#F59E0B" />
                                <Text style={[styles.aiTitle, { color: '#F59E0B' }]}>
                                    {item.data.context} Forecast
                                </Text>
                            </View>

                            <View style={styles.forecastContainer}>
                                {item.data.forecast.map((f: any, idx: number) => (
                                    <View key={idx} style={styles.forecastBarCol}>
                                        <View style={[styles.barCtx, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                            <View style={[
                                                styles.barFill,
                                                {
                                                    height: `${f.level}%`,
                                                    backgroundColor: f.level > 80 ? '#EF4444' : (f.level < 50 ? '#22C55E' : '#F59E0B')
                                                }
                                            ]} />
                                        </View>
                                        <Text style={[styles.barLabel, { color: subTextColor }]}>{f.time}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={[styles.recBox, { borderColor: '#22C55E' }]}>
                                <Text style={{ color: '#22C55E', fontWeight: '600', fontSize: 12 }}>
                                    AI Tip: {item.data.recommendation}
                                </Text>
                            </View>
                        </View>
                    )}


                    {/* ---------- EXISTING RICH RESPONSE ---------- */}
                    {item.type === 'rich_response' && item.data && (
                        <View style={styles.richContent}>
                            <View style={[styles.divider, { backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : colors.border }]} />
                            <View style={styles.busInfoRow}>
                                <View style={[styles.busBadge, { backgroundColor: '#22C55E' }]}>
                                    <Text style={styles.busBadgeText}>{item.data.busRoute}</Text>
                                </View>
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={[styles.infoLabel, { color: isUser ? '#FFF' : colors.textLight }]}>Crowd: <Text style={{ fontWeight: 'bold', color: item.data.crowdLevel === 'High' ? '#EF4444' : '#22C55E' }}>{item.data.crowdLevel}</Text></Text>
                                    <Text style={[styles.infoLabel, { color: isUser ? '#FFF' : colors.textLight }]}>Seats: <Text style={{ fontWeight: 'bold' }}>{item.data.seatsAvailable ? 'Yes' : 'No'}</Text></Text>
                                </View>
                            </View>
                            {/* Map Preview */}
                            {item.data.coordinates && (
                                <View style={styles.mapContainer}>
                                    <MapView
                                        provider={PROVIDER_DEFAULT}
                                        style={styles.map}
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

                    <Text style={[
                        styles.timestamp,
                        { color: subTextColor }
                    ]}>
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
                <View style={styles.headerTitleRow}>
                    <View style={[styles.headerIcon, { backgroundColor: colors.primary }]}>
                        <Ionicons name="sparkles" size={18} color="#FFF" />
                    </View>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Smart Bus Helper (AI)</Text>
                        <Text style={[styles.headerSubtitle, { color: '#22C55E' }]}>Predictive Engine Active</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListFooterComponent={
                    isTyping ? (
                        <View style={[styles.messageRow, styles.botRow]}>
                            <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
                                <Ionicons name="sparkles" size={16} color="#FFF" />
                            </View>
                            <View style={[styles.bubble, { backgroundColor: colors.card, borderTopLeftRadius: 2, paddingVertical: 12, borderWidth: 1, borderColor: colors.border }]}>
                                <Text style={{ color: colors.textLight, fontStyle: 'italic', fontSize: 12 }}>AI is thinking...</Text>
                            </View>
                        </View>
                    ) : null
                }
            />

            {/* Input Area */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {messages.length < 3 && (
                    <View style={styles.suggestionsContainer}>
                        <FlatList
                            horizontal
                            data={SUGGESTIONS}
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(_, i) => i.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
                                    onPress={() => sendMessage(item)}
                                >
                                    <Text style={{ color: colors.primary, fontSize: 12 }}>{item}</Text>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={{ paddingHorizontal: 16 }}
                        />
                    </View>
                )}

                <View style={[
                    styles.inputContainer,
                    {
                        backgroundColor: colors.card,
                        borderTopColor: colors.border,
                        paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : 12
                    }
                ]}>
                    <TextInput
                        style={[styles.input, { backgroundColor: isDark ? colors.background : '#F1F5F9', color: colors.text }]}
                        placeholder="Ask about ETA or Crowds..."
                        placeholderTextColor={colors.textLight}
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={() => sendMessage(inputText)}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.border }]}
                        onPress={() => sendMessage(inputText)}
                        disabled={!inputText.trim()}
                    >
                        <Ionicons name="send" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// Styles including new AI Card styles
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
    headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    headerTitle: { fontSize: 16, fontWeight: '700' },
    headerSubtitle: { fontSize: 12, fontWeight: '600' },
    closeBtn: { padding: 4 },
    listContent: { padding: 16, paddingBottom: 20 },
    messageRow: { marginBottom: 16, flexDirection: 'row', alignItems: 'flex-end', maxWidth: '90%' },
    userRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
    botRow: { alignSelf: 'flex-start' },
    botAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    bubble: { padding: 12, borderRadius: 16, minWidth: 100 },
    messageText: { fontSize: 15, lineHeight: 22 },
    timestamp: { fontSize: 10, marginTop: 6, alignSelf: 'flex-end' },

    // Rich Card Styles
    richContent: { marginTop: 10 },
    divider: { height: 1, width: '100%', marginBottom: 10 },
    busInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    busBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    busBadgeText: { color: '#FFF', fontWeight: 'bold' },
    infoLabel: { fontSize: 12, marginBottom: 2 },
    mapContainer: { height: 120, width: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 6 },
    map: { ...StyleSheet.absoluteFillObject },

    // AI Prediction Card Styles
    aiCard: { marginTop: 12, borderWidth: 1, padding: 10, borderRadius: 12 },
    aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    aiTitle: { fontWeight: '700', marginLeft: 6, fontSize: 13, color: '#A855F7' },
    etaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    etaItem: { alignItems: 'center' },
    etaLabel: { fontSize: 10, marginBottom: 2 },
    etaValue: { fontSize: 16 },
    warningBadge: { flexDirection: 'row', alignItems: 'center', padding: 6, borderRadius: 6, marginBottom: 6 },
    warningText: { color: '#EF4444', fontSize: 11, marginLeft: 4, flex: 1 },
    confText: { fontSize: 10, color: '#9CA3AF', textAlign: 'right' },

    // Crowd Forecast Styles
    forecastContainer: { flexDirection: 'row', justifyContent: 'space-around', height: 80, alignItems: 'flex-end', marginBottom: 8 },
    forecastBarCol: { alignItems: 'center', width: 30 },
    barCtx: { width: 12, height: 60, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
    barFill: { width: '100%', borderRadius: 6 },
    barLabel: { fontSize: 10, marginTop: 4 },
    recBox: { borderWidth: 1, padding: 6, borderRadius: 6, alignItems: 'center' },

    // Inputs
    suggestionsContainer: { marginBottom: 10 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1 },
    input: { flex: 1, height: 44, borderRadius: 22, paddingHorizontal: 16, marginRight: 10 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
