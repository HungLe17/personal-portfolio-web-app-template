import Link from "next/link";
import { CardGrid } from "@/components/card-grid";
import { Reveal } from "@/components/reveal";
import { StackShowcase } from "@/components/stack-showcase";
import { getContentItems, findIntro } from "@/lib/content";

export default async function HomePage() {
  const allItems = await getContentItems();
  const sections = allItems.filter((item) => item.type === "section").sort((a, b) => a.sort_order - b.sort_order);
  const projects = allItems.filter((item) => item.type === "project").sort((a, b) => a.sort_order - b.sort_order);
  const posts = allItems.filter((item) => item.type === "post").sort((a, b) => a.sort_order - b.sort_order);

  const hero = findIntro(allItems, "hero");
  const contact = findIntro(allItems, "contact");
  const features = allItems.filter((item) => item.type === "intro" && item.slug.startsWith("feature"));

  return (
    <main id="top">
      <section className="hero section-shell">
        <Reveal className="hero-copy">
          <p className="eyebrow">{hero?.category || "Independent creative developer"}</p>
          <h1>{hero?.title || "Premium digital products with cinematic motion and sharp execution."}</h1>
          <p className="hero-text">{hero?.description}</p>
          <div className="hero-actions">
            <Link className="liquid-button primary" href="#work">
              View Projects
            </Link>
            <Link className="liquid-button secondary" href="#contact">
              Start a Project
            </Link>
          </div>
        </Reveal>

        <Reveal className="hero-orbit glass-panel" dataGlassDisabled>
          <StackShowcase />
        </Reveal>
      </section>

      <section className="section-shell intro-grid">
        {features.map((feature) => (
          <Reveal as="article" className="glass-panel feature-panel" key={feature.id}>
            <span className="panel-index">{feature.category}</span>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </Reveal>
        ))}
      </section>

      <CardGrid items={sections} variant="section-card" className="modular-sections" />

      <section className="section-shell split-heading" id="work">
        <Reveal>
          <p className="eyebrow">Selected work</p>
          <h2>Project Showcase</h2>
        </Reveal>
        <Reveal as="p">Projects are now real database-backed content with dynamic pages and long article bodies.</Reveal>
      </section>
      <CardGrid items={projects} variant="showcase-card" className="showcase-grid" />

      <section className="section-shell split-heading" id="posts">
        <Reveal>
          <p className="eyebrow">Thinking</p>
          <h2>Posts & Notes</h2>
        </Reveal>
        <Reveal as="p">Write updates, case-study notes, experiments, and process articles in Markdown.</Reveal>
      </section>
      <CardGrid items={posts} variant="post-card" className="posts-grid" />

      <section className="section-shell contact-section" id="contact">
        <Reveal className="glass-panel contact-card">
          <p className="eyebrow">{contact?.category || "Available for premium builds"}</p>
          <h2>{contact?.title || "Let's shape the next thing."}</h2>
          <p>{contact?.description}</p>
          <a className="liquid-button primary" href={contact?.link || "mailto:hello@example.com"}>
            {(contact?.link || "hello@example.com").replace(/^mailto:/, "")}
          </a>
        </Reveal>
      </section>
    </main>
  );
}
