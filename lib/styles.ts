import { Platform, ViewStyle } from 'react-native';

/**
 * Creates cross-platform shadow styles
 * Uses boxShadow for web and shadow* props for native
 */
export function createShadow(
  color: string,
  offsetX: number,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number = radius / 2
): ViewStyle {
  if (Platform.OS === 'web') {
    // Convert color and opacity to rgba for web
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 0, g: 0, b: 0 };
    };
    
    const rgb = hexToRgb(color);
    const boxShadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px ${boxShadowColor}`,
    } as ViewStyle;
  }
  
  // Native shadow styles
  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

/**
 * Common shadow presets
 */
export const shadows = {
  small: createShadow('#000', 0, 1, 0.05, 2, 1),
  medium: createShadow('#000', 0, 4, 0.1, 8, 4),
  large: createShadow('#000', 0, 10, 0.2, 20, 10),
  xl: createShadow('#000', 0, 20, 0.3, 40, 20),
};
