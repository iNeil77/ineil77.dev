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
    label: "Scholar",
    href: "https://scholar.google.com/citations?user=QxfHNlsAAAAJ&hl=en",
    handle: "Google Scholar",
  },
  { label: "GitHub", href: "https://github.com/iNeil77", handle: "iNeil77" },
  {
    label: "HuggingFace",
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
  "I'm a PhD researcher at the {UKP Lab|https://www.informatik.tu-darmstadt.de/ukp}, **TU Darmstadt**, advised by {Iryna Gurevych|https://www.informatik.tu-darmstadt.de/ukp/ukp_home/head_ukp/index.en.jsp} and {Goran Glavaš|https://sites.google.com/view/goranglavas}. I work on the **mid- and post-training** of language models, with an emphasis on **reasoning**, **agentic coding**, and **tool use**. Lately, I have been exploring the role of **mid-training** in instilling deeper **alignment** and **world modeling** capabilities in LMs.",
  "My longer-term aim is to extend LMs' capabilities in **long-horizon operation** by improving how they reason, offload computation, and learn from environment or agent feedback. To this end, I also study **scalable supervision via verifiers** that improve models along **hard-to-verify** axes like **security and efficiency**.",
  "Previously I was an **Applied Scientist** at Amazon, and before that a dual-degree student at {IIIT Hyderabad|https://iiit.ac.in}. I've contributed to several open LM training and evaluation releases, including {StarCoder2|https://huggingface.co/blog/starcoder2} and {BigCodeBench|https://bigcode-bench.github.io}.",
];

// Location shown under the profile photo.
export const status = {
  text: "Berlin, Germany",
  emoji: "\u{1F4CD}", // 📍
};

// "Open to opportunities" callout rendered at the end of the hero bio. Set
// `show` to false to hide it. `text` uses the same {label|href} / **bold**
// mini-syntax as the bio paragraphs above.
export const opportunities = {
  show: true,
  label: "Open to opportunities",
  text:
    "I'm on the lookout for **full-time research positions** — research and applied scientist roles in language modeling, agentic coding, and post-training. If you're hiring or exploring a collaboration, let's talk!",
} as const;

export const researchThreads: ResearchThread[] = [
  {
    no: "01",
    title: "Code LMs & tool use",
    blurb:
      "Developing and evaluating capable code models and extending them for long-horizon operation — tool use and learning from environment feedback. This spans the mid-training that stretches models beyond repository-scale context, and the pre-training corpora and benchmarks that ground everyday tool use.",
    work: ["octolong", "bigcodebench", "starcoder2"],
  },
  {
    no: "02",
    title: "Verifiers & scalable supervision",
    blurb:
      "Building the scalable supervision that post-training leans on — pinning down what actually makes RLVR and code verifiers effective, and training reward models that score generations along hard-to-verify axes like security and efficiency, across languages and criteria.",
    work: ["aletheia", "themis"],
  },
  {
    no: "03",
    title: "Pre-training efficiency & grounding",
    blurb:
      "The pre-training foundation the rest builds on — getting more out of code-LM training by grounding models in code obfuscation and compiler intermediate representations, strengthening multilingual transfer, and keeping adaptation modular and parameter-efficient.",
    work: ["obscuracoder", "ircoder", "adapters"],
  },
];
