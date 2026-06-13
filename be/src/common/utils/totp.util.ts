import { createHmac } from 'crypto';

function base32Decode(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = base32.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = alphabet.indexOf(cleaned[i]);
    if (idx === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function verifyTotp(secret: string, code: string, window = 1): boolean {
  try {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30);

    for (let i = -window; i <= window; i++) {
      const timeStep = counter + i;
      const buffer = Buffer.alloc(8);
      const high = Math.floor(timeStep / 0x100000000);
      const low = timeStep % 0x100000000;
      buffer.writeUInt32BE(high, 0);
      buffer.writeUInt32BE(low, 4);

      const hmac = createHmac('sha1', key).update(buffer).digest();
      const offset = hmac[hmac.length - 1] & 0xf;
      const codeInt =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

      const calculated = (codeInt % 1000000).toString().padStart(6, '0');
      if (calculated === code) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function generateSecret(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}
