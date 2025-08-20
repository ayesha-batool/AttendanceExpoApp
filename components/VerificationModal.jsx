import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const VerificationModal = ({ 
  visible, 
  onClose, 
  onVerify, 
  email, 
  onResendCode,
  isLoading = false 
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (visible) {
      setTimer(60); // Start 60 second timer
      setCanResend(false);
      setCode(['', '', '', '', '', '']);
      // Focus first input after modal opens
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 300);
    }
  }, [visible]);

  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (index === 5 && text) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (verificationCode) => {
    if (verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code.');
      return;
    }
    onVerify(verificationCode);
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    try {
      await onResendCode();
      setTimer(60);
      setCanResend(false);
      setCode(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend verification code. Please try again.');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.5)']}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#ffffff', '#f8fafc']}
              style={styles.modalBox}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Icon name="close" size={24} color="#64748b" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                  <View style={styles.iconContainer}>
                    <Icon name="mail-check" size={40} color="#1e40af" />
                  </View>
                  <Text style={styles.title}>Verify Your Email</Text>
                  <Text style={styles.subtitle}>
                    We've sent a 6-digit verification code to
                  </Text>
                  <Text style={styles.email}>{email}</Text>
                </View>
              </View>

              {/* Verification Code Input */}
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Enter verification code</Text>
                <View style={styles.codeInputs}>
                  {code.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={ref => inputRefs.current[index] = ref}
                      style={[
                        styles.codeInput,
                        digit && styles.codeInputFilled
                      ]}
                      value={digit}
                      onChangeText={(text) => handleCodeChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      selectTextOnFocus
                      editable={!isLoading}
                    />
                  ))}
                </View>
              </View>

              {/* Resend Code Section */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>
                  Didn't receive the code?
                </Text>
                {timer > 0 ? (
                  <Text style={styles.timerText}>
                    Resend in {formatTime(timer)}
                  </Text>
                ) : (
                  <TouchableOpacity
                    onPress={handleResendCode}
                    disabled={!canResend || isLoading}
                    style={[
                      styles.resendButton,
                      (!canResend || isLoading) && styles.resendButtonDisabled
                    ]}
                  >
                    <Text style={[
                      styles.resendButtonText,
                      (!canResend || isLoading) && styles.resendButtonTextDisabled
                    ]}>
                      Resend Code
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  isLoading && styles.verifyButtonDisabled
                ]}
                onPress={() => handleVerify(code.join(''))}
                disabled={isLoading || code.join('').length !== 6}
              >
                <LinearGradient
                  colors={['#1e40af', '#1e3a8a']}
                  style={styles.verifyButtonGradient}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <Icon name="refresh" size={20} color="#fff" style={styles.spinning} />
                      <Text style={styles.verifyButtonText}>Verifying...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.verifyButtonText}>Verify Email</Text>
                      <Icon name="checkmark-circle" size={20} color="#fff" style={styles.verifyIcon} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  By verifying your email, you agree to our terms of service
                </Text>
              </View>
            </LinearGradient>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalBox: {
    padding: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(30, 64, 175, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    textAlign: 'center',
  },
  codeContainer: {
    marginBottom: 32,
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 16,
  },
  codeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#fff',
    color: '#1e293b',
  },
  codeInputFilled: {
    borderColor: '#1e40af',
    backgroundColor: '#f0f9ff',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  resendButtonTextDisabled: {
    color: '#9ca3af',
  },
  verifyButton: {
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  verifyIcon: {
    marginLeft: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinning: {
    transform: [{ rotate: '360deg' }],
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default VerificationModal;

