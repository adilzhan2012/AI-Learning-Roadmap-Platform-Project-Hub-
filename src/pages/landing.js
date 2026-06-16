// ============================================
// Landing Page — High-end Apple-inspired
// ============================================

import { auth } from '../firebase.js';

export function renderLanding() {
  const isLoggedIn = !!auth.currentUser;
  
  const navActionHtml = isLoggedIn
    ? `<a href="#dashboard" class="text-sm font-medium bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full hover:scale-105 transition-transform active:scale-95 inline-block">Go to Dashboard</a>`
    : `<a href="#login" class="text-sm font-medium bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full hover:scale-105 transition-transform active:scale-95 inline-block">Log in</a>
       <a href="#register" class="ml-2 text-sm font-medium border border-gray-300 dark:border-gray-700 bg-transparent text-black dark:text-white px-4 py-2 rounded-full hover:scale-105 transition-transform active:scale-95 inline-block">Sign up</a>`;
       
  const heroActionHtml = isLoggedIn
    ? `<a href="#dashboard" class="px-8 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium text-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 duration-200">
         Open Dashboard
       </a>`
    : `<a href="#register" class="px-8 py-4 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium text-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 duration-200">
         Get Started Now
       </a>`;

  return `
    <div class="min-h-screen bg-white dark:bg-[#000000] text-gray-900 dark:text-gray-100 font-sans overflow-x-hidden selection:bg-blue-200 dark:selection:bg-blue-900">
      
      <!-- Minimal Nav -->
      <nav class="fixed top-0 w-full z-50 bg-white/70 dark:bg-black/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div class="flex items-center gap-2 cursor-pointer font-semibold text-lg tracking-tight">
            <span class="material-symbols-outlined text-primary">view_in_ar</span>
            Project Hub
          </div>
          <div class="hidden md:flex space-x-8 text-sm font-medium text-gray-500 dark:text-gray-400">
            <a href="#features" class="hover:text-black dark:hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" class="hover:text-black dark:hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" class="hover:text-black dark:hover:text-white transition-colors">Pricing</a>
          </div>
          <div>
            ${navActionHtml}
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center justify-center text-center">
        <!-- Abstract gradient background accent -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-500/20 dark:bg-blue-600/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div class="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-purple-600/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

        <div class="max-w-4xl mx-auto animate-fade-in-up">
          <h1 class="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Simplicity at the <br/><span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">core of intelligence.</span>
          </h1>
          <p class="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 font-light">
            Empower your workflow with a seamless, AI-driven academy platform. Learn faster, build smarter, and focus on what truly matters.
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            ${heroActionHtml}
            <a href="#features" class="px-8 py-4 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-medium text-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors duration-200">
              Learn More
            </a>
          </div>
        </div>

        <!-- 3D Render Placeholder / Abstract Graphic -->
        <div class="mt-20 relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50 glass-card">
          <div class="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center relative">
            <div class="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/20"></div>
            <span class="material-symbols-outlined text-[120px] text-gray-300 dark:text-gray-700">dashboard_customize</span>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="py-24 px-6 bg-gray-50 dark:bg-[#0a0a0a]">
        <div class="max-w-7xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-3xl md:text-5xl font-bold tracking-tight mb-4">Brilliantly capable.</h2>
            <p class="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Designed from the ground up to provide an unparalleled learning experience with intelligent features.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <!-- Feature 1 -->
            <div class="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span class="material-symbols-outlined text-blue-600 dark:text-blue-400">bolt</span>
              </div>
              <h3 class="text-xl font-semibold mb-3">Lightning Fast</h3>
              <p class="text-gray-500 dark:text-gray-400 leading-relaxed">Built on a modern stack to ensure every interaction feels instantaneous and fluid.</p>
            </div>
            
            <!-- Feature 2 -->
            <div class="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span class="material-symbols-outlined text-indigo-600 dark:text-indigo-400">auto_awesome</span>
              </div>
              <h3 class="text-xl font-semibold mb-3">AI-Powered Insights</h3>
              <p class="text-gray-500 dark:text-gray-400 leading-relaxed">Leverage intelligent algorithms that adapt to your learning pace and suggest optimal paths.</p>
            </div>

            <!-- Feature 3 -->
            <div class="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span class="material-symbols-outlined text-purple-600 dark:text-purple-400">hub</span>
              </div>
              <h3 class="text-xl font-semibold mb-3">Knowledge Graph</h3>
              <p class="text-gray-500 dark:text-gray-400 leading-relaxed">Visualize connections between concepts with our interactive 3D knowledge map.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- How it Works -->
      <section id="how-it-works" class="py-24 px-6">
        <div class="max-w-5xl mx-auto">
          <h2 class="text-3xl md:text-5xl font-bold tracking-tight mb-16 text-center">As easy as 1, 2, 3.</h2>
          
          <div class="space-y-16">
            <!-- Step 1 -->
            <div class="flex flex-col md:flex-row items-center gap-12">
              <div class="flex-1 text-center md:text-right">
                <div class="text-blue-500 font-bold text-lg mb-2">Step 1</div>
                <h3 class="text-2xl font-bold mb-4">Create your workspace</h3>
                <p class="text-gray-500 dark:text-gray-400">Sign up and instantly access a personalized dashboard tailored to your objectives and interests.</p>
              </div>
              <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-inner z-10">
                <span class="text-2xl font-bold">1</span>
              </div>
              <div class="flex-1"></div>
            </div>

            <!-- Step 2 -->
            <div class="flex flex-col md:flex-row-reverse items-center gap-12">
              <div class="flex-1 text-center md:text-left">
                <div class="text-indigo-500 font-bold text-lg mb-2">Step 2</div>
                <h3 class="text-2xl font-bold mb-4">Explore the Knowledge Graph</h3>
                <p class="text-gray-500 dark:text-gray-400">Navigate through interconnected topics. Discover new areas of study naturally as you progress.</p>
              </div>
              <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-inner z-10">
                <span class="text-2xl font-bold">2</span>
              </div>
              <div class="flex-1"></div>
            </div>

            <!-- Step 3 -->
            <div class="flex flex-col md:flex-row items-center gap-12">
              <div class="flex-1 text-center md:text-right">
                <div class="text-purple-500 font-bold text-lg mb-2">Step 3</div>
                <h3 class="text-2xl font-bold mb-4">Master new skills</h3>
                <p class="text-gray-500 dark:text-gray-400">Complete interactive courses and earn certifications while tracking your learning journey.</p>
              </div>
              <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-inner z-10">
                <span class="text-2xl font-bold">3</span>
              </div>
              <div class="flex-1"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Social Proof -->
      <section class="py-20 px-6 bg-gray-50 dark:bg-[#0a0a0a] border-y border-gray-200 dark:border-gray-800">
        <div class="max-w-7xl mx-auto text-center">
          <p class="text-lg font-medium text-gray-500 dark:text-gray-400 mb-8">Trusted by innovative teams worldwide</p>
          <div class="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <span class="material-symbols-outlined text-4xl">ac_unit</span>
            <span class="material-symbols-outlined text-4xl">eco</span>
            <span class="material-symbols-outlined text-4xl">language</span>
            <span class="material-symbols-outlined text-4xl">rocket_launch</span>
            <span class="material-symbols-outlined text-4xl">fingerprint</span>
          </div>
        </div>
      </section>

      <!-- Pricing -->
      <section id="pricing" class="py-24 px-6">
        <div class="max-w-5xl mx-auto">
          <div class="text-center mb-16">
            <h2 class="text-3xl md:text-5xl font-bold tracking-tight mb-4">Simple, transparent pricing.</h2>
            <p class="text-lg text-gray-500 dark:text-gray-400">Choose the plan that fits your needs.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <!-- Basic Plan -->
            <div class="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-3xl p-8 flex flex-col">
              <h3 class="text-2xl font-semibold mb-2">Basic</h3>
              <p class="text-gray-500 dark:text-gray-400 mb-6">Perfect for getting started.</p>
              <div class="mb-8">
                <span class="text-5xl font-bold">$0</span>
                <span class="text-gray-500 dark:text-gray-400">/month</span>
              </div>
              <ul class="space-y-4 mb-8 flex-1">
                <li class="flex items-center gap-3 text-gray-600 dark:text-gray-300"><span class="material-symbols-outlined text-sm text-green-500">check</span> Access to basic courses</li>
                <li class="flex items-center gap-3 text-gray-600 dark:text-gray-300"><span class="material-symbols-outlined text-sm text-green-500">check</span> Community forum access</li>
                <li class="flex items-center gap-3 text-gray-600 dark:text-gray-300"><span class="material-symbols-outlined text-sm text-green-500">check</span> Standard support</li>
              </ul>
              <button class="w-full py-3 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                Start for free
              </button>
            </div>

            <!-- Pro Plan -->
            <div class="bg-gray-900 dark:bg-white text-white dark:text-black border border-gray-900 dark:border-white rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl">
              <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <h3 class="text-2xl font-semibold mb-2">Pro</h3>
              <p class="text-gray-400 dark:text-gray-500 mb-6">For serious learners and professionals.</p>
              <div class="mb-8">
                <span class="text-5xl font-bold">$29</span>
                <span class="text-gray-400 dark:text-gray-500">/month</span>
              </div>
              <ul class="space-y-4 mb-8 flex-1">
                <li class="flex items-center gap-3"><span class="material-symbols-outlined text-sm text-blue-400 dark:text-blue-600">check</span> Everything in Basic</li>
                <li class="flex items-center gap-3"><span class="material-symbols-outlined text-sm text-blue-400 dark:text-blue-600">check</span> Unlimited courses</li>
                <li class="flex items-center gap-3"><span class="material-symbols-outlined text-sm text-blue-400 dark:text-blue-600">check</span> Advanced Knowledge Graph</li>
                <li class="flex items-center gap-3"><span class="material-symbols-outlined text-sm text-blue-400 dark:text-blue-600">check</span> Priority 24/7 support</li>
              </ul>
              <button class="w-full py-3 rounded-full bg-white dark:bg-black text-black dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Final CTA -->
      <section class="py-24 px-6 text-center relative overflow-hidden">
        <div class="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 -z-10"></div>
        <div class="max-w-3xl mx-auto">
          <h2 class="text-4xl md:text-6xl font-bold tracking-tight mb-6">Ready to transform your learning?</h2>
          <p class="text-xl text-gray-500 dark:text-gray-400 mb-10">Join thousands of users who are already building the future.</p>
          ${isLoggedIn ? 
            `<a href="#dashboard" class="px-8 py-4 rounded-full bg-blue-600 text-white font-medium text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 inline-block">
              Go to Dashboard
            </a>` :
            `<a href="#register" class="px-8 py-4 rounded-full bg-blue-600 text-white font-medium text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 inline-block">
              Create Free Account
            </a>`
          }
        </div>
      </section>

      <!-- Footer -->
      <footer class="border-t border-gray-200 dark:border-gray-800 py-12 px-6">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <span class="material-symbols-outlined">view_in_ar</span>
            Project Hub
          </div>
          <div class="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
            <a href="#" class="hover:text-black dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" class="hover:text-black dark:hover:text-white transition-colors">Terms</a>
            <a href="#" class="hover:text-black dark:hover:text-white transition-colors">Contact</a>
          </div>
          <p class="text-sm text-gray-400 dark:text-gray-600">
            &copy; 2026 Project Hub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  `;
}

export function initLanding() {
  // Add smooth scroll behavior for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      // Only smooth scroll if it's an ID on the same page (not a router link like #dashboard)
      if (targetId.length > 1 && targetId !== '#dashboard' && document.querySelector(targetId)) {
        e.preventDefault();
        document.querySelector(targetId).scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
}
