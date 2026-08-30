const crypto = require('crypto');

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

function sha1HexNode(text) {
  return crypto.createHash('sha1').update(text).digest('hex').toUpperCase();
}

async function checkPwnedPasswordServer(password) {
  if (!password || password.length < 5) return 0;
  try {
    const hash = sha1HexNode(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'Add-Padding': 'true'
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
    console.warn('[HIBP Server] Check error/timeout:', err.message);
    return 0;
  }
}

function checkPersonalDataMatchServer(password, context = {}) {
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

function checkObviousSequencesServer(password) {
  if (!password || password.length < 4) return false;
  const norm = password.toLowerCase();

  if (COMMON_PASSWORDS.has(norm)) return true;
  for (const common of COMMON_PASSWORDS) {
    if (norm.length >= 6 && common.length >= 6 && (norm.includes(common) || common.includes(norm))) {
      return true;
    }
  }

  if (/^(.)\1{4,}$/.test(norm)) return true;

  for (const seq of SEQUENTIAL_PATTERNS) {
    for (let i = 0; i <= seq.length - 4; i++) {
      const sub = seq.substring(i, i + 4);
      if (norm.includes(sub)) return true;
    }
  }

  return false;
}

async function validatePasswordNistServer({ password, context = {}, isAdmin = false, checkBreaches = true }) {
  const errors = [];
  const minLength = isAdmin ? 14 : 12;
  const maxLength = 128;

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['PASSWORD_REQUIRED'], message: 'Пароль обязателен для заполнения' };
  }

  if (password.length < minLength) {
    errors.push('PASSWORD_TOO_SHORT');
  }

  if (password.length > maxLength) {
    errors.push('PASSWORD_TOO_LONG');
  }

  const personalViolations = checkPersonalDataMatchServer(password, context);
  if (personalViolations.length > 0) {
    errors.push('PASSWORD_CONTAINS_PERSONAL_INFO');
  }

  if (checkObviousSequencesServer(password)) {
    errors.push('PASSWORD_TOO_COMMON_OR_SEQUENTIAL');
  }

  if (checkBreaches && errors.length === 0 && password.length >= minLength) {
    const breachCount = await checkPwnedPasswordServer(password);
    if (breachCount > 0) {
      errors.push('PASSWORD_COMPROMISED_IN_DATA_BREACH');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    breachCount: errors.includes('PASSWORD_COMPROMISED_IN_DATA_BREACH') ? 1 : 0
  };
}

module.exports = {
  validatePasswordNistServer,
  checkPwnedPasswordServer,
  checkPersonalDataMatchServer,
  checkObviousSequencesServer
};
