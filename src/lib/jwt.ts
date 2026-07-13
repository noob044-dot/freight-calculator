const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bufferToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlToBuffer(base64url: string): Uint8Array {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    + '=='.slice((base64url.length % 4) || 4);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Signs a payload and returns an HMAC-SHA256 JWT.
 */
export async function sign(
  payload: Record<string, unknown>,
  secret: string,
  expMinutes = 60
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expMinutes * 60;
  
  const fullPayload = { ...payload, iat, exp };
  const header = { alg: "HS256", typ: "JWT" };
  
  const encodedHeader = bufferToBase64Url(encoder.encode(JSON.stringify(header)));
  const encodedPayload = bufferToBase64Url(encoder.encode(JSON.stringify(fullPayload)));
  
  const tokenInput = `${encodedHeader}.${encodedPayload}`;
  
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(tokenInput)
  );
  
  const encodedSignature = bufferToBase64Url(new Uint8Array(signatureBuffer));
  
  return `${tokenInput}.${encodedSignature}`;
}

/**
 * Verifies an HMAC-SHA256 JWT and returns the parsed payload. Returns null if invalid or expired.
 */
export async function verify(
  token: string,
  secret: string
): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const tokenInput = `${encodedHeader}.${encodedPayload}`;
    
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["verify"]
    );
    
    const signatureBytes = base64UrlToBuffer(encodedSignature);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as ArrayBuffer,
      encoder.encode(tokenInput)
    );
    
    if (!isValid) return null;
    
    const payloadBytes = base64UrlToBuffer(encodedPayload);
    const payload = JSON.parse(decoder.decode(payloadBytes));
    
    // Validate expiration claim
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}
