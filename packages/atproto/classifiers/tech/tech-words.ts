import type { ClassifierFn } from "../types";

const keywords = [
  "Algorithm",
  "API (Application Programming Interface)",
  "Runtime",
  "Syntax",
  "Debugger",
  "Compiler",
  "Encryption",
  "Hash",
  "Protocol",
  "Thread",
  "Latency",
  "Namespace",
  "Recursion",
  "Garbage Collection",
  "Immutable",
  "Cryptography",
  "Containerization",
  "Virtualization",
  "Semaphore",
  "Bytecode",
  "Framework",
  "Library",
  "Dependency",
  "Callback",
  "Event Loop",
  "Concurrency",
  "Asynchronous",
  "Middleware",
  "Transaction",
  "Load Balancer",
  "Data Structure",
  "Big-O Notation",
  "Machine Learning",
  "Artificial Intelligence",
  "Neural Network",
  "Cloud Computing",
  "Microservices",
  "Database",
  "ORM (Object-Relational Mapping)",
  "Repository",
  "Branch",
  "Commit",
  "Merge",
  "Pull Request",
  "Build Pipeline",
  "DevOps",
  "Continuous Integration",
  "Continuous Deployment",
  "Docker",
  "Kubernetes",
  "Authentication",
  "Authorization",
  "refactor",
  "graphql",
  "atproto",
  "php",
  "typescript",
  "in code",
  "engineering team",
  "tree shaking",
  "technical debt",
  "syntax tree",
];
const escapeRegex = (str: string) =>
  str.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
const regex = new RegExp(
  `\\b(?:${keywords.map(escapeRegex).join("|")})\\b`,
  "i"
);

const matcher = new RegExp(
  /\b(typescript|php|c#|refactor|graphql|atproto|in\ code|engineering\ team|tree\ shakable|ISO\ 8601)|algorithms|algorithm|encryption\b/i
);

/** Very simple with whitelisted words. Will be replaced later.  */
export const techWordsRegExp: ClassifierFn = async ({ ctx, post }) => {
  let score = null;
  if (regex.test(post.record.text)) {
    return { score: 85, tag: "tech" };
  }
  return {
    score: null,
    tag: "tech",
  };
};
