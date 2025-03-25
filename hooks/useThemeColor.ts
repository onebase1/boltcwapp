import { useColorScheme } from 'react-native';

export function useThemeColor() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    primary: '#2563eb',
    background: isDark ? '#000000' : '#ffffff',
    card: isDark ? '#1c1c1e' : '#ffffff',
    text: isDark ? '#ffffff' : '#000000',
    border: isDark ? '#38383A' : '#e5e5e5',
    notification: '#ff3b30',
  };
}