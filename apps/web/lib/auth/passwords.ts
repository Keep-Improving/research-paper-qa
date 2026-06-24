import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);
const algorithm = "pbkdf2_sha256";
const iterations = 210000;
const keyLength = 32;
const digest = "sha256";

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = await pbkdf2Async(password, salt, iterations, keyLength, digest);

  return `${algorithm}$${iterations}$${salt}$${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const parts = storedHash.split("$");
  if (parts.length !== 4) {
    return false;
  }

  const [storedAlgorithm, storedIterations, salt, encodedHash] = parts;
  if (storedAlgorithm !== algorithm) {
    return false;
  }

  const parsedIterations = Number(storedIterations);
  if (!Number.isInteger(parsedIterations) || parsedIterations <= 0) {
    return false;
  }

  const expected = Buffer.from(encodedHash, "base64url");
  const actual = await pbkdf2Async(password, salt, parsedIterations, expected.length, digest);
  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}
