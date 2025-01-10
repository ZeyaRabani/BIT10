/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { type Config } from 'tailwindcss'
const { default: flattenColorPalette } = require('tailwindcss/lib/util/flattenColorPalette')

export default {
	darkMode: ['class'],
	content: ['./src/**/*.tsx'],
	theme: {
		extend: {
			fontFamily: {
				sansSerif: ['Source Sans Pro', 'sans-serif']
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
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
				'fade-in-down': {
					from: {
						opacity: '0', transform: 'translateY(-20px)'
					},
					to: {
						opacity: '1', transform: 'translateY(0)'
					}
				},
				'fade-out-up': {
					from: {
						opacity: '1', transform: 'translateY(0)'
					},
					to: {
						opacity: '0', transform: 'translateY(-20px)'
					}
				},
				'fade-bottom-up': {
					from: {
						opacity: '0', transform: 'translateY(80px)'
					},
					to: {
						opacity: '1', transform: 'translateY(0)'
					}
				},
				'fade-left': {
					from: {
						opacity: '0', transform: 'translateX(-20px)'
					},
					to: {
						opacity: '1', transform: 'translateX(0)'
					}
				},
				'fade-right': {
					from: {
						opacity: '0', transform: 'translateX(20px)'
					},
					to: {
						opacity: '1', transform: 'translateX(0)'
					}
				},
				'aurora': {
					from: {
						backgroundPosition: '50% 50%, 50% 50%',
					},
					to: {
						backgroundPosition: '350% 50%, 350% 50%',
					},
				},
				'scroll': {
					to: {
						transform: 'translate(calc(-50% - 0.5rem))',
					},
				},
				'round': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				},
				'rotate360': {
					from: { transform: 'rotate(0deg)' },
					to: { transform: 'rotate(-360deg)' }
				},
				'load': {
					'0%': {
						boxShadow: `
              0 -0.83em 0 -0.4em,
              0 -0.83em 0 -0.42em,
              0 -0.83em 0 -0.44em,
              0 -0.83em 0 -0.46em,
              0 -0.83em 0 -0.477em
            `,
					},
					'5%, 95%': {
						boxShadow: `
              0 -0.83em 0 -0.4em,
              0 -0.83em 0 -0.42em,
              0 -0.83em 0 -0.44em,
              0 -0.83em 0 -0.46em,
              0 -0.83em 0 -0.477em
            `,
					},
					'10%, 59%': {
						boxShadow: `
              0 -0.83em 0 -0.4em,
              -0.087em -0.825em 0 -0.42em,
              -0.173em -0.812em 0 -0.44em,
              -0.256em -0.789em 0 -0.46em,
              -0.297em -0.775em 0 -0.477em
            `,
					},
					'20%': {
						boxShadow: `
              0 -0.83em 0 -0.4em,
              -0.338em -0.758em 0 -0.42em,
              -0.555em -0.617em 0 -0.44em,
              -0.671em -0.488em 0 -0.46em,
              -0.749em -0.34em 0 -0.477em
            `,
					},
					'38%': {
						boxShadow: `
              0 -0.83em 0 -0.4em,
              -0.377em -0.74em 0 -0.42em,
              -0.645em -0.522em 0 -0.44em,
              -0.775em -0.297em 0 -0.46em,
              -0.82em -0.09em 0 -0.477em
            `,
					},
					'100%': {
						boxShadow: `
              0 -0.83em 0 -0.4em,
              0 -0.83em 0 -0.42em,
              0 -0.83em 0 -0.44em,
              0 -0.83em 0 -0.46em,
              0 -0.83em 0 -0.477em
            `,
					},
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'spin-slow': 'spin 3s linear infinite',
				'spin-fast': 'spin 0.5s linear',
				'fade-in-down': 'fade-in-down 0.2s forwards ease-out',
				'fade-out-up': 'fade-out-up 0.2s forwards ease-out',
				'fade-in-down-nav': 'fade-in-down 0.2s ease-out',
				'fade-bottom-up': 'fade-bottom-up 0.2s ease-out',
				'fade-left': 'fade-left 0.2s ease-out',
				'fade-right': 'fade-right 0.2s ease-out',
				'fade-left-slow': 'fade-left 0.6s ease-out',
				'fade-right-slow': 'fade-right 0.6s ease-out',
				'fade-bottom-up-slow': 'fade-bottom-up 0.6s ease-out',
				'fade-in-down-slow': 'fade-in-down 0.6s ease-out',
				'rotate360': 'rotate360 0.5s linear',
				'aurora': 'aurora 60s linear infinite',
				'scroll': 'scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite',
				'preloader': 'round 1.7s infinite ease, load 1.7s infinite ease'
			}
		}
	},
	plugins: [require('tailwindcss-animate'), addVariablesForColors],
} satisfies Config;

function addVariablesForColors({ addBase, theme }: any) {
	let allColors = flattenColorPalette(theme('colors'));
	let newVars = Object.fromEntries(
		Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
	);

	addBase({
		':root': newVars,
	});
}