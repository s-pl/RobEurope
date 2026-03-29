/**
 * Cloudflare R2 upload utility.
 *
 * R2 exposes an S3-compatible endpoint:
 *   https://<ACCOUNT_ID>.r2.cloudflarestorage.com/<BUCKET>
 *
 * We sign requests manually using AWS Signature V4 so we don't need
 * any extra SDK — only Node.js built-ins (crypto).
 *
 * Required env vars:
 *   R2_ACCOUNT_ID       – Cloudflare account ID
 *   R2_ACCESS_KEY_ID    – R2 API token: Access Key ID
 *   R2_SECRET_ACCESS_KEY – R2 API token: Secret Access Key
 *   R2_BUCKET           – Bucket name
 *   R2_PUBLIC_URL       – Public base URL (custom domain or r2.dev URL)
 *                         e.g. https://files.robeurope.com
 */

import crypto from 'crypto';

const R2_REGION = 'auto';
const R2_SERVICE = 's3';

function getConfig() {
  const accountId      = process.env.R2_ACCOUNT_ID;
  const accessKeyId    = process.env.R2_ACCESS_KEY_ID;
  const secretKey      = process.env.R2_SECRET_ACCESS_KEY;
  const bucket         = process.env.R2_BUCKET;
  const publicUrl      = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

  if (!accountId || !accessKeyId || !secretKey || !bucket) {
    throw new Error('Cloudflare R2 not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET in .env');
  }

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  return { accountId, accessKeyId, secretKey, bucket, endpoint, publicUrl };
}

/** HMAC-SHA256 helper */
function hmac(key, data, encoding) {
  return crypto.createHmac('sha256', key).update(data).digest(encoding);
}

/** SHA-256 hex of a buffer/string */
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/** Format Date as YYYYMMDD */
function dateStamp(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

/** Format Date as ISO 8601 basic (YYYYMMDDTHHmmssZ) */
function amzDate(d) {
  return d.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
}

/**
 * Upload a file buffer to Cloudflare R2.
 *
 * @param {object} opts
 * @param {Buffer} opts.buffer   - File content
 * @param {string} opts.key      - Object key (path in bucket), e.g. "teams/1/logo.png"
 * @param {string} opts.mimeType - MIME type, e.g. "image/png"
 * @returns {Promise<string>}    - Public URL of the uploaded file
 */
export async function uploadToR2({ buffer, key, mimeType }) {
  const cfg = getConfig();
  const now = new Date();
  const ds  = dateStamp(now);
  const ts  = amzDate(now);

  const host   = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const path   = `/${cfg.bucket}/${key}`;
  const payloadHash = sha256(buffer);

  // Canonical headers (must be sorted alphabetically by header name)
  const headers = {
    'content-type': mimeType,
    'host': host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': ts,
  };

  const sortedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderNames.map(k => `${k}:${headers[k]}`).join('\n') + '\n';
  const signedHeaders = sortedHeaderNames.join(';');

  const canonicalRequest = [
    'PUT',
    path,
    '', // query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const scope     = `${ds}/${R2_REGION}/${R2_SERVICE}/aws4_request`;
  const strToSign = ['AWS4-HMAC-SHA256', ts, scope, sha256(canonicalRequest)].join('\n');

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${cfg.secretKey}`, ds), R2_REGION), R2_SERVICE),
    'aws4_request'
  );
  const signature = hmac(signingKey, strToSign, 'hex');

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(', ');

  const url = `${cfg.endpoint}${path}`;

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 10_000); // 10s hard timeout

  let res;
  try {
    res = await fetch(url, {
      method: 'PUT',
      headers: { ...headers, Authorization: authorization },
      body: buffer,
      duplex: 'half',
      signal: abort.signal,
    });
  } catch (fetchErr) {
    const err = new Error(
      `No se pudo conectar con Cloudflare R2. Verifica que las credenciales R2 están configuradas correctamente. (${fetchErr.message})`
    );
    err.status = 503;
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`R2 upload failed (${res.status}): ${text}`);
    err.status = res.status === 403 ? 503 : 500;
    throw err;
  }

  // Return public URL
  if (cfg.publicUrl) {
    return `${cfg.publicUrl}/${key}`;
  }
  return `${cfg.endpoint}/${cfg.bucket}/${key}`;
}

/**
 * Delete an object from Cloudflare R2.
 *
 * @param {string} key - Object key to delete
 */
export async function deleteFromR2(key) {
  const cfg = getConfig();
  const now = new Date();
  const ds  = dateStamp(now);
  const ts  = amzDate(now);

  const host  = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const path  = `/${cfg.bucket}/${key}`;
  const payloadHash = sha256('');

  const headers = {
    'host': host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': ts,
  };

  const sortedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderNames.map(k => `${k}:${headers[k]}`).join('\n') + '\n';
  const signedHeaders = sortedHeaderNames.join(';');

  const canonicalRequest = ['DELETE', path, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const scope     = `${ds}/${R2_REGION}/${R2_SERVICE}/aws4_request`;
  const strToSign = ['AWS4-HMAC-SHA256', ts, scope, sha256(canonicalRequest)].join('\n');

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${cfg.secretKey}`, ds), R2_REGION), R2_SERVICE),
    'aws4_request'
  );
  const signature = hmac(signingKey, strToSign, 'hex');

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(', ');

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 10_000);

  let res;
  try {
    res = await fetch(`${cfg.endpoint}${path}`, {
      method: 'DELETE',
      headers: { ...headers, Authorization: authorization },
      signal: abort.signal,
    });
  } catch (fetchErr) {
    const err = new Error(`No se pudo conectar con Cloudflare R2. (${fetchErr.message})`);
    err.status = 503;
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '');
    throw new Error(`R2 delete failed (${res.status}): ${text}`);
  }
}

/**
 * Generate a presigned GET URL for an R2 object (no public bucket required).
 * The URL is valid for `expiresInSeconds` seconds (default 1 hour).
 *
 * @param {string} key             – Object key in the bucket
 * @param {number} [expiresIn=3600] – Validity in seconds
 * @returns {string} Presigned URL
 */
export function generatePresignedUrl(key, expiresIn = 3600) {
  const cfg = getConfig();
  const now = new Date();
  const ds  = dateStamp(now);
  const ts  = amzDate(now);

  const host       = `${cfg.accountId}.r2.cloudflarestorage.com`;
  const objectPath = encodeURI(`/${cfg.bucket}/${key}`);
  const credential = `${cfg.accessKeyId}/${ds}/${R2_REGION}/${R2_SERVICE}/aws4_request`;

  // Query params must be sorted alphabetically for canonical query string
  const paramEntries = [
    ['X-Amz-Algorithm',    'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential',   credential],
    ['X-Amz-Date',         ts],
    ['X-Amz-Expires',      String(expiresIn)],
    ['X-Amz-SignedHeaders', 'host'],
  ].sort((a, b) => a[0].localeCompare(b[0]));

  const canonicalQueryString = paramEntries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const canonicalRequest = [
    'GET',
    objectPath,
    canonicalQueryString,
    `host:${host}\n`, // canonical headers
    'host',           // signed headers
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const scope     = `${ds}/${R2_REGION}/${R2_SERVICE}/aws4_request`;
  const strToSign = ['AWS4-HMAC-SHA256', ts, scope, sha256(canonicalRequest)].join('\n');

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${cfg.secretKey}`, ds), R2_REGION), R2_SERVICE),
    'aws4_request'
  );
  const signature = hmac(signingKey, strToSign, 'hex');

  return `https://${host}${objectPath}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

/** Whether R2 is configured (all required vars must be non-empty strings) */
export function isR2Configured() {
  const v = (k) => (process.env[k] || '').trim();
  return !!(
    v('R2_ACCOUNT_ID') &&
    v('R2_ACCESS_KEY_ID') &&
    v('R2_SECRET_ACCESS_KEY') &&
    v('R2_BUCKET')
  );
}
