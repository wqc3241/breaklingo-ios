import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Volume2, Pause } from 'lucide-react-native';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { colors } from '../../lib/theme';

interface QuizQuestionShellProps {
  typeLabel: string;
  scriptText?: string;
  children: React.ReactNode;
}

const QuizQuestionShell: React.FC<QuizQuestionShellProps> = ({
  typeLabel,
  scriptText,
  children,
}) => {
  const { speak, isPlaying, currentText } = useTextToSpeech();
  const [isPlayingThis, setIsPlayingThis] = useState(false);

  useEffect(() => {
    setIsPlayingThis(isPlaying && currentText === scriptText);
  }, [isPlaying, currentText, scriptText]);

  const handleScriptTap = () => {
    if (scriptText) {
      speak(scriptText);
    }
  };

  return (
    <View style={styles.container}>
      {/* Type banner */}
      <View style={styles.typeBanner}>
        <Text style={styles.typeBannerText}>{typeLabel.toUpperCase()}</Text>
      </View>

      {/* Tappable script card */}
      {scriptText ? (
        <TouchableOpacity
          style={[
            styles.scriptCard,
            isPlayingThis && styles.scriptCardPlaying,
          ]}
          onPress={handleScriptTap}
          activeOpacity={0.7}
        >
          <View style={styles.scriptCardInner}>
            <View style={styles.scriptIconContainer}>
              {isPlayingThis ? (
                <Pause size={14} color={colors.primary} />
              ) : (
                <Volume2 size={14} color={colors.primary} />
              )}
            </View>
            <Text style={styles.scriptText}>{scriptText}</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Children */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  typeBanner: {
    backgroundColor: colors.primaryTinted,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  typeBannerText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  scriptCard: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  scriptCardPlaying: {},
  scriptCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scriptIconContainer: {},
  scriptText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
    lineHeight: 30,
  },
});

export default QuizQuestionShell;
