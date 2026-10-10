/**
 * Client-Side Chaum RSA Blind Signature Engine
 * Uses Web Crypto API and native BigInt arithmetic.
 */

// Modular Exponentiation: (base^exp) % mod
export function modPow(base, exp, mod) {
  let res = 1n;
  let b = base % mod;
  let e = exp;
  while (e > 0n) {
    if (e % 2n === 1n) res = (res * b) % mod;
    e = e / 2n;
    b = (b * b) % mod;
  }
  return res;
}

// Extended Euclidean Algorithm for modular inverse: (a * x) % m == 1
export function modInverse(a, m) {
  let [m0, x0, x1] = [m, 0n, 1n];
  let a0 = a % m;
  if (m === 1n) return 0n;

  while (a0 > 1n) {
    if (m0 === 0n) throw new Error('Modular inverse does not exist');
    const q = a0 / m0;
    let t = m0;
    m0 = a0 % m0;
    a0 = t;
    t = x0;
    x0 = x1 - q * x0;
    x1 = t;
  }
  if (x1 < 0n) x1 += m;
  return x1;
}

export function gcd(a, b) {
  while (b !== 0n) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

// Convert text -> SHA256 -> BigInt
export async function sha256ToBigInt(text) {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc.encode(text));
  const hex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return BigInt('0x' + hex);
}

// Random BigInt in range [min, max]
function randomBigInt(min, max) {
  const range = max - min;
  const byteLength = Math.ceil(range.toString(2).length / 8);
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let hex = '0x';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  const val = BigInt(hex) % range;
  return min + val;
}

/**
 * Blind a message ticket:
 * m' = (H(tag) * r^e) mod N
 */
export async function blindMessage(tag, nHex, eHex) {
  const n = BigInt('0x' + nHex);
  const e = BigInt('0x' + eHex);

  const m = (await sha256ToBigInt(tag)) % n;

  // Pick random blinding factor coprime to n
  let r = randomBigInt(3n, n - 2n);
  while (gcd(r, n) !== 1n) {
    r = randomBigInt(3n, n - 2n);
  }

  const rPowE = modPow(r, e, n);
  const mPrime = (m * rPowE) % n;

  return {
    blindedMessageHex: mPrime.toString(16),
    rHex: r.toString(16),
  };
}

/**
 * Unblind the server's signature:
 * s = (s' * r^-1) mod N
 */
export function unblindSignature(blindedSigHex, rHex, nHex) {
  const sPrime = BigInt('0x' + blindedSigHex);
  const r = BigInt('0x' + rHex);
  const n = BigInt('0x' + nHex);

  const rInv = modInverse(r, n);
  const s = (sPrime * rInv) % n;

  return s.toString(16);
}
