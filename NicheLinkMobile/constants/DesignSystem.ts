// Global Design System for NicheLink
export const COLORS = {
  // Primary Colors
  primary: '#00A79D', // Teal
  secondary: '#FF8A65', // Peach Orange
  
  // Semantic Colors
  success: '#4CAF50', // Green
  error: '#F44336', // Red
  warning: '#FFC107', // Yellow
  info: '#2196F3', // Blue
  
  // Theme Colors
  light: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    text: '#212529',
    subtext: '#6C757D',
    border: '#DEE2E6',
  },
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    text: '#E0E0E0',
    subtext: '#A0A0A0',
    border: '#333333',
  },
  
  // Gradient Colors
  gradients: {
    primary: ['#00A79D', '#4DB6AC'],
    secondary: ['#FF8A65', '#FFAB91'],
    success: ['#4CAF50', '#66BB6A'],
    warning: ['#FFC107', '#FFD54F'],
    error: ['#F44336', '#EF5350'],
  }
};

export const TYPOGRAPHY = {
  // Font Family
  fontFamily: 'Inter',
  
  // Font Sizes
  sizes: {
    h1: 28,
    h2: 22,
    h3: 18,
    body1: 16,
    body2: 14,
    caption: 12,
    small: 10,
  },
  
  // Font Weights
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  
  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    loose: 1.6,
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  }
};

// Role-based theme configurations
export const ROLE_THEMES = {
  SME: {
    primary: COLORS.primary,
    gradient: COLORS.gradients.primary,
    accent: COLORS.success,
  },
  INFLUENCER: {
    primary: COLORS.secondary,
    gradient: COLORS.gradients.secondary,
    accent: COLORS.warning,
  }
};
