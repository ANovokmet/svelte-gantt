import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts,svx,md}'],
	darkMode: 'class',
	corePlugins: {
		preflight: false
	},
	theme: {
		// fontFamily: {
		// 	sans: ['var(--kd-font-family-sans)'],
		// 	mono: ['var(--kd-font-family-mono)']
		// },
		extend: {
			spacing: {
				'8xl': '90rem',
			},
			colors: {
				brand: {
					DEFAULT: 'rgb(var(--kd-color-brand) / <alpha-value>)'
				},
				focus: {
					DEFAULT: 'rgb(var(--kd-color-focus) / <alpha-value>)'
				},
				gray: {},
				border: 'rgb(var(--kd-color-border) / <alpha-value>)',
				soft: 'rgb(var(--kd-color-soft) / <alpha-value>)',
				inverse: 'rgb(var(--kd-color-inverse) / <alpha-value>)',
				body: 'rgb(var(--kd-color-body) / <alpha-value>)',
				elevate: 'rgb(var(--kd-color-elevate) / <alpha-value>)'
			},
			typography: kitDocsTypography,
			backgroundImage: () => ({
				'gradient-0': 'linear-gradient(0deg, var(--tw-gradient-stops))'
				// You can add more custom classes here
			})
		}
	},
	plugins: [typography, kitDocsVariants]
};

function kitDocsVariants({ addVariant }) {
	addVariant(
		'supports-backdrop-blur',
		'@supports (backdrop-filter: blur(0)) or (-webkit-backdrop-filter: blur(0))'
	);
}

function kitDocsTypography(theme) {
	return {
		DEFAULT: {
			css: {
				'--tw-prose-counters': 'rgb(var(--kd-color-inverse))',
				'--tw-prose-invert-counters': 'rgb(var(--kd-color-inverse))',
				color: 'rgb(var(--kd-color-soft))',
				fontSize: '18px',
				maxWidth: 'none',
				hr: {
					borderColor: 'rgb(var(--kd-color-border))',
					marginTop: '3em',
					marginBottom: '3em'
				},
				'h1, h2, h3': {
					letterSpacing: '-0.025em'
				},
				h2: {
					marginTop: `1.75em`,
					marginBottom: `${16 / 24}em`
				},
				h3: {
					marginTop: '2.4em',
					lineHeight: '1.4'
				},
				h4: {
					marginTop: '1.75em',
					fontSize: '1.125em'
				},
				'h2 small, h3 small, h4 small': {
					fontFamily: theme('fontFamily.mono').join(', '),
					fontWeight: 500
				},
				'h2 small': {
					fontSize: theme('fontSize.lg')[0],
					...theme('fontSize.lg')[1]
				},
				'h3 small': {
					fontSize: theme('fontSize.base')[0],
					...theme('fontSize.base')[1]
				},
				'h4 small': {
					fontSize: theme('fontSize.sm')[0],
					...theme('fontSize.sm')[1]
				},
				ul: {
					paddingLeft: '1.25rem'
				},
				'ul > li': {
					position: 'relative',
					paddingLeft: '0.25rem'
				},
				'ul > li::marker': {
					color: 'rgb(var(--kd-color-inverse))'
				},
				'ul > li::before': {
					content: '""',
					width: '0.75em',
					height: '0.125em',
					position: 'absolute',
					top: 'calc(0.875em - 0.0625em)',
					left: 0,
					borderRadius: '999px'
				},
				'li > p': {
					margin: 0
				},
				a: {
					fontWeight: theme('fontWeight.normal'),
					textDecoration: 'none',
					borderBottom: `1px solid rgb(var(--kd-color-brand))`
				},
				'a:hover': {
					borderBottomWidth: '2px'
				},
				'a code': {
					color: 'inherit',
					fontWeight: 'inherit'
				},
				strong: {
					fontWeight: theme('fontWeight.semibold')
				},
				'a strong': {
					color: 'inherit',
					fontWeight: 'inherit'
				},
				code: {
					fontWeight: theme('fontWeight.semibold'),
					fontVariantLigatures: 'none'
				},
				pre: {
					backgroundColor: 'var(--kd-code-fence-bg)',
					boxShadow: 'none',
					display: 'flex'
				},
				'p + pre': {
					marginTop: `${-4 / 14}em`
				},
				'pre code': {
					flex: 'none',
					minWidth: '100%'
				},
				table: {
					margin: 0,
					width: '100%',
					borderCollapse: 'collapse'
				},
				thead: {
					color: 'rgb(var(--kd-color-inverse))',
					borderBottomColor: 'rgb(var(--kd-color-border))'
				},
				tbody: {
					verticalAlign: 'baseline'
				},
				'thead th': {
					paddingTop: 0,
					fontWeight: theme('fontWeight.semibold')
				},
				'tbody tr': {
					fontSize: theme('fontSize.sm')[0],
					borderBottomColor: 'rgb(var(--kd-color-border))'
				},
				'tbody td': {
					whiteSpace: 'normal'
				},
				'tbody tr:last-child': {
					borderBottomWidth: '1px'
				},
				'tbody code': {
					fontSize: theme('fontSize.sm')[0]
				},
				'thead th:first-child': {
					paddingLeft: '0.5714286em'
				},
				'thead th:last-child': {
					paddingRight: '0.5714286em'
				},
				'tbody td:first-child': {
					paddingLeft: '0.5714286em'
				},
				'tbody td:last-child': {
					paddingRight: '0.5714286em'
				},
				'tbody tr td:first-child code': {
					color: theme('colors.indigo.500'),
					paddingLeft: '8px',
					'&::before': { display: 'none' },
					'&::after': { display: 'none' }
				},
				'figure figcaption': {
					textAlign: 'center',
					fontStyle: 'italic'
				},
				'figure > figcaption': {
					marginTop: `${12 / 14}em`
				},
				blockQuote: {
					color: 'rgb(var(--kd-color-inverse))',
					borderRadius: 2,
					borderColor: 'currentColor'
				}
			}
		},
		invert: {
			css: {
				color: 'rgb(var(--kd-color-soft))',
				'tbody tr td:first-child code': {
					color: theme('colors.indigo.300')
				},
				'tbody tr': {
					borderBottomColor: 'rgb(var(--kd-color-border))'
				}
			}
		}
	};
}
