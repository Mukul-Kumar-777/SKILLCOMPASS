import type { CSSProperties } from 'react';

export type RoleDomain =
  | 'Software Development'
  | 'Data Science & Analytics'
  | 'AI & Machine Learning'
  | 'Cloud & DevOps';

export type RoleRequirementType = 'core' | 'important' | 'preferred';

export interface RoleSkillDefinition {
  name: string;
  aliases?: string[];
  requiredLevel: number;
  importance: number;
  type: RoleRequirementType;
}

export interface CuratedJobProfile {
  id: string;
  slug: string;
  title: string;
  domain: RoleDomain;
  description: string;
  responsibilities: string[];
  aliases: string[];
  source: 'curated' | 'backend';
  skills: RoleSkillDefinition[];
}

const role = (
  id: string,
  title: string,
  domain: RoleDomain,
  description: string,
  responsibilities: string[],
  skills: Array<[string, number, RoleRequirementType, string[]?]>,
  aliases: string[] = [],
): CuratedJobProfile => ({
  id: `curated-${id}`,
  slug: id,
  title,
  domain,
  description,
  responsibilities,
  aliases,
  source: 'curated',
  skills: skills.map(([name, requiredLevel, type, skillAliases]) => ({
    name,
    aliases: skillAliases,
    requiredLevel,
    importance: type === 'core' ? 1 : type === 'important' ? 0.8 : 0.5,
    type,
  })),
});

export const CURATED_JOB_PROFILES: CuratedJobProfile[] = [
  // SOFTWARE DEVELOPMENT — 10 curated roles
  role('frontend-developer', 'Frontend Developer', 'Software Development',
    'Build responsive, accessible interfaces and turn product ideas into polished web experiences.',
    ['Build production web interfaces', 'Integrate APIs and reusable components', 'Improve performance and accessibility'],
    [['JavaScript', 80, 'core', ['javascript programming', 'js']], ['React', 72, 'core', ['react.js', 'reactjs']], ['HTML', 65, 'core', ['html5']], ['CSS', 70, 'core', ['css3']], ['TypeScript', 68, 'important'], ['Git', 60, 'important'], ['Testing', 55, 'important'], ['Next.js', 52, 'preferred', ['nextjs']]],
    ['Web Developer', 'React Developer'],
  ),
  role('backend-developer', 'Backend Developer', 'Software Development',
    'Design reliable APIs, application services and data flows that power modern products.',
    ['Build APIs and backend services', 'Design data access patterns', 'Improve reliability and observability'],
    [['Node.js', 70, 'core', ['nodejs', 'node']], ['REST APIs', 72, 'core', ['rest api', 'rest']], ['Databases', 65, 'core', ['database', 'sql']], ['Git', 60, 'important'], ['Testing', 58, 'important'], ['Docker', 55, 'preferred'], ['System Design', 60, 'preferred']],
    ['Node.js Developer', 'API Developer'],
  ),
  role('full-stack-developer', 'Full Stack Developer', 'Software Development',
    'Develop end-to-end product features across interfaces, APIs, application logic and data.',
    ['Develop end-to-end features', 'Connect frontend, backend and databases', 'Ship complete product functionality'],
    [['JavaScript', 80, 'core', ['javascript programming', 'js']], ['React', 72, 'core', ['reactjs', 'react.js']], ['Node.js', 68, 'core', ['nodejs']], ['REST APIs', 70, 'core', ['rest api']], ['Databases', 65, 'important', ['database', 'sql']], ['Git', 60, 'important'], ['Testing', 58, 'important'], ['Docker', 52, 'preferred']],
    ['Full Stack Engineer'],
  ),
  role('software-engineer', 'Software Engineer', 'Software Development',
    'Solve engineering problems across implementation, architecture, testing and delivery.',
    ['Implement maintainable software', 'Collaborate on technical design', 'Debug, test and ship features'],
    [['Programming', 78, 'core', ['programming']], ['Data Structures', 65, 'core', ['data structures and algorithms', 'dsa']], ['Git', 60, 'important'], ['Testing', 60, 'important'], ['System Design', 58, 'important'], ['APIs', 60, 'preferred', ['rest api']], ['Cloud', 48, 'preferred']],
    ['Software Developer', 'Application Developer'],
  ),
  role('web-developer', 'Web Developer', 'Software Development',
    'Create and maintain websites and web applications across frontend and server technologies.',
    ['Build web experiences', 'Maintain client and server code', 'Integrate services and content'],
    [['HTML', 65, 'core', ['html5']], ['CSS', 65, 'core', ['css3']], ['JavaScript', 72, 'core', ['javascript programming', 'js']], ['Git', 58, 'important'], ['Responsive Design', 55, 'important'], ['APIs', 52, 'preferred', ['rest api']], ['Accessibility', 48, 'preferred']],
    ['Web Application Developer'],
  ),
  role('mobile-app-developer', 'Mobile App Developer', 'Software Development',
    'Build mobile applications with strong product experiences, APIs and reliable app behavior.',
    ['Build mobile application features', 'Integrate APIs and local data', 'Test and release app experiences'],
    [['Mobile Development', 75, 'core', ['mobile apps']], ['JavaScript', 65, 'important', ['javascript programming']], ['React Native', 65, 'core', ['react-native', 'react native']], ['APIs', 60, 'important', ['rest api']], ['Git', 58, 'important'], ['Testing', 52, 'preferred']],
    ['React Native Developer', 'Mobile Developer'],
  ),
  role('react-developer', 'React Developer', 'Software Development',
    'Specialize in building component-driven interfaces and frontend application experiences with React.',
    ['Build reusable React components', 'Manage application state and APIs', 'Improve UI performance and accessibility'],
    [['React', 80, 'core', ['reactjs', 'react.js']], ['JavaScript', 78, 'core', ['javascript programming', 'js']], ['HTML', 65, 'important', ['html5']], ['CSS', 68, 'important', ['css3']], ['TypeScript', 65, 'important'], ['Git', 58, 'important'], ['Testing', 55, 'preferred']],
    ['Frontend React Developer'],
  ),
  role('nodejs-developer', 'Node.js Developer', 'Software Development',
    'Build JavaScript and TypeScript backend services, APIs and integrations with Node.js.',
    ['Build Node.js services', 'Design API integrations', 'Work with databases and asynchronous workflows'],
    [['Node.js', 80, 'core', ['nodejs', 'node']], ['JavaScript', 76, 'core', ['javascript programming', 'js']], ['REST APIs', 72, 'core', ['rest api']], ['Databases', 62, 'important', ['database', 'sql']], ['Git', 58, 'important'], ['Testing', 55, 'important'], ['Docker', 52, 'preferred']],
    ['Node Developer'],
  ),
  role('java-developer', 'Java Developer', 'Software Development',
    'Develop backend and enterprise applications using Java, APIs, databases and testing practices.',
    ['Build Java services', 'Work with APIs and databases', 'Test and maintain production applications'],
    [['Java', 80, 'core', ['java programming']], ['Spring', 65, 'important', ['spring boot', 'springboot']], ['REST APIs', 68, 'important', ['rest api']], ['SQL', 65, 'important'], ['Git', 58, 'important'], ['Testing', 55, 'preferred'], ['Docker', 48, 'preferred']],
    ['Java Software Developer'],
  ),
  role('dotnet-developer', '.NET Developer', 'Software Development',
    'Build application and backend services with the .NET ecosystem and supporting cloud tools.',
    ['Build .NET applications', 'Develop APIs and data access', 'Maintain application quality and reliability'],
    [['C#', 80, 'core', ['c sharp']], ['.NET', 78, 'core', ['dotnet']], ['ASP.NET', 65, 'important', ['asp net', 'aspnet']], ['SQL', 62, 'important'], ['Git', 58, 'important'], ['REST APIs', 60, 'important', ['rest api']], ['Testing', 52, 'preferred']],
    ['C# Developer', 'ASP.NET Developer'],
  ),

  // DATA SCIENCE & ANALYTICS — 10 curated roles
  role('data-analyst', 'Data Analyst', 'Data Science & Analytics',
    'Turn structured data into useful insights through analysis, reporting and visualization.',
    ['Query and clean datasets', 'Build reports and dashboards', 'Communicate useful findings'],
    [['SQL', 78, 'core'], ['Excel', 65, 'core', ['microsoft excel']], ['Python', 62, 'important'], ['Data Visualization', 62, 'core', ['data viz', 'visualization']], ['Statistics', 58, 'important'], ['Pandas', 55, 'preferred'], ['BI Tools', 52, 'preferred', ['power bi', 'tableau']]],
    ['Business Data Analyst'],
  ),
  role('data-scientist', 'Data Scientist', 'Data Science & Analytics',
    'Use statistics, programming and machine learning to answer data-driven questions.',
    ['Explore and clean data', 'Build statistical or ML models', 'Communicate findings and model results'],
    [['Python', 78, 'core'], ['Statistics', 75, 'core'], ['Pandas', 70, 'important'], ['NumPy', 62, 'important'], ['Machine Learning', 65, 'important'], ['SQL', 62, 'important'], ['Data Visualization', 55, 'preferred']],
    ['Applied Data Scientist'],
  ),
  role('data-engineer', 'Data Engineer', 'Data Science & Analytics',
    'Build reliable data pipelines, storage systems and transformations that support analytics and ML.',
    ['Build data pipelines', 'Design data storage and transformation', 'Improve data reliability and scalability'],
    [['Python', 70, 'core'], ['SQL', 78, 'core'], ['ETL', 70, 'core', ['data pipelines', 'etl']], ['Databases', 68, 'important', ['database']], ['Data Warehousing', 62, 'important'], ['Spark', 55, 'preferred', ['apache spark']], ['Cloud', 55, 'preferred']],
    ['Analytics Engineer'],
  ),
  role('business-analyst', 'Business Analyst', 'Data Science & Analytics',
    'Translate business questions into structured analysis, requirements and actionable insights.',
    ['Analyze business problems', 'Define requirements and metrics', 'Communicate decisions with data'],
    [['SQL', 55, 'important'], ['Excel', 70, 'core', ['microsoft excel']], ['Data Analysis', 72, 'core'], ['Statistics', 50, 'important'], ['Data Visualization', 55, 'important'], ['Requirements Analysis', 68, 'core']],
    ['Business Data Analyst'],
  ),
  role('bi-analyst', 'BI Analyst', 'Data Science & Analytics',
    'Create reporting and business intelligence products that help teams understand performance.',
    ['Build dashboards', 'Model business metrics', 'Translate data into decisions'],
    [['SQL', 72, 'core'], ['Power BI', 72, 'core', ['powerbi', 'power bi']], ['Data Visualization', 68, 'core'], ['Excel', 65, 'important', ['microsoft excel']], ['Data Modeling', 62, 'important'], ['Statistics', 50, 'preferred']],
    ['Business Intelligence Analyst'],
  ),
  role('bi-developer', 'BI Developer', 'Data Science & Analytics',
    'Design reporting systems, semantic models and dashboards for business intelligence teams.',
    ['Build BI data models', 'Develop reports and dashboards', 'Maintain data refresh workflows'],
    [['SQL', 78, 'core'], ['Power BI', 75, 'core', ['powerbi', 'power bi']], ['Data Modeling', 72, 'core'], ['ETL', 62, 'important'], ['Data Warehousing', 60, 'important'], ['Python', 45, 'preferred']],
    ['Business Intelligence Developer'],
  ),
  role('product-analyst', 'Product Analyst', 'Data Science & Analytics',
    'Analyze product behavior, funnels and metrics to support product decisions.',
    ['Analyze product usage', 'Build product metrics and funnels', 'Communicate insights to product teams'],
    [['SQL', 70, 'core'], ['Data Analysis', 72, 'core'], ['Statistics', 65, 'core'], ['Data Visualization', 58, 'important'], ['Experimentation', 55, 'important'], ['Python', 48, 'preferred']],
    ['Product Data Analyst'],
  ),
  role('analytics-engineer', 'Analytics Engineer', 'Data Science & Analytics',
    'Transform raw data into trustworthy analytical models and reusable business metrics.',
    ['Build analytical models', 'Develop transformation workflows', 'Create reliable metric definitions'],
    [['SQL', 82, 'core'], ['Data Modeling', 78, 'core'], ['ETL', 68, 'core'], ['Git', 58, 'important'], ['Python', 58, 'important'], ['Data Warehousing', 65, 'important']],
    ['Analytics Developer'],
  ),
  role('quantitative-analyst', 'Quantitative Analyst', 'Data Science & Analytics',
    'Apply mathematics, statistics and programming to financial or operational problems.',
    ['Build quantitative models', 'Analyze time series and structured data', 'Validate analytical assumptions'],
    [['Python', 75, 'core'], ['Statistics', 82, 'core'], ['Probability', 75, 'core'], ['Linear Algebra', 65, 'important'], ['SQL', 55, 'important'], ['Data Analysis', 70, 'important']],
    ['Quant Analyst'],
  ),
  role('data-visualization-specialist', 'Data Visualization Specialist', 'Data Science & Analytics',
    'Turn complex datasets into clear visual stories, dashboards and analytical experiences.',
    ['Design analytical visualizations', 'Build interactive dashboards', 'Improve clarity of data communication'],
    [['Data Visualization', 82, 'core'], ['SQL', 58, 'important'], ['Statistics', 55, 'important'], ['BI Tools', 68, 'important', ['power bi', 'tableau']], ['Python', 50, 'preferred'], ['Data Analysis', 60, 'important']],
    ['Data Visualization Analyst'],
  ),

  // AI & MACHINE LEARNING — 10 curated roles
  role('machine-learning-engineer', 'Machine Learning Engineer', 'AI & Machine Learning',
    'Build, evaluate and productionize machine-learning systems from data to deployment.',
    ['Prepare data and train models', 'Evaluate model quality', 'Deploy and monitor ML systems'],
    [['Python', 82, 'core'], ['Machine Learning', 78, 'core'], ['Statistics', 68, 'important'], ['Pandas', 62, 'important'], ['Scikit-learn', 65, 'important', ['sklearn']], ['PyTorch', 55, 'preferred'], ['MLOps', 52, 'preferred']],
    ['ML Engineer'],
  ),
  role('ai-engineer', 'AI Engineer', 'AI & Machine Learning',
    'Build AI-powered applications by combining machine learning, APIs and production software.',
    ['Integrate AI capabilities into products', 'Build model-backed services', 'Evaluate and improve AI features'],
    [['Python', 78, 'core'], ['Machine Learning', 70, 'core'], ['APIs', 65, 'core', ['rest api']], ['LLM Integration', 65, 'important', ['llms', 'large language models']], ['Git', 58, 'important'], ['Cloud', 52, 'preferred'], ['Testing', 48, 'preferred']],
    ['Applied AI Engineer'],
  ),
  role('deep-learning-engineer', 'Deep Learning Engineer', 'AI & Machine Learning',
    'Develop neural-network systems for language, vision, recommendation and other AI tasks.',
    ['Train deep-learning models', 'Prepare datasets and experiments', 'Evaluate and optimize model performance'],
    [['Python', 82, 'core'], ['Deep Learning', 80, 'core'], ['PyTorch', 72, 'core'], ['TensorFlow', 58, 'important'], ['Statistics', 62, 'important'], ['Linear Algebra', 68, 'important']],
    ['Deep Learning Developer'],
  ),
  role('nlp-engineer', 'NLP Engineer', 'AI & Machine Learning',
    'Build systems that process and understand human language using NLP and machine learning.',
    ['Prepare language datasets', 'Build NLP models and pipelines', 'Evaluate language-system quality'],
    [['Python', 80, 'core'], ['NLP', 80, 'core', ['natural language processing']], ['Machine Learning', 70, 'important'], ['Transformers', 68, 'important'], ['PyTorch', 58, 'preferred'], ['Statistics', 58, 'important']],
    ['Natural Language Processing Engineer'],
  ),
  role('computer-vision-engineer', 'Computer Vision Engineer', 'AI & Machine Learning',
    'Build vision systems for image understanding, detection, segmentation and related tasks.',
    ['Prepare image datasets', 'Train vision models', 'Evaluate inference quality'],
    [['Python', 80, 'core'], ['Computer Vision', 82, 'core', ['cv']], ['Deep Learning', 74, 'core'], ['OpenCV', 68, 'important'], ['PyTorch', 62, 'important'], ['Statistics', 55, 'preferred']],
    ['Computer Vision Developer'],
  ),
  role('generative-ai-engineer', 'Generative AI Engineer', 'AI & Machine Learning',
    'Build applications and workflows around large language models and generative AI systems.',
    ['Integrate foundation models', 'Design prompting and evaluation workflows', 'Build reliable AI application features'],
    [['Python', 75, 'core'], ['LLM Integration', 82, 'core', ['llms', 'large language models']], ['Prompt Engineering', 72, 'important'], ['APIs', 65, 'important', ['rest api']], ['Machine Learning', 60, 'important'], ['Vector Databases', 55, 'preferred', ['vector db']], ['Evaluation', 55, 'preferred']],
    ['GenAI Engineer', 'Generative AI Developer'],
  ),
  role('applied-ai-engineer', 'Applied AI Engineer', 'AI & Machine Learning',
    'Apply AI methods to real product problems with a strong focus on useful, deployable systems.',
    ['Translate AI capabilities into product features', 'Evaluate models in application context', 'Ship AI-backed experiences'],
    [['Python', 75, 'core'], ['Machine Learning', 65, 'core'], ['LLM Integration', 62, 'important', ['llms']], ['APIs', 65, 'core', ['rest api']], ['Data Analysis', 55, 'important'], ['Cloud', 52, 'preferred']],
    ['Applied Machine Learning Engineer'],
  ),
  role('research-engineer', 'Research Engineer', 'AI & Machine Learning',
    'Implement and experiment with technical methods that turn research ideas into working systems.',
    ['Implement research ideas', 'Run experiments and evaluations', 'Build reproducible research tooling'],
    [['Python', 85, 'core'], ['Machine Learning', 78, 'core'], ['Statistics', 68, 'important'], ['PyTorch', 65, 'important'], ['Research', 75, 'core'], ['Linux', 55, 'preferred']],
    ['Research Software Engineer'],
  ),
  role('ml-platform-engineer', 'ML Platform Engineer', 'AI & Machine Learning',
    'Build the infrastructure, tooling and workflows that support machine-learning development at scale.',
    ['Build ML tooling and infrastructure', 'Automate training and deployment', 'Improve reliability of ML workflows'],
    [['Python', 75, 'core'], ['MLOps', 80, 'core'], ['Docker', 68, 'important'], ['Kubernetes', 60, 'important'], ['Cloud', 65, 'important'], ['CI/CD', 60, 'important'], ['Machine Learning', 58, 'preferred']],
    ['MLOps Engineer'],
  ),
  role('ai-solutions-engineer', 'AI Solutions Engineer', 'AI & Machine Learning',
    'Design practical AI solutions that connect business requirements, data and deployed AI capabilities.',
    ['Translate use cases into AI systems', 'Integrate models and APIs', 'Support reliable deployment and adoption'],
    [['AI', 70, 'core'], ['APIs', 68, 'core', ['rest api']], ['Python', 68, 'important'], ['LLM Integration', 60, 'important', ['llms']], ['Cloud', 55, 'preferred'], ['System Design', 55, 'preferred']],
    ['AI Solutions Developer'],
  ),

  // CLOUD & DEVOPS — 10 curated roles
  role('devops-engineer', 'DevOps Engineer', 'Cloud & DevOps',
    'Automate delivery, infrastructure and operational workflows for reliable software systems.',
    ['Automate CI/CD workflows', 'Manage infrastructure and environments', 'Improve delivery reliability'],
    [['Linux', 70, 'core'], ['CI/CD', 78, 'core'], ['Docker', 72, 'core'], ['Cloud', 68, 'important'], ['Git', 65, 'important'], ['Kubernetes', 58, 'important'], ['Infrastructure as Code', 55, 'preferred', ['terraform', 'iac']]],
    ['DevOps Engineer'],
  ),
  role('cloud-engineer', 'Cloud Engineer', 'Cloud & DevOps',
    'Design, deploy and operate cloud infrastructure and services for application teams.',
    ['Provision cloud infrastructure', 'Automate environments', 'Maintain cloud reliability and security'],
    [['Cloud', 80, 'core'], ['Linux', 70, 'core'], ['Networking', 60, 'important'], ['Docker', 62, 'important'], ['Infrastructure as Code', 60, 'important', ['terraform', 'iac']], ['Git', 58, 'important']],
    ['Cloud Developer'],
  ),
  role('site-reliability-engineer', 'Site Reliability Engineer', 'Cloud & DevOps',
    'Improve the reliability, performance and operational resilience of production systems.',
    ['Monitor and operate services', 'Automate operational work', 'Improve reliability and incident response'],
    [['Linux', 75, 'core'], ['Cloud', 72, 'core'], ['Monitoring', 68, 'important', ['observability']], ['Kubernetes', 65, 'important'], ['Docker', 62, 'important'], ['CI/CD', 60, 'important'], ['Networking', 58, 'preferred']],
    ['SRE'],
  ),
  role('platform-engineer', 'Platform Engineer', 'Cloud & DevOps',
    'Build internal platforms and developer tooling that make software delivery easier and safer.',
    ['Build developer platforms', 'Automate deployment workflows', 'Provide reusable infrastructure services'],
    [['Cloud', 72, 'core'], ['Kubernetes', 70, 'core'], ['Docker', 72, 'core'], ['CI/CD', 68, 'important'], ['Infrastructure as Code', 62, 'important', ['terraform', 'iac']], ['Git', 62, 'important'], ['Linux', 65, 'core']],
    ['Internal Platform Engineer'],
  ),
  role('cloud-devops-engineer', 'Cloud DevOps Engineer', 'Cloud & DevOps',
    'Combine cloud infrastructure and delivery automation to support scalable application systems.',
    ['Design cloud environments', 'Automate application delivery', 'Operate production infrastructure'],
    [['Cloud', 78, 'core'], ['Docker', 72, 'core'], ['CI/CD', 72, 'core'], ['Linux', 68, 'important'], ['Kubernetes', 58, 'important'], ['Git', 62, 'important']],
    ['Cloud DevOps Developer'],
  ),
  role('infrastructure-engineer', 'Infrastructure Engineer', 'Cloud & DevOps',
    'Build and maintain infrastructure systems, automation and operational foundations.',
    ['Manage infrastructure', 'Automate system administration', 'Maintain reliable environments'],
    [['Linux', 80, 'core'], ['Networking', 68, 'core'], ['Cloud', 62, 'important'], ['Infrastructure as Code', 62, 'important', ['terraform', 'iac']], ['Docker', 52, 'preferred'], ['Monitoring', 55, 'important', ['observability']]],
    ['Infrastructure Developer'],
  ),
  role('kubernetes-engineer', 'Kubernetes Engineer', 'Cloud & DevOps',
    'Operate container orchestration environments and production workloads on Kubernetes.',
    ['Deploy workloads to Kubernetes', 'Manage clusters and configurations', 'Improve container reliability and operations'],
    [['Kubernetes', 85, 'core'], ['Docker', 78, 'core'], ['Linux', 75, 'core'], ['Cloud', 68, 'important'], ['Networking', 62, 'important'], ['CI/CD', 58, 'important']],
    ['K8s Engineer'],
  ),
  role('cloud-security-engineer', 'Cloud Security Engineer', 'Cloud & DevOps',
    'Secure cloud infrastructure, identities, workloads and operational environments.',
    ['Secure cloud infrastructure', 'Manage identity and access controls', 'Improve security monitoring and posture'],
    [['Cloud', 75, 'core'], ['Security', 78, 'core'], ['Networking', 68, 'important'], ['Linux', 65, 'important'], ['IAM', 70, 'core', ['identity access management']], ['Monitoring', 58, 'preferred', ['observability']]],
    ['Cloud Security Developer'],
  ),
  role('release-engineer', 'Release Engineer', 'Cloud & DevOps',
    'Coordinate automated software delivery, release processes and deployment quality.',
    ['Build release pipelines', 'Automate deployment workflows', 'Improve release reliability'],
    [['CI/CD', 82, 'core'], ['Git', 72, 'core'], ['Docker', 58, 'important'], ['Testing', 60, 'important'], ['Cloud', 55, 'important'], ['Linux', 62, 'preferred']],
    ['Release Developer'],
  ),
  role('automation-engineer', 'Automation Engineer', 'Cloud & DevOps',
    'Automate repetitive engineering and operational workflows with reliable tooling.',
    ['Automate engineering workflows', 'Build reusable scripts and tooling', 'Improve operational efficiency'],
    [['Python', 68, 'important'], ['Scripting', 72, 'core'], ['CI/CD', 65, 'important'], ['Linux', 65, 'important'], ['Git', 62, 'core'], ['Testing', 55, 'preferred']],
    ['Infrastructure Automation Engineer'],
  ),
];

export interface UserSkillSignal {
  name: string;
  normalizedName?: string;
  score: number;
  level?: string | null;
}

export interface EvaluatedRoleSkill extends RoleSkillDefinition {
  userScore: number | null;
  state: 'matched' | 'developing' | 'gap';
}

export interface EvaluatedJobProfile extends Omit<CuratedJobProfile, 'skills'> {
  skills: EvaluatedRoleSkill[];
  alignment: number;
  alignmentLabel: 'Strong direction' | 'Good direction' | 'Explore direction';
  matchedSkills: EvaluatedRoleSkill[];
  developingSkills: EvaluatedRoleSkill[];
  gapSkills: EvaluatedRoleSkill[];
}

export function normalizeSkillName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[._/\-]+/g, ' ')
    .replace(/[^a-z0-9+#. ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function skillNameMatches(userValue: string, targetValue: string): boolean {
  if (userValue === targetValue) return true;

  // Allow descriptive variants such as “javascript programming” or “react js”
  // without turning short names into false positives (for example Java → JavaScript).
  if (userValue.startsWith(`${targetValue} `)) return true;
  if (targetValue.startsWith(`${userValue} `)) return true;
  return false;
}

function skillMatches(user: UserSkillSignal, target: RoleSkillDefinition): boolean {
  const userValues = [user.name, user.normalizedName ?? ''].map(normalizeSkillName).filter(Boolean);
  const targetValues = [target.name, ...(target.aliases ?? [])].map(normalizeSkillName).filter(Boolean);

  return userValues.some(userValue =>
    targetValues.some(targetValue => skillNameMatches(userValue, targetValue)),
  );
}

function bestUserScore(users: UserSkillSignal[], target: RoleSkillDefinition): number | null {
  const candidates = users.filter(user => skillMatches(user, target));
  if (!candidates.length) return null;
  return Math.max(...candidates.map(user => Math.max(0, Math.min(100, user.score))));
}

export function evaluateRole(profile: CuratedJobProfile, users: UserSkillSignal[]): EvaluatedJobProfile {
  const evaluatedSkills = profile.skills.map(skill => {
    const userScore = bestUserScore(users, skill);
    const state: EvaluatedRoleSkill['state'] = userScore === null || userScore < 40
      ? 'gap'
      : userScore < skill.requiredLevel
        ? 'developing'
        : 'matched';
    return { ...skill, userScore, state };
  });

  const totalWeight = profile.skills.reduce((sum, skill) => sum + skill.importance, 0) || 1;
  const weightedSignal = evaluatedSkills.reduce((sum, skill) => {
    const score = skill.userScore ?? 0;
    const evidenceFactor = Math.max(0, Math.min(1, score / Math.max(skill.requiredLevel, 1)));
    return sum + evidenceFactor * skill.importance;
  }, 0);

  const alignment = Math.round((weightedSignal / totalWeight) * 100);
  const alignmentLabel = alignment >= 70 ? 'Strong direction' : alignment >= 48 ? 'Good direction' : 'Explore direction';

  return {
    ...profile,
    skills: evaluatedSkills,
    alignment,
    alignmentLabel,
    matchedSkills: evaluatedSkills.filter(skill => skill.state === 'matched'),
    developingSkills: evaluatedSkills.filter(skill => skill.state === 'developing'),
    gapSkills: evaluatedSkills.filter(skill => skill.state === 'gap'),
  };
}

export function mergeProfiles(curated: CuratedJobProfile[], backend: CuratedJobProfile[]): CuratedJobProfile[] {
  const merged = new Map<string, CuratedJobProfile>();
  [...curated, ...backend].forEach(profile => {
    const key = normalizeSkillName(profile.slug);
    if (!merged.has(key)) merged.set(key, profile);
  });
  return [...merged.values()];
}

export const DOMAIN_OPTIONS: Array<RoleDomain | 'All domains'> = [
  'All domains',
  'Software Development',
  'Data Science & Analytics',
  'AI & Machine Learning',
  'Cloud & DevOps',
];

export type CSSVars = CSSProperties & { '--alignment'?: string };
