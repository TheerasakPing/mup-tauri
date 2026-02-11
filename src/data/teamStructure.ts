/**
 * Team Structure Data
 * 
 * This file contains the complete team structure for the AI project,
 * including all 21 team members across different categories.
 */

export interface TeamMember {
  id: string;
  titleThai: string;
  titleEnglish: string;
  category: TeamCategory;
  responsibilities: string[];
  skills: string[];
  tools: string[];
  icon: string;
}

export type TeamCategory =
  | 'development'
  | 'devops'
  | 'qa-qc'
  | 'management'
  | 'design'
  | 'support';

export interface TeamCategoryInfo {
  id: TeamCategory;
  nameThai: string;
  nameEnglish: string;
  icon: string;
  count: number;
}

export const TEAM_CATEGORIES: TeamCategoryInfo[] = [
  {
    id: 'development',
    nameThai: 'ทีมพัฒนา',
    nameEnglish: 'Development Team',
    icon: '💻',
    count: 10,
  },
  {
    id: 'devops',
    nameThai: 'DevOps & DevSecOps',
    nameEnglish: 'DevOps & DevSecOps',
    icon: '🔐',
    count: 1,
  },
  {
    id: 'qa-qc',
    nameThai: 'QA & QC',
    nameEnglish: 'QA & QC',
    icon: '🧪',
    count: 3,
  },
  {
    id: 'management',
    nameThai: 'บริหารโครงการ',
    nameEnglish: 'Project Management',
    icon: '📊',
    count: 2,
  },
  {
    id: 'design',
    nameThai: 'ดีไซน์',
    nameEnglish: 'Design',
    icon: '🎨',
    count: 1,
  },
  {
    id: 'support',
    nameThai: 'ทีมสนับสนุน',
    nameEnglish: 'Support Team',
    icon: '🤝',
    count: 4,
  },
];

export const TEAM_MEMBERS: TeamMember[] = [
  // Development Team (10 members)
  {
    id: 'dev-frontend-1',
    titleThai: 'นักพัฒนา Frontend #1',
    titleEnglish: 'Frontend Developer #1',
    category: 'development',
    icon: '👨‍💻',
    responsibilities: [
      'พัฒนาอินเทอร์เฟซผู้ใช้ด้วย React และ TypeScript',
      'สร้าง component ที่ใช้งานใหม่ได้ (reusable components)',
      'ปรับปรุงประสิทธิภาพการแสดงผลและประสบการณ์ผู้ใช้',
      'ทำงานร่วมกับ UI/UX Designer',
    ],
    skills: ['React', 'TypeScript', 'JavaScript', 'HTML/CSS', 'State Management (Redux, Zustand)', 'Responsive Design'],
    tools: ['VS Code', 'React DevTools', 'Git'],
  },
  {
    id: 'dev-frontend-2',
    titleThai: 'นักพัฒนา Frontend #2',
    titleEnglish: 'Frontend Developer #2',
    category: 'development',
    icon: '👨‍💻',
    responsibilities: [
      'พัฒนาและดูแล UI Components',
      'ทดสอบหน้าเว็บเพื่อความถูกต้องของการแสดงผล',
      'ปรับปรุงความเร็วในการโหลดหน้า',
      'แก้ไขปัญหา UI ที่เกิดขึ้น',
    ],
    skills: ['React', 'TypeScript', 'Vite', 'CSS/SCSS', 'Tailwind CSS', 'Testing (Jest, React Testing Library)'],
    tools: ['Chrome DevTools', 'Figma', 'Git'],
  },
  {
    id: 'dev-backend-1',
    titleThai: 'นักพัฒนา Backend #1',
    titleEnglish: 'Backend Developer #1',
    category: 'development',
    icon: '👨‍💻',
    responsibilities: [
      'พัฒนา API และ Business Logic ด้วย Rust',
      'ออกแบบและพัฒนา Microservices',
      'ดูแลการเชื่อมต่อฐานข้อมูล',
      'ปรับปรุงประสิทธิภาพ Server',
    ],
    skills: ['Rust', 'SQL', 'REST APIs', 'Database Design', 'Authentication & Authorization'],
    tools: ['Diesel ORM', 'PostgreSQL', 'Redis', 'Postman'],
  },
  {
    id: 'dev-backend-2',
    titleThai: 'นักพัฒนา Backend #2',
    titleEnglish: 'Backend Developer #2',
    category: 'development',
    icon: '👨‍💻',
    responsibilities: [
      'พัฒนา Tauri Commands และ Backend Integration',
      'จัดการ File System และ System Operations',
      'พัฒนา Background Services',
      'ดูแลความปลอดภัยของข้อมูล',
    ],
    skills: ['Rust', 'Tauri API', 'System Programming', 'Cryptography (basic)'],
    tools: ['Cargo', 'Tauri CLI', 'Docker'],
  },
  {
    id: 'dev-fullstack-1',
    titleThai: 'นักพัฒนา Full-Stack #1',
    titleEnglish: 'Full-Stack Developer #1',
    category: 'development',
    icon: '👨‍💻',
    responsibilities: [
      'พัฒนาฟีเจอร์แบบ End-to-End',
      'เชื่อมต่อ Frontend กับ Backend',
      'ออกแบบ Architecture ของระบบ',
      'ทั้ง Code Review และ Mentoring',
    ],
    skills: ['React', 'TypeScript', 'Rust', 'Tauri', 'System Design', 'Git Workflow'],
    tools: ['VS Code', 'Docker', 'GitHub'],
  },
  {
    id: 'dev-fullstack-2',
    titleThai: 'นักพัฒนา Full-Stack #2',
    titleEnglish: 'Full-Stack Developer #2',
    category: 'development',
    icon: '👨‍💻',
    responsibilities: [
      'พัฒนาฟีเจอร์ใหม่ๆ อย่างต่อเนื่อง',
      'แก้ไขปัญหาทั้ง Frontend และ Backend',
      'เขียนเอกสาร API และการใช้งาน',
      'ทำงานร่วมกับทีมอื่นๆ',
    ],
    skills: ['React', 'TypeScript', 'Rust', 'Problem Solving', 'Communication'],
    tools: ['Git', 'Notion', 'Slack'],
  },
  {
    id: 'dev-mobile-1',
    titleThai: 'นักพัฒนา Mobile #1',
    titleEnglish: 'Mobile Developer #1',
    category: 'development',
    icon: '👨‍💻',
    responsibilities: [
      'พัฒนาความสามารถ Cross-platform ด้วย Tauri',
      'ดูแลการทำงานบน Windows/Mac/Linux',
      'ปรับแต่ง Native Integrations',
      'ทดสอบบนอุปกรณ์หลากหลายแพลตฟอร์ม',
    ],
    skills: ['Tauri', 'Rust', 'React', 'Desktop Development', 'Platform-specific APIs'],
    tools: ['Tauri CLI', 'Platform VMs', 'GitHub Actions'],
  },
  {
    id: 'dev-ai-1',
    titleThai: 'วิศวกร AI/ML #1',
    titleEnglish: 'AI/ML Engineer #1',
    category: 'development',
    icon: '🤖',
    responsibilities: [
      'พัฒนาและปรับปรุง AI Models',
      'สร้าง Machine Learning Pipelines',
      'เชื่อมต่อ AI Services กับแอปพลิเคชัน',
      'วิเคราะห์และปรับปรุง Model Performance',
    ],
    skills: ['Python', 'TensorFlow/PyTorch', 'NLP', 'Computer Vision', 'API Integration'],
    tools: ['Jupyter', 'Weights & Biases', 'MLflow'],
  },
  {
    id: 'dev-ai-2',
    titleThai: 'วิศวกร AI/ML #2',
    titleEnglish: 'AI/ML Engineer #2',
    category: 'development',
    icon: '🤖',
    responsibilities: [
      'วิจัยและทดลอง AI Algorithms ใหม่',
      'ปรับแต่ง Models สำหรับ Production',
      'ดูแล Model Training และ Deployment',
      'สร้างเอกสารเทคนิค AI',
    ],
    skills: ['Python', 'Deep Learning', 'MLOps', 'Model Optimization', 'Research & Development'],
    tools: ['Google Colab', 'Docker', 'Kubernetes'],
  },

  // DevOps (1 member)
  {
    id: 'devops-1',
    titleThai: 'วิศวกร DevSecOps',
    titleEnglish: 'DevSecOps Engineer',
    category: 'devops',
    icon: '🔐',
    responsibilities: [
      'จัดการ CI/CD Pipelines',
      'ดูแล Infrastructure as Code',
      'ดูแลความปลอดภัยของระบบ',
      'ปรับปรุงประสิทธิภาพและความน่าเชื่อถือ',
      'ทำ Security Audits และ Penetration Testing',
    ],
    skills: ['DevOps', 'Security', 'Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Monitoring'],
    tools: ['GitHub Actions', 'Docker', 'Kubernetes', 'Prometheus'],
  },

  // QA & QC (3 members)
  {
    id: 'qa-manual-1',
    titleThai: 'นักทดสอบฟังก์ชัน',
    titleEnglish: 'Manual QA',
    category: 'qa-qc',
    icon: '🧪',
    responsibilities: [
      'ทดสอบแอปพลิเคชันด้วยมือ',
      'สร้าง Test Cases และ Test Plans',
      'รายงาน Bugs และติดตามการแก้ไข',
      'ทดสอบ User Experience',
    ],
    skills: ['Manual Testing', 'Test Design', 'Bug Tracking', 'User Perspective'],
    tools: ['Jira', 'TestRail', 'BrowserStack'],
  },
  {
    id: 'qa-auto-1',
    titleThai: 'นักทดสอบอัตโนมัติ',
    titleEnglish: 'Automation QA',
    category: 'qa-qc',
    icon: '🤖',
    responsibilities: [
      'พัฒนา Automated Test Scripts',
      'ดูแล Test Automation Framework',
      'เชื่อมต่อ Tests กับ CI/CD',
      'วิเคราะห์ Coverage Reports',
    ],
    skills: ['Test Automation', 'Selenium/Playwright', 'TypeScript', 'JavaScript', 'CI/CD Integration'],
    tools: ['Playwright', 'Jest', 'GitHub Actions'],
  },
  {
    id: 'qc-1',
    titleThai: 'ผู้ควบคุมคุณภาพ',
    titleEnglish: 'Quality Control',
    category: 'qa-qc',
    icon: '✅',
    responsibilities: [
      'ตรวจสอบคุณภาพก่อน Release',
      'อนุมัติ Releases',
      'วิเคราะห์ Quality Metrics',
      'ปรับปรุง Quality Processes',
    ],
    skills: ['Quality Assurance', 'Process Improvement', 'Metrics Analysis', 'Risk Assessment'],
    tools: ['SonarQube', 'Jira', 'Excel/Sheets'],
  },

  // Project Management (2 m
