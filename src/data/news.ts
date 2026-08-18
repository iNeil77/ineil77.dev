// News / updates, newest first. `date` is ISO (YYYY-MM-DD); `text` supports the
// {label|href} inline-link mini-syntax expanded by the News component.

export interface NewsItem {
  date: string;
  text: string;
}

export const news: NewsItem[] = [
  {
    date: "2026-08-01",
    text: "{Aletheia|https://openreview.net/forum?id=3rVrBGp0mr}, on what makes RLVR for code verifiers tick, accepted at TMLR.",
  },
  {
    date: "2026-07-01",
    text: "Co-organizing the {SemEval 2026 Task on GenAI Code Detection & Attribution|https://github.com/mbzuai-nlp/SemEval-2026-Task13}.",
  },
  {
    date: "2026-04-01",
    text: "{AICD Bench|https://aclanthology.org/2026.eacl-long.325/} presented at EACL 2026 (Rabat).",
  },
  {
    date: "2025-11-01",
    text: "{Droid|https://aclanthology.org/2025.emnlp-main.1593/}, a resource suite for AI-generated code detection, presented at EMNLP 2025 (Suzhou).",
  },
  {
    date: "2025-10-01",
    text: "Started an Applied Scientist PhD internship at {Amazon (AWS)|https://aws.amazon.com/q/developer/} in Berlin, working on RL for cloud tool-calling in Amazon Q Developer.",
  },
  {
    date: "2025-04-01",
    text: "{BigCodeBench|https://openreview.net/forum?id=YrycTjllL0} (Oral) and {ObscuraCoder|https://openreview.net/forum?id=VYvxrD7aS0} (Poster) presented at ICLR 2025 (Singapore).",
  },
  {
    date: "2024-08-01",
    text: "{IRCoder|https://aclanthology.org/2024.acl-long.802/} received an Outstanding Paper Award at ACL 2024 (Bangkok).",
  },
  {
    date: "2024-02-01",
    text: "{StarCoder 2 and The Stack v2|https://huggingface.co/blog/starcoder2} released.",
  },
];
