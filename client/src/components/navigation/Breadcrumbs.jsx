import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiChevronRight } from 'react-icons/fi';

const ROUTE_LABELS = {
  dashboard: 'Dashboard',
  passport: 'Career Passport',
  'ai-chatbot': 'CareerNest Copilot',
  'ai-job-analyzer': 'Job Analyzer',
  'job-applications': 'Job Tracker',
  'ai-roadmap': 'AI Roadmap',
  'ai-interview': 'Voice Mock Interview',
  'ai-resume': 'AI Resume ATS',
  'ai-gap': 'Skill-Gap Analysis',
  'study-pods': 'Peer Study Pods',
  'micro-internships': 'Micro-Internships',
  mentors: 'Search Mentors',
  courses: 'Courses Catalog',
  challenges: 'Coding Arena',
  'ai-quiz': 'AI Quiz Center',
  forum: 'Discussion Forum',
  certificates: 'Certificates',
  mentor: 'Mentor',
  admin: 'Admin',
  'mentors-approval': 'Verify Mentors',
  chat: 'Messages',
  profile: 'Profile Settings',
  'mentorship-room': 'Mentorship Room'
};

const DOMAIN_GROUPS = {
  'ai-job-analyzer': 'Career Intelligence',
  'ai-chatbot': 'Career Intelligence',
  'ai-resume': 'Career Intelligence',
  'ai-gap': 'Career Intelligence',
  'ai-interview': 'Career Intelligence',
  'ai-roadmap': 'Career Intelligence',
  courses: 'Learning Lab',
  challenges: 'Learning Lab',
  'ai-quiz': 'Learning Lab',
  'micro-internships': 'Learning Lab',
  forum: 'Community',
  'study-pods': 'Community',
  mentors: 'Community',
  chat: 'Community',
  'job-applications': 'Career Pipeline',
  certificates: 'Career Pipeline',
  passport: 'Overview'
};

const Breadcrumbs = ({ className = '' }) => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) return null;

  // Build breadcrumb items
  const breadcrumbItems = [];
  let currentPath = '';

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    const label = ROUTE_LABELS[segment] || segment.replace(/-/g, ' ');

    // Add domain group category if available on the first sub-item
    if (index === 0 && DOMAIN_GROUPS[segment]) {
      breadcrumbItems.push({
        label: DOMAIN_GROUPS[segment],
        isGroup: true
      });
    }

    breadcrumbItems.push({
      label,
      path: currentPath,
      isLast
    });
  });

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 overflow-x-auto py-1 ${className}`}>
      <ol className="flex items-center gap-1.5 whitespace-nowrap">
        <li>
          <Link
            to="/dashboard"
            className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Navigate to Home Dashboard"
          >
            <FiHome size={14} aria-hidden="true" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {breadcrumbItems.map((item, idx) => (
          <li key={idx} className="flex items-center gap-1.5">
            <FiChevronRight size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0" aria-hidden="true" />
            {item.isGroup ? (
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {item.label}
              </span>
            ) : item.isLast ? (
              <span className="font-bold text-slate-800 dark:text-slate-200 capitalize truncate max-w-[200px]" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors capitalize truncate max-w-[150px] p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
