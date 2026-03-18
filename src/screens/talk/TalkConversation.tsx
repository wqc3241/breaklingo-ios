import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Mic,
  MicOff,
  Volume2,
  ArrowLeft,
} from 'lucide-react-native';
import { colors } from '../../lib/theme';
import type { AppProject, ConversationMessage } from '../../lib/types';

interface TalkConversationProps {
  selectedProject: AppProject | null;
  messages: ConversationMessage[];
  state: string;
  isListening: boolean;
  isTranscribing: boolean;
  finalTranscript: string;
  onVoiceInput: () => void;
  onBack: () => void;
  onStop: () => void;
}

const TalkConversation: React.FC<TalkConversationProps> = ({
  selectedProject,
  messages,
  state,
  isListening,
  isTranscribing,
  finalTranscript,
  onVoiceInput,
  onBack,
  onStop,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const getMicStateLabel = () => {
    if (isTranscribing) return 'Transcribing...';
    switch (state) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Thinking...';
      case 'speaking': return 'Speaking...';
      default: return 'Tap to speak';
    }
  };

  const micDisabled = state === 'processing' || state === 'speaking' || isTranscribing;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.flex}>
        {/* Conversation header */}
        <View style={styles.conversationHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={18} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.conversationHeaderInfo}>
            <Text style={styles.conversationHeaderTitle} numberOfLines={1}>
              {selectedProject?.title || 'Conversation'}
            </Text>
            <Text style={styles.conversationHeaderLang}>
              {selectedProject?.detectedLanguage || ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.endButton} onPress={onStop}>
            <Text style={styles.endButtonText}>End</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => `msg-${i}`}
          renderItem={({ item }: { item: ConversationMessage }) => (
            <View style={[
              styles.messageBubble,
              item.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}>
              <Text style={[
                styles.messageText,
                item.role === 'user' ? styles.userText : styles.aiText,
              ]}>{item.content}</Text>
            </View>
          )}
          contentContainerStyle={styles.messagesContent}
        />

        {/* Floating voice control */}
        <View style={styles.voiceFloating}>
          {/* Live transcript preview */}
          {isListening && finalTranscript ? (
            <View style={styles.liveTranscriptInline}>
              <Text style={styles.liveTranscriptText}>{finalTranscript}</Text>
            </View>
          ) : null}

          {/* Center mic button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.centerMicButton,
                isListening && styles.centerMicListening,
                state === 'speaking' && styles.centerMicSpeaking,
                micDisabled && !isListening && styles.centerMicDisabled,
              ]}
              onPress={onVoiceInput}
              disabled={micDisabled}
              activeOpacity={0.7}
            >
              {isTranscribing ? (
                <ActivityIndicator size="large" color={colors.white} />
              ) : state === 'processing' ? (
                <ActivityIndicator size="large" color={colors.white} />
              ) : state === 'speaking' ? (
                <Volume2 size={32} color={colors.white} />
              ) : isListening ? (
                <MicOff size={32} color={colors.white} />
              ) : (
                <Mic size={32} color={colors.white} />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* State label */}
          <Text style={styles.micStateLabel}>{getMicStateLabel()}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  conversationHeaderInfo: {
    flex: 1,
    marginLeft: 8,
  },
  conversationHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  conversationHeaderLang: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  endButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.recording,
  },
  endButtonText: {
    color: colors.recording,
    fontSize: 14,
    fontWeight: '600',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: colors.white,
  },
  aiText: {
    color: colors.foreground,
  },
  voiceFloating: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  centerMicButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  centerMicListening: {
    backgroundColor: colors.recording,
    shadowColor: colors.recording,
  },
  centerMicSpeaking: {
    backgroundColor: colors.muted,
    shadowColor: colors.muted,
  },
  centerMicDisabled: {
    backgroundColor: colors.muted,
    opacity: 0.6,
    shadowOpacity: 0,
  },
  micStateLabel: {
    marginTop: 10,
    fontSize: 14,
    color: colors.muted,
    fontWeight: '500',
  },
  liveTranscriptInline: {
    backgroundColor: colors.transcriptBg,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
    maxWidth: '90%',
  },
  liveTranscriptText: {
    fontSize: 14,
    color: colors.transcriptText,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default TalkConversation;
