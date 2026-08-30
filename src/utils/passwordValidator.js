/**
 * NIST SP 800-63B Compliant Password Validation & Security Engine
 *
 * Requirements implemented:
 * 1. Length: Minimum 12 characters, Maximum 128 characters (no silent truncation).
 * 2. Full Unicode/UTF-8 support including spaces, emojis, Cyrillic, and special characters.
 * 3. Personal data exclusion: Password must not contain username, email prefix, first name, last name, or phone numbers.
 * 4. Common sequence & dictionary words prohibition (qwerty, 12345678, password, etc.).
 * 5. HaveIBeenPwned (HIBP) k-Anonymity API integration: SHA-1 hash prefix (first 5 chars) is sent, full password NEVER leaves client/server.
 * 6. Entropy calculation (zxcvbn-like algorithm evaluating dictionary, repeats, patterns, and character diversity).
 */

const COMMON_PASSWORDS = new Set([
  'password', 'password123', '12345678', '123456789', '1234567890',
  'qwerty1234', 'qwertyuiop', 'admin12345', 'administrator', 'iloveyou123',
  'letmein123', 'welcome123', 'monkey1234', 'dragon1234', 'master1234',
  'sunshine123', 'princess123', 'football123', 'shadow1234', 'superman123',
  'trustno1', 'secret1234', 'pass123456', 'starwars123', 'default123',
  'пароль12345', 'йцукен1234', 'ялюблютебя', 'администратор', 'москва1234'
]);

const SEQUENTIAL_PATTERNS = [
  '0123456789',
  '9876543210',
  'abcdefghijklmnopqrstuvwxyz',
  'zyxwvutsrqponmlkjihgfedcba',
  'абвгдеёжзийклмнопрстуфхцчшщъыьэюя',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
  'йцукенгшщзхъ',
  'фывапролджэ',
  'ячсмитьбю'
];

/**
 * Calculates SHA-1 hex string for a given text in browser (Web Crypto API)
 */
export async function sha1Hex(text) {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  // Node.js fallback if used on server
  try {
    const crypto = await import('crypto');
    return crypto.createHash('sha1').update(text).digest('hex').toUpperCase();
  } catch (_) {
    return '';
  }
}

/**
 * Checks HaveIBeenPwned API using k-Anonymity (sends only 5 chars of SHA-1 hash)
 * Returns count of times password appeared in known breaches.
 */
export async function checkPwnedPassword(password) {
  if (!password || password.length < 5) return 0;
  try {
    const hash = await sha1Hex(password);
    if (!hash || hash.length < 5) return 0;

    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'Add-Padding': 'true' // HIBP privacy enhancement
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) return 0;

    const text = await response.text();
    const lines = text.split('\n');
    for (const line of lines) {
      const [hashSuffix, countStr] = line.trim().split(':');
      if (hashSuffix && hashSuffix.toUpperCase() === suffix) {
        return parseInt(countStr, 10) || 0;
      }
    }
    return 0;
  } catch (err) {
    // Network failure or timeout: fail open with a warn, don't block user if HIBP is temporarily unreachable
    console.warn('[HIBP] Check skipped due to network/timeout:', err.message);
    return 0;
  }
}

/**
 * Checks if password contains user's personal info (name, email prefix, username, phone)
 */
export function checkPersonalDataMatch(password, context = {}) {
  if (!password) return [];
  const normalizedPass = password.toLowerCase();
  const violations = [];

  const candidates = [];
  if (context.email) {
    const emailPrefix = context.email.split('@')[0];
    if (emailPrefix && emailPrefix.length >= 3) candidates.push({ label: 'email', value: emailPrefix });
  }
  if (context.username && context.username.length >= 3) {
    candidates.push({ label: 'username', value: context.username });
  }
  if (context.firstName && context.firstName.length >= 3) {
    candidates.push({ label: 'firstName', value: context.firstName });
  }
  if (context.lastName && context.lastName.length >= 3) {
    candidates.push({ label: 'lastName', value: context.lastName });
  }
  if (context.phone && context.phone.replace(/\D/g, '').length >= 4) {
    candidates.push({ label: 'phone', value: context.phone.replace(/\D/g, '') });
  }

  for (const item of candidates) {
    const normVal = item.value.toLowerCase().trim();
    if (normalizedPass.includes(normVal)) {
      violations.push(item.label);
    }
  }

  return violations;
}

/**
 * Checks for obvious sequential or keyboard walk patterns
 */
export function checkObviousSequences(password) {
  if (!password || password.length < 4) return false;
  const norm = password.toLowerCase();

  // 1. Exact or substring match in top common passwords
  if (COMMON_PASSWORDS.has(norm)) return true;
  for (const common of COMMON_PASSWORDS) {
    if (norm.length >= 6 && common.length >= 6 && (norm.includes(common) || common.includes(norm))) {
      return true;
    }
  }

  // 2. Repeated characters (e.g. 'aaaaaa', '111111')
  if (/^(.)\1{4,}$/.test(norm)) return true;

  // 3. Sequential runs of 4+ characters in keyboard rows or alphabet
  for (const seq of SEQUENTIAL_PATTERNS) {
    for (let i = 0; i <= seq.length - 4; i++) {
      const sub = seq.substring(i, i + 4);
      if (norm.includes(sub)) return true;
    }
  }

  return false;
}

/**
 * Calculates password entropy and strength score (0 to 4)
 * Returns { score, label, feedback, color, percentage }
 */
export function calculatePasswordStrength(password, context = {}) {
  if (!password) {
    return {
      score: 0,
      percentage: 0,
      labelKey: 'auth.passwordStrength.empty',
      color: 'bg-zinc-300 dark:bg-zinc-700',
      textColor: 'text-zinc-400',
      suggestions: []
    };
  }

  let entropy = 0;
  const length = password.length;

  // Character set diversity
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9\s]/.test(password)) poolSize += 33; // special chars / symbols / emojis
  if (/[\u0400-\u04FF]/.test(password)) poolSize += 66; // Cyrillic alphabet
  if (/\s/.test(password)) poolSize += 1; // Spaces allowed per NIST

  if (poolSize > 0) {
    entropy = length * Math.log2(poolSize);
  }

  // Penalties
  const hasSequence = checkObviousSequences(password);
  if (hasSequence) entropy -= 25;

  const personalViolations = checkPersonalDataMatch(password, context);
  if (personalViolations.length > 0) entropy -= 30;

  // Repetition penalty
  const uniqueChars = new Set(password).size;
  if (length > 0 && uniqueChars / length < 0.5) {
    entropy -= 15;
  }

  entropy = Math.max(0, entropy);

  // Score brackets: 0 (Very Weak), 1 (Weak), 2 (Fair), 3 (Good), 4 (Strong)
  let score = 0;
  if (length < 8) {
    score = 0;
  } else if (length < 12 || entropy < 35 || hasSequence || personalViolations.length > 0) {
    score = 1;
  } else if (entropy < 55) {
    score = 2;
  } else if (entropy < 75) {
    score = 3;
  } else {
    score = 4;
  }

  // Color & Labels
  const levels = [
    { labelKey: 'auth.passwordStrength.veryWeak', color: 'bg-red-500', textColor: 'text-red-500', percentage: 15 },
    { labelKey: 'auth.passwordStrength.weak', color: 'bg-amber-500', textColor: 'text-amber-500', percentage: 35 },
    { labelKey: 'auth.passwordStrength.fair', color: 'bg-yellow-500', textColor: 'text-yellow-500', percentage: 65 },
    { labelKey: 'auth.passwordStrength.good', color: 'bg-blue-500', textColor: 'text-blue-500', percentage: 85 },
    { labelKey: 'auth.passwordStrength.strong', color: 'bg-emerald-500', textColor: 'text-emerald-500', percentage: 100 }
  ];

  return {
    score,
    entropy: Math.round(entropy),
    ...levels[score],
    hasSequence,
    personalViolations,
    lengthValid: length >= 12 && length <= 128
  };
}

/**
 * Validates password against full NIST SP 800-63B rules
 * Returns { valid: boolean, errors: string[] }
 */
export async function validateNistPassword(password, context = {}, options = { checkBreach: true, isAdmin: false }) {
  const errors = [];
  const minLength = options.isAdmin ? 14 : 12;
  const maxLength = 128;

  if (!password || typeof password !== 'string') {
    errors.push('auth.passwordRules.required');
    return { valid: false, errors };
  }

  // 1. Length checks
  if (password.length < minLength) {
    errors.push(options.isAdmin ? 'auth.passwordRules.minAdminLength' : 'auth.passwordRules.minLength');
  }
  if (password.length > maxLength) {
    errors.push('auth.passwordRules.maxLength');
  }

  // 2. Personal info match
  const personalViolations = checkPersonalDataMatch(password, context);
  if (personalViolations.length > 0) {
    errors.push('auth.passwordRules.noPersonalInfo');
  }

  // 3. Obvious sequences & common passwords
  if (checkObviousSequences(password)) {
    errors.push('auth.passwordRules.noSequences');
  }

  // 4. HaveIBeenPwned k-Anonymity breach check
  if (options.checkBreach && password.length >= minLength && errors.length === 0) {
    const breachCount = await checkPwnedPassword(password);
    if (breachCount > 0) {
      errors.push('auth.passwordRules.compromised');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
