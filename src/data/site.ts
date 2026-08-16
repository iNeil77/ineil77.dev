// Central site content. Edit here — every section reads from this file.

export interface SocialLink {
  label: string;
  href: string;
  /** short handle shown in the contact row */
  handle?: string;
}

export interface NavItem {
  id: string; // anchor target on the home page (without #)
  label: string;
  emoji: string;
}

export interface ResearchThread {
  no: string; // stable label, not a strict sequence
  title: string;
  blurb: string;
  /** publication ids (see publications.ts) that exemplify this thread */
  work: string[];
}

export const site = {
  name: "Indraneil Paul",
  /** used in <title> and meta */
  shortName: "Indraneil Paul",
  role: "PhD Researcher, Language Models & Code",
  location: "UKP Lab · TU Darmstadt",
  email: "indraneil.paul@gmail.com",
  description:
    "Indraneil Paul is a PhD researcher at the UKP Lab, TU Darmstadt, working on mid- and post-training of language models for agentic coding, tool use, and verifiable reward.",
  url: "https://ineil77.dev",
} as const;

// Order defines both the top nav and the ⌘K palette section list.
export const nav: NavItem[] = [
  { id: "about", label: "About", emoji: "\u{1F9ED}" }, // 🧭
  { id: "research", label: "Research", emoji: "\u{1F52C}" }, // 🔬
  { id: "publications", label: "Publications", emoji: "\u{1F4DA}" }, // 📚
  { id: "news", label: "News", emoji: "\u{1F4F0}" }, // 📰
  { id: "contact", label: "Contact", emoji: "\u{2709}\u{FE0F}" }, // ✉️
];

export const socials: SocialLink[] = [
  {
    label: "Google Scholar",
    href: "https://scholar.google.com/citations?user=QxfHNlsAAAAJ&hl=en",
    handle: "Scholar",
  },
  { label: "GitHub", href: "https://github.com/iNeil77", handle: "iNeil77" },
  {
    label: "Hugging Face",
    href: "https://huggingface.co/iNeil77",
    handle: "iNeil77",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/ineil77",
    handle: "in/ineil77",
  },
  { label: "X", href: "https://x.com/iNeil77", handle: "@iNeil77" },
  { label: "Email", href: "mailto:indraneil.paul@gmail.com", handle: "indraneil.paul@gmail.com" },
];

// Prose bio. Each string is a paragraph. Inline links use the {label|href}
// mini-syntax expanded by the Hero component.
export const bio: string[] = [
  "I'm a PhD researcher at the {UKP Lab|https://www.informatik.tu-darmstadt.de/ukp}, TU Darmstadt, advised by {Iryna Gurevych|https://www.informatik.tu-darmstadt.de/ukp/ukp_home/head_ukp/index.en.jsp} and {Goran Glavaš|https://sites.google.com/view/goranglavas}. I work on the mid- and post-training of language models, with an emphasis on agentic coding and tool use.",
  "My longer-term aim is to extend LMs to long-horizon operation — computer use, recursive workflows — by improving how they reason, offload computation, and learn from environment feedback. Alongside this, I study preference learning and verifiers that push code models along non-functional axes like security and efficiency, and I care about the whole pre-training stack: data curation, context-length extension, modularity, and reinforcement learning.",
  "Previously I was an Applied Scientist at Amazon, and before that a dual-degree student at {IIIT Hyderabad|https://iiit.ac.in}. I've contributed to several open code-LM releases, including {StarCoder2|https://huggingface.co/blog/starcoder2} and {BigCodeBench|https://bigcode-bench.github.io}.",
];

// Optional short status line shown under the name.
export const status = {
  text: "Applied Scientist PhD Intern at Amazon (AWS), Berlin",
  emoji: "\u{1F4CD}", // 📍
};

export const researchThreads: ResearchThread[] = [
  {
    no: "01",
    title: "Agentic coding & tool use",
    blurb:
      "Teaching code models to operate over long horizons — calling tools, offloading computation, and learning from execution and environment feedback rather than static text alone.",
    work: ["octolong", "bigcodebench", "starcoder2"],
  },
  {
    no: "02",
    title: "Verifiers & preference learning",
    blurb:
      "What actually makes RLVR and reward models work for code, and how to score generations along non-functional axes — correctness, security, efficiency — across languages and criteria.",
    work: ["aletheia", "themis"],
  },
  {
    no: "03",
    title: "Pre-training efficiency & grounding",
    blurb:
      "Getting more out of code-LM pre-training through obfuscation and intermediate-representation grounding, multilingual transfer, and modular / parameter-efficient methods.",
    work: ["obscuracoder", "ircoder", "adapters"],
  },
];
