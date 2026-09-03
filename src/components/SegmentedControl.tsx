import { Pressable, Text, View } from 'react-native';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  return (
    <View
      className="flex-row rounded-xl bg-coffee-100 p-1 dark:bg-coffee-800"
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            className={`flex-1 rounded-lg px-3 py-2 ${selected ? 'bg-coffee-600 dark:bg-coffee-400' : ''}`}
          >
            <Text
              className={`text-center text-sm font-medium ${
                selected ? 'text-cream-50 dark:text-coffee-900' : 'text-coffee-700 dark:text-coffee-200'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
