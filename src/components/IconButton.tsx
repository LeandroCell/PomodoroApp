import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
}

export function IconButton({ icon, label, onPress, disabled = false, color = '#6B4423' }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      className={`h-14 w-14 items-center justify-center rounded-full bg-coffee-100 active:bg-coffee-200 dark:bg-coffee-800 dark:active:bg-coffee-700 ${
        disabled ? 'opacity-40' : ''
      }`}
    >
      <Ionicons name={icon} size={24} color={color} />
    </Pressable>
  );
}
