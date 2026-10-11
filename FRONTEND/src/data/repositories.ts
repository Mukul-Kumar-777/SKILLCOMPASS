import type { Repository } from '../types/github';

export const repositories: Repository[] = [
  {
    id: 'skillcompass',
    name: 'SkillCompass',
    description: 'AI-powered career intelligence platform',
    language: 'TypeScript', languageTone: 'blue', stars: 42, forks: 8, contributors: 12,
    status: 'Analyzed', visibility: 'Public', updated: '2 days ago', updatedHours: 48,
    topics: ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'AI'],
    languages: { TypeScript: 58, JavaScript: 18, CSS: 12, HTML: 7, SQL: 5 }, files: 246, commits: 184,
    analyzedAt: '2 days ago', githubUrl: 'https://github.com/'
  },
  {
    id: 'personal-portfolio',
    name: 'Personal-Portfolio', description: 'My personal portfolio website',
    language: 'React', languageTone: 'cyan', stars: 28, forks: 5, contributors: 3,
    status: 'Analyzed', visibility: 'Public', updated: '5 days ago', updatedHours: 120,
    topics: ['React', 'Vite', 'CSS'], languages: { JavaScript: 54, CSS: 32, HTML: 14 }, files: 74, commits: 67,
    analyzedAt: '5 days ago', githubUrl: 'https://github.com/'
  },
  {
    id: 'dsa-solutions',
    name: 'DSA-Solutions', description: 'Collection of DSA problem solutions',
    language: 'C++', languageTone: 'blue', stars: 112, forks: 24, contributors: 5,
    status: 'Not Analyzed', visibility: 'Public', updated: '1 week ago', updatedHours: 168,
    topics: ['C++', 'Algorithms', 'Data Structures'], languages: { 'C++': 93, CMake: 7 }, files: 312, commits: 139,
    githubUrl: 'https://github.com/'
  },
  {
    id: 'webdev-learning',
    name: 'WebDev-Learning', description: 'A repo to track my web development journey.',
    language: 'JavaScript', languageTone: 'yellow', stars: 18, forks: 6, contributors: 2,
    status: 'Analyzed', visibility: 'Public', updated: '1 week ago', updatedHours: 172,
    topics: ['JavaScript', 'Web Development', 'HTML'], languages: { JavaScript: 62, HTML: 23, CSS: 15 }, files: 128, commits: 92,
    analyzedAt: '1 week ago', githubUrl: 'https://github.com/'
  },
  {
    id: 'ml-experiments',
    name: 'ML-Experiments', description: 'Exploring machine learning concepts',
    language: 'Python', languageTone: 'blue', stars: 34, forks: 9, contributors: 4,
    status: 'Not Analyzed', visibility: 'Private', updated: '2 weeks ago', updatedHours: 336,
    topics: ['Python', 'Machine Learning', 'Jupyter'], languages: { Python: 78, Jupyter: 18, Shell: 4 }, files: 96, commits: 54,
    githubUrl: 'https://github.com/'
  },
  {
    id: 'android-notes',
    name: 'Android-Notes', description: 'Notes and small projects for Android development.',
    language: 'Kotlin', languageTone: 'purple', stars: 12, forks: 3, contributors: 2,
    status: 'Not Analyzed', visibility: 'Private', updated: '3 weeks ago', updatedHours: 504,
    topics: ['Kotlin', 'Android', 'Jetpack'], languages: { Kotlin: 81, XML: 14, Gradle: 5 }, files: 63, commits: 41,
    githubUrl: 'https://github.com/'
  },
];
