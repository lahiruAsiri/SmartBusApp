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
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '../../contexts/ThemeContext';
import { MAP_CONFIG } from '../../constants/config';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    type: 'text' | 'rich_response';
    data?: {
        busRoute?: string;
        crowdLevel?: 'Low' | 'Medium' | 'High';
        seatsAvailable?: boolean;
        locationName?: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
}

const SUGGESTIONS = [
    "I want to go to Malabe",
    "Where is bus 177?",
    "Is the 138 crowded?",
];

export const ChatScreen = ({ navigation }: any) => {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hello! I'm your Smart Bus Assistant. Where would you like to go today?",
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

        // Mock AI Response
        setTimeout(() => {
            let botResponse: Message;

            if (text.toLowerCase().includes('malabe')) {
                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "I found a great option for you. Bus 177 (Kaduwela - Kollupitiya) goes to Malabe. It's arriving at the Town Hall stop in 5 minutes.",
                    sender: 'bot',
                    timestamp: new Date(),
                    type: 'rich_response',
                    data: {
                        busRoute: '177',
                        crowdLevel: 'High',
                        seatsAvailable: false,
                        locationName: 'Malabe Bus Stand',
                        coordinates: {
                            latitude: 6.9061,
                            longitude: 79.9647, // Approx Malabe
                        },
                    },
                };
            } else {
                botResponse = {
                    id: (Date.now() + 1).toString(),
                    text: "I can help you find bus routes. Try asking 'I want to go to Malabe' or similar destinations.",
                    sender: 'bot',
                    timestamp: new Date(),
                    type: 'text',
                };
            }

            setMessages((prev) => [...prev, botResponse]);
            setIsTyping(false);
        }, 1500);
    };

    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [messages, isTyping]);

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';

        return (
            <View style={[
                styles.messageRow,
                isUser ? styles.userRow : styles.botRow
            ]}>
                {!isUser && (
                    <View style={[styles.botAvatar, { backgroundColor: colors.primary }]}>
                        <Ionicons name="chatbubble-ellipses" size={16} color="#FFF" />
                    </View>
                )}

                <View style={[
                    styles.bubble,
                    isUser
                        ? { backgroundColor: colors.primary, borderBottomRightRadius: 2 }
                        : { backgroundColor: colors.card, borderTopLeftRadius: 2 }
                ]}>
                    <Text style={[
                        styles.messageText,
                        { color: isUser ? '#FFF' : colors.text }
                    ]}>
                        {item.text}
                    </Text>

                    {item.type === 'rich_response' && item.data && (
                        <View style={styles.richContent}>
                            <View style={[styles.divider, { backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : colors.border }]} />

                            {/* Bus Info Card */}
                            <View style={styles.busInfoRow}>
                                <View style={[styles.busBadge, { backgroundColor: '#22C55E' }]}>
                                    <Text style={styles.busBadgeText}>{item.data.busRoute}</Text>
                                </View>
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={[styles.infoLabel, { color: isUser ? '#FFF' : colors.textLight }]}>Crowd: <Text style={{ fontWeight: 'bold', color: item.data.crowdLevel === 'High' ? '#EF4444' : '#22C55E' }}>{item.data.crowdLevel}</Text></Text>
                                    <Text style={[styles.infoLabel, { color: isUser ? '#FFF' : colors.textLight }]}>Seats: <Text style={{ fontWeight: 'bold' }}>{item.data.seatsAvailable ? 'Yes' : 'No'}</Text></Text>
                                </View>
                            </View>

                            {/* Mini Map */}
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
                                    <TouchableOpacity
                                        style={styles.expandBtn}
                                        onPress={() => navigation.navigate('Map')}
                                    >
                                        <Ionicons name="expand" size={16} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            )}
                            <Text style={[styles.locationText, { color: isUser ? 'rgba(255,255,255,0.8)' : colors.textLight }]}>
                                Stop: {item.data.locationName}
                            </Text>
                        </View>
                    )}

                    <Text style={[
                        styles.timestamp,
                        { color: isUser ? 'rgba(255,255,255,0.6)' : colors.textLight }
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
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Smart Bus Assistant</Text>
                        <Text style={[styles.headerSubtitle, { color: colors.textLight }]}>Online</Text>
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
                                <Ionicons name="chatbubble-ellipses" size={16} color="#FFF" />
                            </View>
                            <View style={[styles.bubble, { backgroundColor: colors.card, borderTopLeftRadius: 2, paddingVertical: 12 }]}>
                                <Text style={{ color: colors.textLight, fontStyle: 'italic', fontSize: 12 }}>Typing...</Text>
                            </View>
                        </View>
                    ) : null
                }
            />

            {/* Input Area */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                {/* Suggestions */}
                {messages.length === 1 && (
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
                                    <Text style={{ color: colors.primary }}>{item}</Text>
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
                        placeholder="Ask about buses..."
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 12,
    },
    closeBtn: {
        padding: 4,
    },
    listContent: {
        padding: 16,
        paddingBottom: 20,
    },
    messageRow: {
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'flex-end',
        maxWidth: '85%',
    },
    userRow: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    botRow: {
        alignSelf: 'flex-start',
    },
    botAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    bubble: {
        padding: 12,
        borderRadius: 16,
        minWidth: 100,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    timestamp: {
        fontSize: 10,
        marginTop: 6,
        alignSelf: 'flex-end',
    },
    richContent: {
        marginTop: 10,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 10,
    },
    busInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    busBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    busBadgeText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    infoLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    mapContainer: {
        height: 120,
        width: 200, // Fixed width for chat bubble
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 6,
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    expandBtn: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 6,
        borderRadius: 12,
    },
    locationText: {
        fontSize: 11,
        fontStyle: 'italic',
    },
    suggestionsContainer: {
        marginBottom: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        paddingHorizontal: 16,
        marginRight: 10,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
