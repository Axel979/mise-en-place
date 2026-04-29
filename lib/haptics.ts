export const hapticImpact = async (style: 'Light' | 'Medium' | 'Heavy' = 'Light') => {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle[style] });
    }
  } catch {}
};
