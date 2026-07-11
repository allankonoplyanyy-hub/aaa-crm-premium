/**
 * DEMO / PRODUCTION mode switch.
 *
 * Set NEXT_PUBLIC_APP_MODE=production to hide demo accounts, demo passwords
 * and quick role switching. Any other value (or unset) keeps DEMO mode on.
 */
export const IS_DEMO = process.env.NEXT_PUBLIC_APP_MODE !== 'production'

export const DEMO_PASSWORD_HINT = 'demo1234'
