import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from '../firebase.js';
import { navigate } from '../router.js';

function renderAuthForm(type) {
  const isLogin = type === 'login';
  const title = isLogin ? 'Welcome back' : 'Create an account';
  const subtitle = isLogin ? 'Enter your details to access your dashboard.' : 'Sign up to start building your AI academy.';
  const submitText = isLogin ? 'Sign In' : 'Sign Up';
  const altText = isLogin ? "Don't have an account?" : "Already have an account?";
  const altLink = isLogin ? '#register' : '#login';
  const altLinkText = isLogin ? 'Sign up' : 'Log in';

  return `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#000000] p-6 relative overflow-hidden">
      <!-- Background elements -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div class="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full"></div>
        <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 blur-[100px] rounded-full"></div>
      </div>
      
      <div class="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-2xl glass-card animate-fade-in-up">
        
        <div class="flex items-center gap-2 mb-8 justify-center font-semibold text-xl tracking-tight text-gray-900 dark:text-white">
          <span class="material-symbols-outlined text-primary">view_in_ar</span>
          Project Hub
        </div>
        
        <h2 class="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">${title}</h2>
        <p class="text-center text-gray-500 dark:text-gray-400 mb-8">${subtitle}</p>
        
        <form id="auth-form" class="space-y-5">
          <div id="auth-error" class="hidden bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200"></div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
            <input type="email" id="email" required 
              class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="you@example.com">
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input type="password" id="password" required minlength="6"
              class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••">
          </div>
          
          <button type="submit" id="submit-btn"
            class="w-full py-3 rounded-xl bg-black dark:bg-white text-white dark:text-black font-medium text-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg hover:-translate-y-0.5 active:translate-y-0 duration-200 flex justify-center items-center gap-2">
            ${submitText}
          </button>
        </form>
        
        <p class="mt-8 text-center text-gray-600 dark:text-gray-400">
          ${altText} <a href="${altLink}" class="text-blue-600 hover:text-blue-500 font-medium ml-1">${altLinkText}</a>
        </p>
        <p class="mt-4 text-center">
          <a href="#landing" class="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">← Back to Home</a>
        </p>
      </div>
    </div>
  `;
}

export function renderLogin() {
  return renderAuthForm('login');
}

export function renderRegister() {
  return renderAuthForm('register');
}

export function initAuth() {
  const form = document.getElementById('auth-form');
  const errorDiv = document.getElementById('auth-error');
  const btn = document.getElementById('submit-btn');
  
  if (!form) return;

  const isLogin = window.location.hash === '#login';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.classList.add('hidden');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Simple UI loading state
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin" style="animation: spin 1s linear infinite;">progress_activity</span>';
    btn.disabled = true;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // On success, the auth state listener in main.js will handle redirect to dashboard
      // Or we can force it here just in case:
      navigate('dashboard');
    } catch (error) {
      console.error(error);
      errorDiv.textContent = getFriendlyErrorMessage(error.code);
      errorDiv.classList.remove('hidden');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
}

function getFriendlyErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please log in.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/invalid-api-key':
      return 'Firebase API Key is missing or invalid. Check your .env file.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is disabled. Please enable it in the Firebase Console.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
