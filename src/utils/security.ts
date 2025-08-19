import argon2 from "argon2";
import owasp from "owasp-password-strength-test";
import { formatZodError } from "./formatZodErrors";
import { passwordSchema } from "../scehma/auth.schema";

owasp.config({
  allowPassphrases: true,
  maxLength: 128,
  minLength: 6,
  minPhraseLength: 20,
  minOptionalTestsToPass: 4,
});

export function validatePasswordStrength(password: string) {
  const basic = passwordSchema.safeParse(password);
  if (!basic.success) {
    return {
      ok: false,
      message: formatZodError(basic.error),
    };
  }

  const result = owasp.test(password);

  if (!result.strong) {
    const allErrors = [
      ...(result.requiredTestErrors || []),
      ...(result.optionalTestErrors || []),
    ];

    return {
      ok: false,
      message: allErrors.join("; ") || "Password too weak",
      details: allErrors,
    };
  }

  return { ok: true };
}

export async function hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
  });
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}