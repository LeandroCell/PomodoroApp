import { Text, View } from 'react-native';

import { IconButton } from './IconButton';

interface NumberStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export function NumberStepper({ label, value, onChange, min, max, step = 1, unit = 'min' }: NumberStepperProps) {
  const decrease = () => onChange(Math.max(min, value - step));
  const increase = () => onChange(Math.min(max, value + step));

  return (
    <View className="flex-row items-center justify-between py-3">
      <Text className="text-base text-coffee-800 dark:text-coffee-100">{label}</Text>
      <View className="flex-row items-center gap-4">
        <IconButton icon="remove" label={`Decrease ${label}`} onPress={decrease} disabled={value <= min} />
        <Text
          numberOfLines={1}
          className="w-20 text-center text-lg font-semibold text-coffee-800 dark:text-coffee-50"
          accessibilityLabel={`${label}: ${value} ${unit}`}
        >
          {value} {unit}
        </Text>
        <IconButton icon="add" label={`Increase ${label}`} onPress={increase} disabled={value >= max} />
      </View>
    </View>
  );
}
