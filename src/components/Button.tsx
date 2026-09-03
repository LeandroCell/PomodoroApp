import { Pressable, Text } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
  disabled?: boolean;
  accessibilityHint?: string;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-coffee-600 active:bg-coffee-700 dark:bg-coffee-500 dark:active:bg-coffee-400',
  secondary:
    'bg-coffee-100 active:bg-coffee-200 dark:bg-coffee-800 dark:active:bg-coffee-700 border border-coffee-300 dark:border-coffee-600',
  ghost: 'bg-transparent active:bg-coffee-100 dark:active:bg-coffee-800',
};

const VARIANT_TEXT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'text-cream-50',
  secondary: 'text-coffee-700 dark:text-coffee-100',
  ghost: 'text-coffee-600 dark:text-coffee-200',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  accessibilityHint,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      className={`rounded-full ${size === 'lg' ? 'px-8 py-4' : 'px-5 py-3'} ${
        VARIANT_CLASSES[variant]
      } ${disabled ? 'opacity-40' : ''}`}
    >
      <Text
        className={`text-center font-semibold ${size === 'lg' ? 'text-lg' : 'text-base'} ${VARIANT_TEXT_CLASSES[variant]}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
