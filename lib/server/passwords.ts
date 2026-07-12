import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from 'node:crypto'

// promisify() loses the 4-argument overload with options; wrap manually.
function scrypt(password: string, salt: Buffer, keylen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, opts, (err, derived) => {
      if (err) reject(err)
      else resolve(derived)
    })
  })
}

// scrypt parameters (N=16384, r=8, p=1) — OWASP-acceptable interactive login cost.
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }
const KEY_LEN = 64

// Format: scrypt$N$r$p$saltBase64$hashBase64
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derived = (await scrypt(password, salt, KEY_LEN, SCRYPT_OPTS)) as Buffer
  return `scrypt$${SCRYPT_OPTS.N}$${SCRYPT_OPTS.r}$${SCRYPT_OPTS.p}$${salt.toString('base64')}$${derived.toString('base64')}`
}

export async function verifyPassword(password: string, stored: string | undefined | null): Promise<boolean> {
  if (!stored) return false
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, n, r, p, saltB64, hashB64] = parts
  const salt = Buffer.from(saltB64, 'base64')
  const expected = Buffer.from(hashB64, 'base64')
  const derived = (await scrypt(password, salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 64 * 1024 * 1024,
  })) as Buffer
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}

// Constant-cost dummy verify to avoid timing-based email enumeration on login.
const DUMMY_HASH_PROMISE = hashPassword('dummy-password-for-timing')
export async function dummyVerify(): Promise<void> {
  await verifyPassword('not-the-password', await DUMMY_HASH_PROMISE)
}
