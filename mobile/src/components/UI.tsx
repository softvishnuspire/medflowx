import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { colors } from '../theme/colors';

// ==================== BUTTON ====================
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: styles.btnSecondary,
          text: styles.textSecondary,
        };
      case 'danger':
        return {
          container: styles.btnDanger,
          text: styles.textDanger,
        };
      case 'ghost':
        return {
          container: styles.btnGhost,
          text: styles.textGhost,
        };
      case 'primary':
      default:
        return {
          container: styles.btnPrimary,
          text: styles.textPrimary,
        };
    }
  };

  const btnStyles = getStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btnBase,
        btnStyles.container,
        (disabled || loading) && styles.btnDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.primary} />
      ) : (
        <View style={styles.btnContent}>
          {icon && <View style={styles.btnIconContainer}>{icon}</View>}
          <Text style={[styles.btnTextBase, btnStyles.text, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ==================== INPUT ====================
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  dark?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  containerStyle,
  dark = false,
  style,
  ...props
}) => {
  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {label && (
        <Text style={[styles.label, dark ? styles.labelDark : styles.labelLight]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          dark ? styles.inputWrapperDark : styles.inputWrapperLight,
          error ? styles.inputWrapperError : null,
        ]}
      >
        {icon && <View style={styles.inputIcon}>{icon}</View>}
        <TextInput
          placeholderTextColor={dark ? '#64748b' : '#94a3b8'}
          style={[
            styles.textInput,
            dark ? styles.textInputDark : styles.textInputLight,
            style,
          ]}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// ==================== CARD ====================
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={[styles.card, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

// ==================== BADGE ====================
interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', style }) => {
  const getBadgeColors = () => {
    switch (variant) {
      case 'success':
        return { bg: '#dcfce7', text: '#15803d' };
      case 'warning':
        return { bg: '#fef3c7', text: '#b45309' };
      case 'error':
        return { bg: '#fee2e2', text: '#b91c1c' };
      case 'info':
        return { bg: '#dbeafe', text: '#1d4ed8' };
      case 'primary':
        return { bg: '#ccfbf1', text: '#0f766e' };
      case 'neutral':
      default:
        return { bg: '#f4f4f5', text: '#71717a' };
    }
  };

  const colorsConfig = getBadgeColors();

  return (
    <View style={[styles.badge, { backgroundColor: colorsConfig.bg }, style]}>
      <Text style={[styles.badgeText, { color: colorsConfig.text }]}>{label}</Text>
    </View>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  // Button Styles
  btnBase: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnIconContainer: {
    marginRight: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  btnDanger: {
    backgroundColor: colors.error,
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  btnTextBase: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textPrimary: {
    color: '#ffffff',
  },
  textSecondary: {
    color: colors.primary,
  },
  textDanger: {
    color: '#ffffff',
  },
  textGhost: {
    color: colors.textMuted,
  },

  // Input Styles
  inputContainer: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelLight: {
    color: '#64748b',
  },
  labelDark: {
    color: '#94a3b8',
  },
  inputWrapper: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputWrapperLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  inputWrapperDark: {
    backgroundColor: '#0d111d',
    borderColor: '#1d293f',
  },
  inputWrapperError: {
    borderColor: colors.error,
  },
  inputIcon: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '600',
  },
  textInputLight: {
    color: colors.textDark,
  },
  textInputDark: {
    color: '#ffffff',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },

  // Card Styles
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Badge Styles
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
