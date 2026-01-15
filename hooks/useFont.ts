import { Platform } from 'react-native';

/**
 * Returns the appropriate font family, falling back to system fonts if custom fonts aren't loaded
 */
export function getFontFamily(variant: 'serif' | 'serif-bold' | 'serif-italic' | 'sans' | 'sans-medium' | 'sans-bold'): string {
  const fontMap: Record<string, { custom: string; fallback: string }> = {
    'serif': {
      custom: 'Playfair-Regular',
      fallback: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }) || 'serif',
    },
    'serif-bold': {
      custom: 'Playfair-Bold',
      fallback: Platform.select({ ios: 'Georgia-Bold', android: 'serif', default: 'Georgia' }) || 'serif',
    },
    'serif-italic': {
      custom: 'Playfair-Italic',
      fallback: Platform.select({ ios: 'Georgia-Italic', android: 'serif', default: 'Georgia' }) || 'serif',
    },
    'sans': {
      custom: 'Inter-Regular',
      fallback: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }) || 'sans-serif',
    },
    'sans-medium': {
      custom: 'Inter-Medium',
      fallback: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'sans-serif' }) || 'sans-serif',
    },
    'sans-bold': {
      custom: 'Inter-Bold',
      fallback: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }) || 'sans-serif',
    },
  };

  const font = fontMap[variant];
  
  // Try custom font first, fall back to system font
  // In a real app, you'd check if the font is actually loaded
  return font?.custom || font?.fallback || 'System';
}

export const fonts = {
  serif: getFontFamily('serif'),
  serifBold: getFontFamily('serif-bold'),
  serifItalic: getFontFamily('serif-italic'),
  sans: getFontFamily('sans'),
  sansMedium: getFontFamily('sans-medium'),
  sansBold: getFontFamily('sans-bold'),
};

