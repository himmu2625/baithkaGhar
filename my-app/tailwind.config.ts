import type { Config } from "tailwindcss"
import tailwindAnimate from "tailwindcss-animate"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			darkGreen: '#2C3E50',
  			mediumGreen: '#34495E',
  			lightGreen: '#BDC3C7',
  			lightYellow: '#ECF0F1',
  			lightBg: {
  				DEFAULT: '#ECF0F1',
  				dark: '#2C3E50'
  			},
  			grayText: '#34495E',
  			secondaryBlue: '#2C3E50',
  			primaryBlue: '#34495E',
  			brownTan: '#BDC3C7',
  			white: '#FFFFFF',
  			black: '#000000',
  			rose: {
  				'400': '#fb7185',
  				'500': '#f43f5e',
  				'600': '#e11d48'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			shimmer: {
  				'0%': {
  					transform: 'translateX(-100%)'
  				},
  				'100%': {
  					transform: 'translateX(100%)'
  				}
  			},
  			'pulse-light': {
  				'0%, 100%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0.5'
  				}
  			},
  			'bounce-light': {
  				'0%, 100%': {
  					transform: 'translateY(0)'
  				},
  				'50%': {
  					transform: 'translateY(-25%)'
  				}
  			},
  			'fade-up': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(10px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'fade-down': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(-10px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			float: {
  				'0%, 100%': {
  					transform: 'translateY(0)'
  				},
  				'50%': {
  					transform: 'translateY(-5px)'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			shimmer: 'shimmer 2s infinite',
  			'pulse-light': 'pulse-light 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  			'bounce-light': 'bounce-light 1s infinite',
  			'fade-up': 'fade-up 0.5s ease-out',
  			'fade-down': 'fade-down 0.5s ease-out',
  			float: 'float 3s ease-in-out infinite'
  		}
  	}
  },
  plugins: [tailwindAnimate, require("tailwindcss-animate")],
  safelist: [
    "text-darkGreen",
    "text-mediumGreen",
    "text-lightGreen",
    "text-lightYellow",
    "text-grayText",
    "text-secondaryBlue",
    "text-primaryBlue",
    "bg-darkGreen",
    "bg-mediumGreen",
    "bg-lightGreen",
    "bg-lightYellow",
    "bg-lightBg",
    "bg-secondaryBlue",
    "bg-primaryBlue",
    "bg-brownTan",
    "bg-white",
    "bg-black",
    "text-white",
    "text-black",
    "border-lightGreen",
    "border-brownTan",
    "hover:bg-darkGreen",
    "hover:bg-mediumGreen",
    "hover:bg-lightGreen",
    "hover:text-darkGreen",
    "hover:text-mediumGreen",
    "hover:text-lightGreen",
    "hover:text-lightYellow",
    "hover:border-lightGreen",
    "hover:bg-lightGreen/10",
    "hover:bg-lightGreen/20",
    "hover:bg-mediumGreen/80",
    "hover:bg-darkGreen/80",
    "bg-background",
    "text-foreground",
    "bg-primary",
    "text-primary",
    "bg-secondary",
    "text-secondary",
    "bg-muted",
    "text-muted",
    "bg-accent",
    "text-accent",
    "bg-popover",
    "text-popover",
    "bg-card",
    "text-card",
    "bg-destructive",
    "text-destructive",
    "bg-border",
    "border-border",
    "bg-input",
    "text-input",
    "bg-ring",
    "ring-ring",
    "text-primary-foreground",
    "text-secondary-foreground",
    "text-destructive-foreground",
    "text-muted-foreground",
    "text-accent-foreground",
    "text-popover-foreground",
    "text-card-foreground",
    "animate-shimmer",
    "animate-pulse-light",
    "animate-bounce-light",
    "animate-fade-up",
    "animate-fade-down",
    "animate-float",
  ],
} satisfies Config

export default config
