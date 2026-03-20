/*
 * @Author: Await
 * @Date: 2025-11-08
 * @Description: 统一设计系统配置
 */

/**
 * 设计系统 - 颜色方案
 */
export const colors = {
  // 主色调（与NextUI primary一致）
  primary: {
    50: '#E6F1FE',
    100: '#CCE3FD',
    200: '#99C7FB',
    300: '#66AAF9',
    400: '#338EF7',
    500: '#006FEE',
    600: '#005BC4',
    700: '#004493',
    800: '#002E62',
    900: '#001731',
    DEFAULT: '#006FEE',
  },

  // 图表配色方案
  charts: {
    blue: ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'],
    green: ['#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d'],
    red: ['#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c'],
    purple: ['#faf5ff', '#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce'],
    orange: ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c'],
    teal: ['#f0fdfa', '#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e'],
  },

  // 多色系列（用于饼图、柱状图等）
  series: ['#006FEE', '#7828C8', '#F31260', '#F5A524', '#17C964', '#06B6D4', '#9333EA', '#F97316'],
};

/**
 * 设计系统 - 圆角
 */
export const radius = {
  small: '8px',
  medium: '12px',
  large: '14px',
  card: '12px',
  button: '8px',
  input: '8px',
};

/**
 * 设计系统 - 间距
 */
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
};

/**
 * 设计系统 - 阴影
 */
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  card: '0 2px 8px rgba(0, 0, 0, 0.08)',
};

/**
 * 设计系统 - 字体
 */
export const typography = {
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

/**
 * 设计系统 - 动画
 */
export const animation = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

/**
 * 设计系统 - 断点
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

/**
 * 卡片样式配置
 */
export const cardStyles = {
  base: 'bg-background/60 backdrop-blur-md border border-default-100',
  shadow: 'shadow-card',
  radius: radius.card,
  padding: spacing.lg,
};

/**
 * 按钮样式配置
 */
export const buttonStyles = {
  radius: radius.button,
  variants: {
    solid: 'bg-primary text-white',
    bordered: 'border-2 border-primary text-primary',
    light: 'bg-primary/10 text-primary',
    flat: 'bg-default-100 text-default-900',
    ghost: 'border-2 border-transparent text-default-500 hover:border-default-200',
  },
};

/**
 * 图表默认配置
 */
export const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  colors: colors.series,
  colorScheme: colors.charts.blue,
  grid: {
    stroke: '#e5e7eb',
    strokeDasharray: '3 3',
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  animation: {
    duration: 350,
    easing: 'easeInOut',
  },
};

/**
 * 获取主题相关的颜色
 */
export const getThemeColor = (isDark: boolean) => ({
  background: isDark ? '#000000' : '#FFFFFF',
  foreground: isDark ? '#ECEDEE' : '#11181C',
  card: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
  border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  text: {
    primary: isDark ? '#ECEDEE' : '#11181C',
    secondary: isDark ? '#A1A1AA' : '#71717A',
    disabled: isDark ? '#52525B' : '#A1A1AA',
  },
});

/**
 * 空状态样式
 */
export const emptyStateStyles = {
  container: 'flex flex-col items-center justify-center py-12',
  icon: 'w-16 h-16 text-default-300 mb-4',
  title: 'text-lg font-semibold text-default-700 mb-2',
  description: 'text-sm text-default-500',
};

/**
 * 加载状态样式
 */
export const loadingStyles = {
  container: 'flex items-center justify-center py-8',
  spinner: 'w-8 h-8',
};
