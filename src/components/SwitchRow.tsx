import { Switch, Text, View } from 'react-native';

interface SwitchRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function SwitchRow({ label, description, value, onChange }: SwitchRowProps) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-1 pr-4">
        <Text className="text-base text-coffee-800 dark:text-coffee-100">{label}</Text>
        {description ? (
          <Text className="mt-0.5 text-sm text-coffee-500 dark:text-coffee-400">{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value }}
        trackColor={{ false: '#E6D5BE', true: '#8B5E3C' }}
        thumbColor="#FBF6EF"
      />
    </View>
  );
}
