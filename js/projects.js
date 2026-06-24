const projects = [
  {
    category: 'ai',
    title: 'VisionTrack',
    description: 'Real-time object detection & tracking using YOLOv8 & OpenCV. Detects 80+ object classes with adjustable confidence, BoT-SORT tracking, and webcam support.',
    tech: ['Python', 'YOLOv8', 'OpenCV', 'Streamlit', 'BoT-SORT'],
    github: 'https://github.com/SatyaNagesh/CodeAlpha_ObjectDetectionTracking',
    demo: 'https://github.com/SatyaNagesh/CodeAlpha_ObjectDetectionTracking'
  },
  {
    category: 'ai',
    title: 'LinguaFlow',
    description: 'AI Language Translation Tool supporting 100+ languages with text-to-speech, swap button, and translation history. Built with Python & Streamlit.',
    tech: ['Python', 'Streamlit', 'gTTS', 'googletrans'],
    github: 'https://github.com/SatyaNagesh/CodeAlpha_LanguageTranslationTool',
    demo: 'https://github.com/SatyaNagesh/CodeAlpha_LanguageTranslationTool'
  },
  {
    category: 'ai',
    title: 'FAQ Assistant',
    description: 'NLP-powered chatbot using TF-IDF & cosine similarity. Features confidence scoring, WhatsApp-style UI, dark mode, and smart fallback responses.',
    tech: ['Python', 'scikit-learn', 'Streamlit', 'NLP'],
    github: 'https://github.com/SatyaNagesh/CodeAlpha_FAQChatbot',
    demo: 'https://github.com/SatyaNagesh/CodeAlpha_FAQChatbot'
  },
  {
    category: 'ai',
    title: 'Friday — MCP Server',
    description: 'Extensible AI assistant framework built on the Model Context Protocol. Config-based architecture with tool, prompt, and resource extensibility.',
    tech: ['Python', 'MCP', 'OpenAI API'],
    github: 'https://github.com/SatyaNagesh/Friday',
    demo: 'https://github.com/SatyaNagesh/Friday'
  },
  {
    category: 'web',
    featured: true,
    title: 'ChromaForge',
    description: 'Professional color palette generator with 6 harmony algorithms, WCAG contrast checking, drag-to-reorder, and export to CSS/Tailwind/JSON.',
    tech: ['JavaScript', 'CSS', 'HTML5'],
    github: 'https://github.com/SatyaNagesh/Projects/tree/main/Color%20Palette%20Generator',
    demo: 'https://satyanagesh.github.io/Projects/Color%20Palette%20Generator/'
  },
  {
    category: 'web',
    featured: true,
    title: 'Workspace Board',
    description: 'Full Kanban board with drag & drop, priority filtering, search, modal task editor, overdue detection, and completion stats.',
    tech: ['JavaScript', 'CSS', 'HTML5'],
    github: 'https://github.com/SatyaNagesh/Projects/tree/main/Drag%20%26%20Drop%20Board',
    demo: 'https://satyanagesh.github.io/Projects/Drag%20%26%20Drop%20Board/'
  },
  {
    category: 'web',
    featured: true,
    title: 'Weather App',
    description: '7-day weather forecast with geolocation, 24-hour view, 26 WMO weather conditions with animated backgrounds, using free Open-Meteo API.',
    tech: ['JavaScript', 'Open-Meteo API', 'CSS', 'HTML5'],
    github: 'https://github.com/SatyaNagesh/Projects/tree/main/Weather%20App',
    demo: 'https://satyanagesh.github.io/Projects/Weather%20App/'
  },
  {
    category: 'web',
    featured: true,
    title: 'GitHub Finder',
    description: 'GitHub profile search app that fetches user data and top repos via GitHub REST API. Features rate limit handling and language color dots.',
    tech: ['JavaScript', 'GitHub API', 'CSS', 'HTML5'],
    github: 'https://github.com/SatyaNagesh/Projects/tree/main/Github%20Finder',
    demo: 'https://satyanagesh.github.io/Projects/Github%20Finder/'
  },
  {
    category: 'web',
    featured: true,
    title: 'Recipe Finder',
    description: 'Recipe discovery app using TheMealDB API. Search, filter by category, lazy-loaded images, modal with full ingredients & instructions.',
    tech: ['JavaScript', 'TheMealDB API', 'CSS', 'HTML5'],
    github: 'https://github.com/SatyaNagesh/Projects/tree/main/Recipe%20Finder',
    demo: 'https://satyanagesh.github.io/Projects/Recipe%20Finder/'
  },
  {
    category: 'web',
    featured: true,
    title: 'Quiz Game',
    description: 'Timed trivia with 3 categories, 3 difficulty levels, 15-second timer, persistent leaderboard, and answer highlighting mechanics.',
    tech: ['JavaScript', 'CSS', 'HTML5'],
    github: 'https://github.com/SatyaNagesh/Projects/tree/main/Quiz%20Game',
    demo: 'https://satyanagesh.github.io/Projects/Quiz%20Game/'
  },
  {
    category: 'web',
    featured: true,
    title: 'XPNS — Expense Tracker',
    description: 'Income/expense tracker with Indian Rupee formatting, 10 categories, date picker, localStorage persistence, and filter controls.',
    tech: ['JavaScript', 'CSS', 'HTML5'],
    github: 'https://github.com/SatyaNagesh/Projects/tree/main/Expense%20Tracker',
    demo: 'https://satyanagesh.github.io/Projects/Expense%20Tracker/'
  },
  {
    category: 'cv',
    title: 'Face Recognition System',
    description: 'Computer vision system for facial detection and recognition using OpenCV. Part of self-driven CV experiments.',
    tech: ['Python', 'OpenCV'],
    github: 'https://github.com/SatyaNagesh/Code',
    demo: 'https://github.com/SatyaNagesh/Code'
  },
  {
    category: 'cv',
    title: 'Hand Gesture Recognition',
    description: 'Real-time hand gesture detection and classification using computer vision techniques and Python.',
    tech: ['Python', 'OpenCV', 'CV'],
    github: 'https://github.com/SatyaNagesh/Code',
    demo: 'https://github.com/SatyaNagesh/Code'
  },
  {
    category: 'creative',
    title: '3D Rotating Cube',
    description: '3D graphics visualization demonstrating matrix transformations and projection mathematics in pure Python.',
    tech: ['Python', 'Graphics'],
    github: 'https://github.com/SatyaNagesh/Code',
    demo: 'https://github.com/SatyaNagesh/Code'
  },
  {
    category: 'creative',
    title: 'Galaxy Particle Simulation',
    description: 'Procedural particle system simulating spiral galaxy dynamics with real-time rendering.',
    tech: ['Python', 'Simulation'],
    github: 'https://github.com/SatyaNagesh/Code',
    demo: 'https://github.com/SatyaNagesh/Code'
  },
  {
    category: 'creative',
    title: 'Steganography Tool',
    description: 'Hide and extract secret messages within images using pixel-level encoding techniques.',
    tech: ['Python', 'Steganography'],
    github: 'https://github.com/SatyaNagesh/Code',
    demo: 'https://github.com/SatyaNagesh/Code'
  }
];

const categoryLabels = {
  ai: 'AI/ML',
  web: 'Web Dev',
  cv: 'Computer Vision',
  creative: 'Creative'
};
