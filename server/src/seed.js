import { db } from './config/firebase.js';

const roadmaps = [
  {
    id: 'default-roadmap',
    title: 'AI Academy Master Roadmap',
    instructor: 'AI Academy Team',
    rating: 4.9,
    students: '12,450',
    level: 'Beginner to Advanced',
    hours: '120h',
    lessons: 310,
    icon: 'Brain',
    category: 'AI Engineering',
    gradient: 'from-blue-600 to-indigo-900',
    description: 'An intelligent, immersive environment to track, learn, and master your technical roadmap.'
  }
];

const nodes = [
  { id: 'node-1', roadmapId: 'default-roadmap', title: 'Introduction to AI', instructor: 'Dr. Sarah Chen', rating: 4.9, students: '2,340', level: 'Beginner', hours: '8h', lessons: 24, icon: 'Brain', category: 'AI Fundamentals', gradient: 'from-blue-500 to-cyan-400', description: 'Learn the foundational concepts of artificial intelligence, history, and basic terminology.', x: 100.0, y: 100.0 },
  { id: 'node-2', roadmapId: 'default-roadmap', title: 'Machine Learning Fundamentals', instructor: 'Prof. James Liu', rating: 4.8, students: '1,890', level: 'Beginner', hours: '12h', lessons: 36, icon: 'Cpu', category: 'Machine Learning', gradient: 'from-emerald-500 to-teal-400', description: 'Dive into supervised and unsupervised learning, regressions, classification models, and algorithms.', x: 300.0, y: 100.0 },
  { id: 'node-3', roadmapId: 'default-roadmap', title: 'Neural Networks Deep Dive', instructor: 'Dr. Emily Watson', rating: 4.7, students: '1,200', level: 'Intermediate', hours: '15h', lessons: 42, icon: 'Network', category: 'Deep Learning', gradient: 'from-violet-500 to-purple-400', description: 'Understand artificial neural networks, backpropagation, and training deep learning models.', x: 500.0, y: 100.0 },
  { id: 'node-4', roadmapId: 'default-roadmap', title: 'NLP with Transformers', instructor: 'Dr. Alex Kumar', rating: 4.9, students: '980', level: 'Intermediate', hours: '10h', lessons: 28, icon: 'Languages', category: 'NLP', gradient: 'from-orange-500 to-amber-400', description: 'Explore natural language processing techniques, tokenization, and state-of-the-art Transformer architectures.', x: 700.0, y: 200.0 },
  { id: 'node-5', roadmapId: 'default-roadmap', title: 'Computer Vision Fundamentals', instructor: 'Prof. Lisa Park', rating: 4.6, students: '1,500', level: 'Intermediate', hours: '14h', lessons: 38, icon: 'Eye', category: 'Computer Vision', gradient: 'from-pink-500 to-rose-400', description: 'Learn to process images, apply convolutions, and build models for object detection and classification.', x: 500.0, y: -100.0 },
  { id: 'node-6', roadmapId: 'default-roadmap', title: 'Reinforcement Learning', instructor: 'Dr. Michael Torres', rating: 4.8, students: '750', level: 'Advanced', hours: '18h', lessons: 48, icon: 'Gamepad2', category: 'Machine Learning', gradient: 'from-indigo-500 to-blue-400', description: 'Master Markov decision processes, Q-learning, policy gradients, and decision making under uncertainty.', x: 300.0, y: 300.0 },
  { id: 'node-7', roadmapId: 'default-roadmap', title: 'GANs & Generative AI', instructor: 'Dr. Nina Patel', rating: 4.9, students: '2,100', level: 'Advanced', hours: '16h', lessons: 44, icon: 'Sparkles', category: 'Deep Learning', gradient: 'from-fuchsia-500 to-pink-400', description: 'Learn about Generative Adversarial Networks, image generation, autoencoders, and diffusion models.', x: 700.0, y: 0.0 },
  { id: 'node-8', roadmapId: 'default-roadmap', title: 'AI Ethics & Governance', instructor: 'Prof. David Kim', rating: 4.5, students: '3,200', level: 'Beginner', hours: '6h', lessons: 18, icon: 'Scale', category: 'AI Fundamentals', gradient: 'from-teal-500 to-green-400', description: 'Analyze bias in AI, ethical frameworks, privacy, regulations, and responsible deployment models.', x: 100.0, y: -100.0 },
  { id: 'node-9', roadmapId: 'default-roadmap', title: 'MLOps & Deployment', instructor: 'Dr. Rachel Green', rating: 4.7, students: '890', level: 'Advanced', hours: '20h', lessons: 52, icon: 'Cloud', category: 'Machine Learning', gradient: 'from-sky-500 to-indigo-400', description: 'Bridge the gap between model development and deployment. Setup pipelines, monitoring, and scaling.', x: 300.0, y: -300.0 }
];

const connections = [
  { id: 'conn-1', fromNodeId: 'node-1', toNodeId: 'node-2' },
  { id: 'conn-2', fromNodeId: 'node-1', toNodeId: 'node-8' },
  { id: 'conn-3', fromNodeId: 'node-2', toNodeId: 'node-3' },
  { id: 'conn-4', fromNodeId: 'node-2', toNodeId: 'node-6' },
  { id: 'conn-5', fromNodeId: 'node-2', toNodeId: 'node-9' },
  { id: 'conn-6', fromNodeId: 'node-3', toNodeId: 'node-4' },
  { id: 'conn-7', fromNodeId: 'node-3', toNodeId: 'node-5' },
  { id: 'conn-8', fromNodeId: 'node-3', toNodeId: 'node-7' },
  { id: 'conn-9', fromNodeId: 'node-4', toNodeId: 'node-7' }
];

const resources = [
  { id: 'res-featured', type: 'article', title: 'The Complete Guide to Transformer Architecture', desc: 'An in-depth walkthrough of the Transformer model — from positional encoding and multi-head attention to layer normalization and feed-forward networks.', tags: 'GenAI,Transformers,Tutorial', author: 'Dr. Sarah Chen', meta: '25 min read', date: 'Jun 10, 2026', isFeatured: true },
  { id: 'res-1', type: 'article', title: 'Understanding Attention Mechanisms', desc: 'Deep dive into self-attention and how it powers modern NLP architectures.', tags: 'NLP,Transformers', author: 'Dr. Sarah Chen', meta: '12 min read', date: 'Jun 2, 2026', isFeatured: false },
  { id: 'res-2', type: 'video', title: 'Building Your First Neural Network', desc: 'Step-by-step tutorial walking you through creating a neural network from scratch.', tags: 'Tutorial,PyTorch', author: 'AI Academy', meta: '45 min', date: 'May 28, 2026', isFeatured: false },
  { id: 'res-3', type: 'cheatsheet', title: 'Python for ML Quick Reference', desc: 'Essential Python snippets and patterns every ML practitioner should know.', tags: 'Python,Basics', author: 'Prof. James Liu', meta: 'Quick Reference', date: 'May 15, 2026', isFeatured: false },
  { id: 'res-4', type: 'repository', title: 'Transformer Implementation from Scratch', desc: 'Full PyTorch implementation of the original Transformer architecture.', tags: 'GitHub,Code', author: 'Dr. Sarah Chen', meta: '2.4k stars', date: 'Apr 30, 2026', isFeatured: false },
  { id: 'res-5', type: 'article', title: 'The Future of Generative AI', desc: 'Industry trends and predictions shaping the next wave of generative models.', tags: 'GenAI,Trends', author: 'Dr. Nina Patel', meta: '8 min read', date: 'May 20, 2026', isFeatured: false },
  { id: 'res-6', type: 'video', title: 'Deploying ML Models at Scale', desc: 'Production best practices for serving machine learning models reliably.', tags: 'MLOps,Cloud', author: 'Dr. Rachel Green', meta: '1h 20min', date: 'May 10, 2026', isFeatured: false },
  { id: 'res-7', type: 'cheatsheet', title: 'Linear Algebra for Deep Learning', desc: 'Key formulas and concepts distilled into a single quick-reference sheet.', tags: 'Math,Foundations', author: 'Prof. David Kim', meta: 'Formula Sheet', date: 'Apr 22, 2026', isFeatured: false },
  { id: 'res-8', type: 'article', title: "Ethical AI: A Practitioner's Guide", desc: 'Responsible AI development practices every team should adopt.', tags: 'Ethics,Policy', author: 'Prof. David Kim', meta: '15 min read', date: 'Apr 18, 2026', isFeatured: false },
  { id: 'res-9', type: 'repository', title: 'Computer Vision Toolkit', desc: 'Pre-built CV components for rapid prototyping and experimentation.', tags: 'GitHub,Vision', author: 'Prof. Lisa Park', meta: '1.8k stars', date: 'Apr 5, 2026', isFeatured: false }
];

async function seed() {
  console.log('Starting Firestore seeding using Admin SDK...');
  
  try {
    // Seed Roadmaps
    for (const rm of roadmaps) {
      await db.collection('roadmaps').doc(rm.id).set(rm);
      console.log(`Seeded roadmap: ${rm.title}`);
    }

    // Seed Nodes
    for (const node of nodes) {
      await db.collection('nodes').doc(node.id).set(node);
      console.log(`Seeded node: ${node.title}`);
    }

    // Seed Connections
    for (const conn of connections) {
      await db.collection('connections').doc(conn.id).set(conn);
      console.log(`Seeded connection: ${conn.fromNodeId} -> ${conn.toNodeId}`);
    }

    // Seed Resources
    for (const res of resources) {
      await db.collection('resources').doc(res.id).set(res);
      console.log(`Seeded resource: ${res.title}`);
    }

    console.log('Firestore database successfully seeded!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding Firestore database:', err);
    process.exit(1);
  }
}

seed();
