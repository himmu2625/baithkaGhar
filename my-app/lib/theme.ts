// Baithaka GHAR OS Theme System
export const theme = {
  // Brand Colors
  brand: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Primary Blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b', // Secondary Gray
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    accent: {
      50: '#fef7ee',
      100: '#fdedd4',
      200: '#fbd7a8',
      300: '#f8bb71',
      400: '#f59538',
      500: '#f37316', // Accent Orange
      600: '#e45a0c',
      700: '#bd450b',
      800: '#97380f',
      900: '#7a3010',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e', // Success Green
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Warning Yellow
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444', // Error Red
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
  },

  // Semantic Colors
  semantic: {
    // Status Colors
    available: '#22c55e',
    occupied: '#3b82f6',
    maintenance: '#f59e0b',
    reserved: '#8b5cf6',
    pending: '#f97316',
    completed: '#10b981',
    cancelled: '#ef4444',
    
    // Priority Colors
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
    
    // Revenue Colors
    positive: '#22c55e',
    negative: '#ef4444',
    neutral: '#64748b',
  },

  // Typography Scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
      '6xl': '3.75rem',  // 60px
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
  },

  // Spacing Scale
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    44: '11rem',      // 176px
    48: '12rem',      // 192px
    52: '13rem',      // 208px
    56: '14rem',      // 224px
    60: '15rem',      // 240px
    64: '16rem',      // 256px
    72: '18rem',      // 288px
    80: '20rem',      // 320px
    96: '24rem',      // 384px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: '0 0 #0000',
  },

  // Transitions
  transitions: {
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
    },
    timing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Z-Index Scale
  zIndex: {
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    auto: 'auto',
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modalBackdrop: '1040',
    modal: '1050',
    popover: '1060',
    tooltip: '1070',
  },
};

// Dark Mode Colors
export const darkTheme = {
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
  },
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    muted: '#64748b',
  },
  border: {
    primary: '#334155',
    secondary: '#475569',
  },
};

// Light Mode Colors
export const lightTheme = {
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
  },
  text: {
    primary: '#0f172a',
    secondary: '#334155',
    tertiary: '#64748b',
    muted: '#94a3b8',
  },
  border: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
  },
};

// CSS Variables for Theme
export const cssVariables = {
  light: {
    '--bg-primary': lightTheme.background.primary,
    '--bg-secondary': lightTheme.background.secondary,
    '--bg-tertiary': lightTheme.background.tertiary,
    '--text-primary': lightTheme.text.primary,
    '--text-secondary': lightTheme.text.secondary,
    '--text-tertiary': lightTheme.text.tertiary,
    '--text-muted': lightTheme.text.muted,
    '--border-primary': lightTheme.border.primary,
    '--border-secondary': lightTheme.border.secondary,
    '--brand-primary': theme.brand.primary[500],
    '--brand-secondary': theme.brand.secondary[500],
    '--brand-accent': theme.brand.accent[500],
    '--semantic-success': theme.semantic.success,
    '--semantic-warning': theme.semantic.warning,
    '--semantic-error': theme.semantic.error,
  },
  dark: {
    '--bg-primary': darkTheme.background.primary,
    '--bg-secondary': darkTheme.background.secondary,
    '--bg-tertiary': darkTheme.background.tertiary,
    '--text-primary': darkTheme.text.primary,
    '--text-secondary': darkTheme.text.secondary,
    '--text-tertiary': darkTheme.text.tertiary,
    '--text-muted': darkTheme.text.muted,
    '--border-primary': darkTheme.border.primary,
    '--border-secondary': darkTheme.border.secondary,
    '--brand-primary': theme.brand.primary[400],
    '--brand-secondary': theme.brand.secondary[400],
    '--brand-accent': theme.brand.accent[400],
    '--semantic-success': theme.semantic.success,
    '--semantic-warning': theme.semantic.warning,
    '--semantic-error': theme.semantic.error,
  },
};

// Theme Utilities
export const themeUtils = {
  // Get color with opacity
  colorWithOpacity: (color: string, opacity: number) => {
    return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  },

  // Get status color
  getStatusColor: (status: string) => {
    const statusColors: Record<string, string> = {
      available: theme.semantic.available,
      occupied: theme.semantic.occupied,
      maintenance: theme.semantic.maintenance,
      reserved: theme.semantic.reserved,
      pending: theme.semantic.pending,
      completed: theme.semantic.completed,
      cancelled: theme.semantic.cancelled,
    };
    return statusColors[status] || theme.brand.secondary[500];
  },

  // Get priority color
  getPriorityColor: (priority: string) => {
    const priorityColors: Record<string, string> = {
      low: theme.semantic.low,
      medium: theme.semantic.medium,
      high: theme.semantic.high,
      critical: theme.semantic.critical,
    };
    return priorityColors[priority] || theme.brand.secondary[500];
  },

  // Get revenue color
  getRevenueColor: (value: number) => {
    if (value > 0) return theme.semantic.positive;
    if (value < 0) return theme.semantic.negative;
    return theme.semantic.neutral;
  },
}; 