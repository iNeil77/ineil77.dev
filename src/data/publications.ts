// Publications, newest first. Mirrors the "Selected Publications" section of the
// LaTeX CV. Author names containing "Indraneil Paul" are auto-bolded on render.

export type LinkKind =
  | "abstract"
  | "pdf"
  | "slides"
  | "code"
  | "demo"
  | "project";

export interface PubLink {
  kind: LinkKind;
  href: string;
}

export interface Publication {
  id: string;
  title: string;
  authors: string;
  venue: string;
  year: number;
  /** e.g. "Oral", "Poster", "Under Review" */
  status?: string;
  /** e.g. "Outstanding Paper" */
  award?: string;
  /** category tags — drive the filter chips */
  tags: string[];
  featured?: boolean;
  links: PubLink[];
}

// Category tags used by the filter chips (order matters for chip display).
export const pubCategories = [
  "Code LMs",
  "Pre-training",
  "Verifiers & RL",
  "Benchmarks",
  "Detection",
  "Multilingual",
] as const;

export const publications: Publication[] = [
  {
    id: "octolong",
    title:
      "OctoLong: Mid-Training on Cross-Repository Code Contexts Enhances Long-Context Modeling",
    authors: "Indraneil Paul et al.",
    venue: "NAACL",
    year: 2027,
    status: "Under Review",
    tags: ["Code LMs", "Pre-training"],
    featured: true,
    links: [
      { kind: "abstract", href: "https://arxiv.org/abs/2608.05141" },
      { kind: "pdf", href: "https://arxiv.org/pdf/2608.05141" },
    ],
  },
  {
    id: "themis",
    title:
      "Themis: Training Robust Multilingual Code Reward Models for Flexible Multi-Criteria Scoring",
    authors: "Indraneil Paul et al.",
    venue: "TMLR",
    year: 2026,
    status: "Under Review",
    tags: ["Verifiers & RL", "Code LMs", "Multilingual"],
    links: [
      { kind: "abstract", href: "https://openreview.net/forum?id=S2zGSvsZV2" },
      { kind: "pdf", href: "https://arxiv.org/pdf/2605.00754" },
    ],
  },
  {
    id: "aletheia",
    title: "Aletheia: What Makes RLVR for Code Verifiers Tick?",
    authors: "Vatsal Venkatkrishna et al. (incl. Indraneil Paul)",
    venue: "TMLR",
    year: 2026,
    tags: ["Verifiers & RL", "Code LMs"],
    featured: true,
    links: [
      { kind: "abstract", href: "https://openreview.net/forum?id=3rVrBGp0mr" },
      { kind: "pdf", href: "https://openreview.net/pdf?id=3rVrBGp0mr" },
    ],
  },
  {
    id: "aicd-bench",
    title: "AICD Bench: A Challenging Benchmark for AI-Generated Code Detection",
    authors: "Daniil Orel et al. (incl. Indraneil Paul)",
    venue: "EACL, Rabat",
    year: 2026,
    tags: ["Detection", "Benchmarks"],
    links: [
      {
        kind: "slides",
        href: "https://drive.google.com/file/d/1GE89IfIask3b_KajYuBEMkr8AbJTj-QE/view?usp=sharing",
      },
      { kind: "abstract", href: "https://aclanthology.org/2026.eacl-long.325/" },
      { kind: "pdf", href: "https://aclanthology.org/2026.eacl-long.325.pdf" },
    ],
  },
  {
    id: "droid",
    title: "Droid: A Resource Suite for AI-Generated Code Detection",
    authors: "Daniil Orel et al. (incl. Indraneil Paul)",
    venue: "EMNLP, Suzhou",
    year: 2025,
    tags: ["Detection", "Benchmarks"],
    links: [
      {
        kind: "slides",
        href: "https://docs.google.com/presentation/d/1o3pMAy7z1JsVF_xM-sLnVTrA5fHyJqbs/edit?usp=sharing",
      },
      {
        kind: "abstract",
        href: "https://aclanthology.org/2025.emnlp-main.1593/",
      },
      { kind: "pdf", href: "https://aclanthology.org/2025.emnlp-main.1593.pdf" },
    ],
  },
  {
    id: "obscuracoder",
    title:
      "ObscuraCoder: Powering Efficient Code LM Pre-Training via Obfuscation Grounding",
    authors: "Indraneil Paul et al.",
    venue: "ICLR, Singapore",
    year: 2025,
    status: "Poster",
    tags: ["Pre-training", "Code LMs"],
    featured: true,
    links: [
      {
        kind: "slides",
        href: "https://drive.google.com/file/d/1PY5Ompo8TmM1UrY6kgNj6BSK2l_Kex3E/view?usp=sharing",
      },
      { kind: "abstract", href: "https://openreview.net/forum?id=VYvxrD7aS0" },
      { kind: "pdf", href: "https://openreview.net/pdf?id=VYvxrD7aS0" },
    ],
  },
  {
    id: "bigcodebench",
    title:
      "BigCodeBench: Benchmarking Code Generation with Diverse Function Calls and Complex Instructions",
    authors: "Terry Yue Zhuo et al. (incl. Indraneil Paul)",
    venue: "ICLR, Singapore",
    year: 2025,
    status: "Oral",
    tags: ["Benchmarks", "Code LMs"],
    featured: true,
    links: [
      { kind: "abstract", href: "https://openreview.net/forum?id=YrycTjllL0" },
      { kind: "pdf", href: "https://openreview.net/pdf?id=YrycTjllL0" },
      { kind: "project", href: "https://bigcode-bench.github.io" },
    ],
  },
  {
    id: "ircoder",
    title:
      "IRCoder: Intermediate Representations Make Language Models Robust Multilingual Code Generators",
    authors: "Indraneil Paul et al.",
    venue: "ACL, Bangkok",
    year: 2024,
    status: "Oral",
    award: "Outstanding Paper",
    tags: ["Code LMs", "Multilingual", "Pre-training"],
    featured: true,
    links: [
      {
        kind: "slides",
        href: "https://docs.google.com/presentation/d/1bqFR2KNRkt-yLVxW-_qZ69lOJkyGFrOFiAMebECjLoA/edit?usp=sharing",
      },
      { kind: "abstract", href: "https://aclanthology.org/2024.acl-long.802/" },
      { kind: "pdf", href: "https://aclanthology.org/2024.acl-long.802.pdf" },
    ],
  },
  {
    id: "starcoder2",
    title: "StarCoder 2 and The Stack v2: The Next Generation",
    authors: "Anton Lozhkov et al. (incl. Indraneil Paul)",
    venue: "TMLR",
    year: 2024,
    tags: ["Pre-training", "Code LMs"],
    featured: true,
    links: [
      {
        kind: "slides",
        href: "https://docs.google.com/presentation/d/1eNhmoigkU9W9KzIedjsDLF_j04UAsRty",
      },
      { kind: "abstract", href: "https://arxiv.org/abs/2402.19173" },
      { kind: "pdf", href: "https://arxiv.org/pdf/2402.19173" },
    ],
  },
  {
    id: "adapters",
    title:
      "Adapters: A Unified Library for Parameter-Efficient and Modular Transfer Learning",
    authors: "Clifton Poth et al. (incl. Indraneil Paul)",
    venue: "EMNLP System Demonstrations, Singapore",
    year: 2023,
    tags: ["Multilingual"],
    links: [
      { kind: "demo", href: "https://adapterhub.ml/emnlp2023/" },
      { kind: "abstract", href: "https://aclanthology.org/2023.emnlp-demo.13/" },
      { kind: "pdf", href: "https://aclanthology.org/2023.emnlp-demo.13.pdf" },
    ],
  },
  {
    id: "subtask-imputation",
    title:
      "Sub-Task Imputation via Self-Labelling to Train Image Moderation Models on Sparse Noisy Data",
    authors: "Indraneil Paul et al.",
    venue: "CIKM, Atlanta",
    year: 2022,
    status: "Oral",
    tags: ["Benchmarks"],
    links: [
      {
        kind: "slides",
        href: "https://docs.google.com/presentation/d/1ysGl83C2PD7yF3VS6rfQgfQtbP09w_TnUECCOzjt0vM/edit?usp=sharing",
      },
      { kind: "abstract", href: "https://dl.acm.org/doi/10.1145/3511808.3557149" },
      {
        kind: "pdf",
        href: "https://assets.amazon.science/2c/ba/251424454e88a8d88c8c5546cdf7/sub-task-imputation-via-self-labelling-to-train-image-moderation-models-on-sparse-noisy-data.pdf",
      },
    ],
  },
];
