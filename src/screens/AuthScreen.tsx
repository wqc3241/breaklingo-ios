import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../hooks/useAuth';
import { AVATAR_URL } from '../lib/constants';

const AppleLogo = ({ size = 20, color = '#fff' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      fill={color}
    />
  </Svg>
);

const GoogleLogo = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </Svg>
);

type AuthTab = 'signin' | 'signup';
type AuthView = 'main' | 'forgotPassword';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AuthScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [authView, setAuthView] = useState<AuthView>('main');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { handleSignIn, handleSignUp, handleGoogleSignIn, handleAppleSignIn, handleForgotPassword } = useAuth();

  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    if (!EMAIL_REGEX.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value: string, isSignUp: boolean): boolean => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (isSignUp && value.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const onSignIn = async () => {
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password, false);
    if (!emailValid || !passwordValid) return;

    setIsLoading(true);
    try {
      await handleSignIn(email, password);
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Please check your credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUp = async () => {
    const emailValid = validateEmail(email);
    const passwordValid = validatePassword(password, true);
    if (!emailValid || !passwordValid) return;

    setIsLoading(true);
    try {
      await handleSignUp(email, password);
      Alert.alert('Success', 'Check your email for verification link');
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPassword = async () => {
    if (!validateEmail(email)) return;

    setIsLoading(true);
    try {
      await handleForgotPassword(email);
      Alert.alert('Success', 'Check your email for password reset link');
      setAuthView('main');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (authView === 'forgotPassword') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your email and we'll send you a reset link.
              </Text>

              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="Email"
                value={email}
                onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}

              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={onForgotPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonTextWhite}>Send Reset Link</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => setAuthView('main')}
              >
                <Text style={styles.linkText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={{ uri: AVATAR_URL }} style={styles.logo} />
          </View>

          <Text style={styles.appName}>BreakLingo</Text>
          <Text style={styles.tagline}>Learn languages from real videos</Text>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'signin' && styles.activeTab]}
              onPress={() => { setActiveTab('signin'); setEmailError(''); setPasswordError(''); }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'signin' && styles.activeTabText,
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
              onPress={() => { setActiveTab('signup'); setEmailError(''); setPasswordError(''); }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'signup' && styles.activeTabText,
                ]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="Email"
              value={email}
              onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
            <TextInput
              style={[styles.input, passwordError ? styles.inputError : null]}
              placeholder="Password"
              value={password}
              onChangeText={(v) => { setPassword(v); if (passwordError) setPasswordError(''); }}
              secureTextEntry
            />
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

            {activeTab === 'signin' && (
              <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => setAuthView('forgotPassword')}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={activeTab === 'signin' ? onSignIn : onSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonTextWhite}>
                  {activeTab === 'signin' ? 'Sign In' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity
            style={[styles.button, styles.googleButton, isLoading && { opacity: 0.5 }]}
            onPress={async () => {
              setIsLoading(true);
              try {
                await handleGoogleSignIn();
              } catch (error: any) {
                Alert.alert('Google Sign In Failed', error.message || 'Could not sign in with Google');
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            <GoogleLogo size={20} />
            <Text style={styles.buttonTextDark}>Google</Text>
          </TouchableOpacity>

          {/* Apple Sign In */}
          <TouchableOpacity
            style={[styles.button, styles.appleButton, isLoading && { opacity: 0.5 }]}
            onPress={async () => {
              setIsLoading(true);
              try {
                await handleAppleSignIn();
              } catch (error: any) {
                Alert.alert('Apple Sign In Failed', error.message || 'Could not sign in with Apple');
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            <AppleLogo size={20} color="#fff" />
            <Text style={styles.buttonTextWhite}>Apple</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  card: {
    paddingTop: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#000',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: '#A1A1A1',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#D4D4D4',
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A1A1A1',
  },
  activeTabText: {
    color: '#000',
  },
  form: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  inputError: {
    borderColor: '#DB2323',
  },
  fieldError: {
    color: '#DB2323',
    fontSize: 13,
    marginTop: -8,
    marginBottom: 12,
    marginLeft: 4,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotText: {
    color: '#E8550C',
    fontSize: 14,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#E8550C',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D4D4D4',
    gap: 8,
  },
  appleButton: {
    backgroundColor: '#000',
    gap: 8,
    marginTop: 10,
  },
  buttonTextWhite: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDark: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D4D4D4',
  },
  dividerText: {
    paddingHorizontal: 12,
    color: '#A1A1A1',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 15,
    color: '#A1A1A1',
    marginBottom: 24,
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#E8550C',
    fontSize: 15,
  },
});

export default AuthScreen;
