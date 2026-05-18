import type { ContentItem } from "./types";

export const seedContent: ContentItem[] = [
  {
    id: "intro-hero",
    type: "intro",
    slug: "hero",
    title: "Premium digital products with cinematic motion and sharp execution.",
    category: "Independent creative developer",
    description:
      "Replace this hero phrase with your own positioning. Keep it direct, specific, and confident so the first screen immediately says what you do.",
    body: "",
    tags: ["Hero"],
    link: "",
    image: "",
    sort_order: 0,
    is_published: true
  },
  {
    id: "intro-feature-1",
    type: "intro",
    slug: "feature-1",
    title: "Introduce Your Specialty",
    category: "01",
    description:
      "Use this card for your strongest skill: frontend engineering, product design, automation, visual systems, or full-stack builds.",
    body: "",
    tags: ["Intro"],
    link: "",
    image: "",
    sort_order: 1,
    is_published: true
  },
  {
    id: "intro-feature-2",
    type: "intro",
    slug: "feature-2",
    title: "Describe Your Process",
    category: "02",
    description:
      "Replace this with a short phrase about how you work: fast prototypes, polished interaction, clean architecture, or measurable outcomes.",
    body: "",
    tags: ["Intro"],
    link: "",
    image: "",
    sort_order: 2,
    is_published: true
  },
  {
    id: "intro-feature-3",
    type: "intro",
    slug: "feature-3",
    title: "State Your Edge",
    category: "03",
    description:
      "Use this space for a memorable differentiator: premium motion, conversion-focused builds, AI workflows, or design-to-code execution.",
    body: "",
    tags: ["Intro"],
    link: "",
    image: "",
    sort_order: 3,
    is_published: true
  },
  {
    id: "intro-contact",
    type: "intro",
    slug: "contact",
    title: "Let's shape the next thing.",
    category: "Available for premium builds",
    description:
      "Replace this with your contact pitch, availability, booking link, or preferred way for clients to reach you.",
    body: "",
    tags: ["Contact"],
    link: "mailto:hello@example.com",
    image: "",
    sort_order: 4,
    is_published: true
  },
  {
    id: "section-capabilities",
    type: "section",
    slug: "capabilities",
    title: "Capabilities",
    category: "What I can build",
    description:
      "Replace this with a modular section for services, technical strengths, client outcomes, workflow, awards, testimonials, or anything else you want to add to the page.",
    body: "## Capabilities\nUse this long-form field for service details, proof points, testimonials, or a richer overview.\n\n- Product interfaces\n- Motion systems\n- Portfolio CMS builds\n- Fast static and full-stack deployments",
    tags: ["Strategy", "Frontend", "Motion"],
    link: "",
    image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1200&q=80",
    sort_order: 0,
    is_published: true
  },
  {
    id: "section-stack",
    type: "section",
    slug: "selected-stack",
    title: "Selected Stack",
    category: "Tools and systems",
    description:
      "Use this section to list your preferred technologies, frameworks, design tools, automation stack, or hosting setup.",
    body: "## Stack\nNext.js, Supabase, Tailwind CSS, Framer Motion, React Markdown, and Vercel give this portfolio a practical full-stack foundation.",
    tags: ["Design", "Code", "Deploy"],
    link: "",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    sort_order: 1,
    is_published: true
  },
  {
    id: "prj-aurora",
    type: "project",
    slug: "aurora-commerce",
    title: "Aurora Commerce",
    category: "Luxury storefront",
    description:
      "A high-conversion product experience with editorial storytelling, animated merchandising, and a fluid checkout path.",
    body:
      "## Overview\nAurora Commerce is a placeholder long-form project article. Replace this section with the client context, the product problem, and your role.\n\n## Approach\nUse this area to describe the design and build process in more detail. You can write multiple paragraphs and keep each idea readable.\n\n- Define the user journey\n- Build the visual system\n- Prototype motion and interaction\n- Ship a polished full-stack experience\n\n## Result\nWrite about measurable outcomes, lessons learned, or the final impact. Use **bold** for important details and *italic* for subtle emphasis.",
    tags: ["UX", "Motion", "Commerce"],
    link: "https://example.com",
    image: "https://images.unsplash.com/photo-1491897554428-130a60dd4757?auto=format&fit=crop&w=1200&q=80",
    sort_order: 0,
    is_published: true
  },
  {
    id: "prj-nova",
    type: "project",
    slug: "nova-analytics",
    title: "Nova Analytics",
    category: "SaaS dashboard",
    description:
      "A dense decision surface for operators, combining real-time metrics, glass panels, and clear hierarchy.",
    body:
      "## Overview\nNova Analytics is a placeholder article for a product dashboard case study. Replace this with the operational problem and the audience.\n\n## Execution\nExplain how you structured data, designed dense UI states, and kept repeated workflows efficient.\n\n- Information architecture\n- Dashboard component system\n- Responsive table and card states\n- Performance considerations\n\n## Outcome\nUse this section for results, screenshots, technical notes, or what you would improve next.",
    tags: ["Dashboard", "Data", "Product"],
    link: "https://example.com",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    sort_order: 1,
    is_published: true
  },
  {
    id: "prj-atelier",
    type: "project",
    slug: "atelier-identity",
    title: "Atelier Identity",
    category: "Brand system",
    description:
      "A visual system and interactive portfolio for a studio that needed subtle drama without losing clarity.",
    body:
      "## Overview\nAtelier Identity is a placeholder brand-system article. Replace this with the brief, constraints, and creative direction.\n\n## Direction\nDescribe typography, color, layout, motion, and implementation choices.\n\n- Brand positioning\n- Visual language\n- Interactive components\n- Launch-ready frontend\n\n## Reflection\nClose with what made the project work and what the viewer should notice.",
    tags: ["Brand", "Frontend", "Design"],
    link: "https://example.com",
    image: "https://images.unsplash.com/photo-1523726491678-bf852e717f6a?auto=format&fit=crop&w=1200&q=80",
    sort_order: 2,
    is_published: true
  },
  {
    id: "post-glass",
    type: "post",
    slug: "what-i-am-building-next",
    title: "Placeholder Post: What I Am Building Next",
    category: "Introductory note",
    description:
      "Replace this with a short update about your current focus, recent launch, design philosophy, or what clients can expect from you.",
    body: "## Update\nWrite a full post here. Markdown formatting is supported for headings, lists, links, and emphasis.",
    tags: ["Placeholder", "Update"],
    link: "",
    image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    sort_order: 0,
    is_published: true
  },
  {
    id: "post-motion",
    type: "post",
    slug: "how-i-approach-projects",
    title: "Placeholder Post: How I Approach Projects",
    category: "Process note",
    description:
      "Use this post to explain your process, stack, timeline, pricing approach, or the kind of collaborations you want.",
    body: "## Process\nDescribe how you work, how clients should prepare, and what your ideal project looks like.",
    tags: ["Placeholder", "Process"],
    link: "",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    sort_order: 1,
    is_published: true
  },
  {
    id: "post-case-study",
    type: "post",
    slug: "featured-case-study",
    title: "Placeholder Post: Featured Case Study",
    category: "Case study stub",
    description:
      "Turn this into a short case study teaser with the problem, your role, the solution, and the result.",
    body: "## Case Study\nUse this as a longer writeup for a result, experiment, or breakdown.",
    tags: ["Placeholder", "Case Study"],
    link: "",
    image: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80",
    sort_order: 2,
    is_published: true
  }
];
