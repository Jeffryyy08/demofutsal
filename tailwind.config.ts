// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 🎨 COLORES DEL DESIGN SYSTEM
      colors: {
        // Surface Layers
        surface: {
          DEFAULT: '#f9f9f9',
          dim: '#dadada',
          bright: '#f9f9f9',
          container: {
            lowest: '#ffffff',
            low: '#f3f3f4',
            DEFAULT: '#eeeeee',
            high: '#e8e8e8',
            highest: '#e2e2e2',
          },
        },
        onSurface: '#1a1c1c',
        onSurfaceVariant: '#434656',
        inverse: {
          surface: '#2f3131',
          onSurface: '#f0f1f1',
        },
        outline: '#737688',
        outlineVariant: '#c3c5d9',
        surfaceTint: '#004ced',
        
        // Primary - Azul Vibrante
        primary: {
          DEFAULT: '#003ec7',
          onPrimary: '#ffffff',
          container: '#0052ff',
          onContainer: '#dfe3ff',
          fixed: '#dde1ff',
          fixedDim: '#b7c4ff',
          onFixed: '#001452',
          onFixedVariant: '#0038b6',
        },
        
        // Secondary - Naranja Energético
        secondary: {
          DEFAULT: '#a04100',
          onSecondary: '#ffffff',
          container: '#fe6b00',
          onContainer: '#572000',
          fixed: '#ffdbcc',
          fixedDim: '#ffb693',
          onFixed: '#351000',
          onFixedVariant: '#7a3000',
        },
        
        // Tertiary
        tertiary: {
          DEFAULT: '#4d4e52',
          onTertiary: '#ffffff',
          container: '#65666a',
          onContainer: '#e5e5e9',
          fixed: '#e2e2e6',
          fixedDim: '#c6c6ca',
          onFixed: '#1a1c1f',
          onFixedVariant: '#45474a',
        },
        
        // Error
        error: {
          DEFAULT: '#ba1a1a',
          onError: '#ffffff',
          container: '#ffdad6',
          onContainer: '#93000a',
        },
        
        // Background
        background: '#f9f9f9',
        onBackground: '#1a1c1c',
        surfaceVariant: '#e2e2e2',
      },
      
      // 📝 TIPOGRAFÍA
      fontFamily: {
        heading: ['var(--font-lexend)', 'Lexend', 'sans-serif'],
        body: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
      },
      fontSize: {
        'headline-xl': ['48px', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.02em' }],
        'headline-lg': ['32px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        'headline-md': ['24px', { lineHeight: '1.2', fontWeight: '700' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-caps': ['14px', { lineHeight: '1.0', fontWeight: '600', letterSpacing: '0.05em' }],
      },
      
      // 🎭 ANIMACIONES
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'bounce-subtle': 'bounce-subtle 0.5s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 5px rgba(0, 62, 199, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 62, 199, 0.8)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      
      
      // 📐 SPACING
      spacing: {
        gutter: '24px',
        margin: '32px',
      },
      maxWidth: {
        container: '1280px',
      },
      
      // 🎨 GRADIENTES
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #003ec7 0%, #0052ff 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #fe6b00 0%, #a04100 100%)',
        'gradient-live': 'linear-gradient(135deg, #fe6b00 0%, #ff4500 100%)',
        'gradient-card': 'linear-gradient(180deg, #ffffff 0%, #f3f3f4 100%)',
        'gradient-hero': 'linear-gradient(135deg, #003ec7 0%, #0052ff 50%, #0038b6 100%)',
      },
      
      // 🌟 SHADOWS
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 62, 199, 0.08)',
        'medium': '0 8px 30px rgba(0, 62, 199, 0.12)',
        'large': '0 16px 50px rgba(0, 62, 199, 0.16)',
        'glow': '0 0 20px rgba(0, 62, 199, 0.5)',
        'glow-orange': '0 0 20px rgba(254, 107, 0, 0.5)',
      },
      
      // 🔘 BORDER RADIUS
      borderRadius: {
        'card': '0.75rem',
        'button': '9999px',
      },
      
      // 🪞 BACKDROP BLUR
      backdropBlur: {
        'glass': '12px',
      },
    },
  },
  plugins: [],
}

export default config