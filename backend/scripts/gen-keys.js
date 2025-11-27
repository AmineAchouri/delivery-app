const { generateKeyPairSync } = require('crypto');
const fs = require('fs');
const path = require('path');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
});

const keysDir = path.join(process.cwd(), 'keys');
if (!fs.existsSync(keysDir)) fs.mkdirSync(keysDir, { recursive: true });

const privPath = path.join(keysDir, 'jwt_private.pem');
const pubPath = path.join(keysDir, 'jwt_public.pem');

fs.writeFileSync(privPath, privateKey, { encoding: 'utf8', flag: 'w' });
fs.writeFileSync(pubPath, publicKey, { encoding: 'utf8', flag: 'w' });

console.log('Wrote:');
console.log('  ' + privPath);
console.log('  ' + pubPath);
console.log('\nAdd to .env:');
console.log('JWT_PRIVATE_KEY_FILE=keys/jwt_private.pem');
console.log('JWT_PUBLIC_KEY_FILE=keys/jwt_public.pem');