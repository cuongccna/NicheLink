import { AuthGuard } from '@/components/AuthGuard';
import { ThemedText } from '@/components/ThemedText';
import { COLORS } from '@/constants/DesignSystem';
import { useColorScheme } from '@/hooks/useColorScheme';
import { SafeAreaView, StyleSheet, View } from 'react-native';

function KOCMarketplaceContent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <ThemedText style={[styles.title, { color: colors.text }]}>
          Chợ KOC
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.subtext }]}>
          Danh sách KOCs được gợi ý và tìm kiếm sẽ được implement ở đây
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}

export default function KOCMarketplaceScreen() {
  return (
    <AuthGuard>
      <KOCMarketplaceContent />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});
