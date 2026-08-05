<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="public/logo-light.png">
  <img alt="YourWayy Logo" src="public/logo-dark.png" height="80">
</picture>

# YourWayy – AI Learning Roadmap Platform 🧠🚀

*Read this in other languages: [Русский](#yourwayy--ai-learning-roadmap-platform--русский)*

Welcome to **YourWayy**, an interactive, personalized, and AI-driven educational platform designed to help users master any topic—from Artificial Intelligence and Machine Learning to everyday skills—through dynamically generated learning roadmaps!

## ✨ Key Features (English)

* **Interactive Knowledge Graph:** Visualize your learning path. Our dynamic Vis.js graph shows prerequisites and connections between concepts and courses.
* **AI-Generated Lessons (Powered by Grok API):** Utilizing the advanced capabilities of the Grok API (xAI), the platform generates comprehensive, up-to-date, and interactive markdown lessons on the fly based on the topic you select.
* **Gamification & Achievements:** Earn XP, climb the ranks in learning leagues, unlock achievements, and track your daily streaks. Learning has never been this engaging!
* **AI Mentor:** Get instant help, code reviews, and explanations from a smart AI tutor embedded directly in your learning environment.
* **Personalized Dashboard:** Track your daily activity, enrolled courses, and overall progress.
* **Multi-Language Support (i18n):** Fully localized interface natively supporting **English, Russian, Kazakh, and Chinese**.
* **Modern UI/UX:** Built with React, Tailwind CSS, and Framer Motion for a sleek, glassmorphic, and highly animated interface supporting both Dark and Light modes.
* **Secure Authentication & Database:** Uses Firebase Authentication for secure login and Cloud Firestore to safely sync your progress across devices.

## 🛠️ Technology Stack

* **Frontend Framework:** React 18 (via Vite)
* **Styling:** Tailwind CSS (with container queries & typography plugins)
* **Animations:** Framer Motion
* **Graph Visualization:** Vis-Network
* **Backend / Auth:** Firebase (Auth, Cloud Firestore, Functions, Storage)
* **AI Integration:** Grok API (xAI)
* **Routing:** React Router v6
* **Error Tracking:** Sentry

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18+) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/adilzhan2012/AI-Learning-Roadmap-Platform-Project-Hub-.git
   cd AI-Learning-Roadmap-Platform-Project-Hub-
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and add your Firebase, Sentry, reCAPTCHA, and Grok API configurations:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   
   VITE_SENTRY_DSN=your_sentry_dsn
   VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
   ```
   *(Note: The AI API key can also be provided or updated directly within the app's Settings -> API settings).*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

---

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="public/logo-light.png">
  <img alt="YourWayy Logo" src="public/logo-dark.png" height="80">
</picture>

# YourWayy – AI Learning Roadmap Platform 🧠🚀 (Русский)

Добро пожаловать в **YourWayy** — интерактивную и персонализированную образовательную платформу на базе ИИ, созданную для помощи пользователям в освоении любых навыков через динамически генерируемые дорожные карты обучения (roadmaps)!

## ✨ Ключевые особенности

* **Интерактивный Граф Знаний:** Визуализируйте свой путь обучения. Наш динамичный граф на базе Vis.js показывает зависимости и связи между концепциями и курсами.
* **Уроки, генерируемые ИИ (на базе Grok API):** Используя передовые возможности Grok API (xAI), платформа "на лету" генерирует подробные, актуальные и интерактивные уроки в формате markdown на основе выбранной темы.
* **Геймификация и Достижения:** Зарабатывайте XP, продвигайтесь по лигам, открывайте достижения и поддерживайте ежедневные стрики активности. Учиться еще никогда не было так увлекательно!
* **AI Ментор:** Получайте мгновенную помощь, проверку кода и объяснения от умного ИИ-наставника, встроенного прямо в вашу учебную среду.
* **Персональный Dashboard (Панель управления):** Отслеживайте свою ежедневную активность, курсы, на которые вы записаны, и общий прогресс.
* **Мультиязычность (i18n):** Полностью локализованный интерфейс со встроенной поддержкой **Английского, Русского, Казахского и Китайского** языков.
* **Современный UI/UX дизайн:** Разработано с использованием React, Tailwind CSS и Framer Motion. Интерфейс выполнен в стиле глассморфизма, имеет плавные анимации и поддерживает тёмную и светлую темы.
* **Безопасная аутентификация и База данных:** Использует Firebase Authentication для безопасного входа и Cloud Firestore для надежной синхронизации вашего прогресса на разных устройствах.

## 🛠️ Технологический стек

* **Фронтенд:** React 18 (через Vite)
* **Стилизация:** Tailwind CSS (включая плагины container queries и typography)
* **Анимации:** Framer Motion
* **Визуализация Графов:** Vis-Network
* **Бэкенд / Авторизация:** Firebase (Auth, Cloud Firestore, Functions, Storage)
* **Интеграция ИИ:** Grok API (xAI)
* **Роутинг:** React Router v6
* **Трекинг ошибок:** Sentry

## 🚀 Как начать (Getting Started)

### Требования

Убедитесь, что на вашем компьютере установлен [Node.js](https://nodejs.org/) (версии 18 и выше).

### Установка

1. **Клонируйте репозиторий:**
   ```bash
   git clone https://github.com/adilzhan2012/AI-Learning-Roadmap-Platform-Project-Hub-.git
   cd AI-Learning-Roadmap-Platform-Project-Hub-
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Переменные окружения:**
   Создайте файл `.env` в корневой директории и добавьте ваши конфигурации Firebase, Sentry, reCAPTCHA и API:
   ```env
   VITE_FIREBASE_API_KEY=ваш_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=ваш_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=ваш_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=ваш_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=ваш_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=ваш_firebase_app_id
   
   VITE_SENTRY_DSN=ваш_sentry_dsn
   VITE_RECAPTCHA_SITE_KEY=ваш_recaptcha_site_key
   ```
   *(Примечание: API-ключ ИИ также можно указать непосредственно внутри приложения в разделе Настройки -> API ключи).*

4. **Запустите локальный сервер:**
   ```bash
   npm run dev
   ```

## 📄 Лицензия

Этот проект распространяется под лицензией MIT.
