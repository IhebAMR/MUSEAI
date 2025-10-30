import fs from 'node:fs';
import path from 'node:path';
import * as devcert from 'devcert';

export type HttpsCreds = { key: Buffer; cert: Buffer };

export async function getAutoCert(hostname: string): Promise<HttpsCreds | null> {
  try {
    const res: any = await (devcert as any).certificateFor(hostname);
    if (!res) return null;
    const key = Buffer.isBuffer(res.key) ? res.key : Buffer.from(res.key);
    const cert = Buffer.isBuffer(res.cert) ? res.cert : Buffer.from(res.cert);
    return { key, cert };
  } catch (e) {
    console.warn('[HTTPS] Auto certificate generation failed:', (e as any)?.message || e);
    return null;
  }
}

export function getManualCert(keyPath: string, certPath: string): HttpsCreds | null {
  try {
    if (!keyPath || !certPath) return null;
    const key = fs.readFileSync(path.resolve(keyPath));
    const cert = fs.readFileSync(path.resolve(certPath));
    return { key, cert };
  } catch (e) {
    console.warn('[HTTPS] Manual cert load failed:', (e as any)?.message || e);
    return null;
  }
}

export function getSelfSigned(hostname: string): HttpsCreds | null {
  try {
    // Lazy require to avoid hard dependency at startup
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const selfsigned = require('selfsigned');
    const attrs = [{ name: 'commonName', value: hostname }];
    const pems = selfsigned.generate(attrs, {
      days: 365,
      keySize: 2048,
      algorithm: 'sha256',
      extensions: [{ name: 'basicConstraints', cA: false }],
    });
    return { key: Buffer.from(pems.private), cert: Buffer.from(pems.cert) };
  } catch (e) {
    console.warn('[HTTPS] Self-signed cert generation failed or module missing:', (e as any)?.message || e);
    return null;
  }
}
