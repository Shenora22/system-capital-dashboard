import Image from "next/image";
import "./brand-kit.css";

const palette = [
  { name: "Matte Black", hex: "#0a0c10", use: "Primary canvas, depth, luxury SaaS foundation" },
  { name: "AI Blue", hex: "#4f8ef7", use: "Primary actions, signal states, intelligence glow" },
  { name: "Neon Purple", hex: "#8B5CF6", use: "Accent, Alora moments, premium gradients" },
  { name: "Soft White", hex: "#f8fafc", use: "Headlines, high-contrast UI, editorial space" },
];

const assetGallery = [
  { title: "System Capital mark", type: "Generated fallback logo", src: "/brand-kit/assets/system-capital-mark.svg" },
  { title: "Alora assistant orb", type: "Generated fallback icon", src: "/brand-kit/assets/alora-orb.svg" },
  { title: "Carousel slide 01", type: "Existing System Capital asset", src: "/brand-kit/assets/slide-01.svg" },
  { title: "Carousel slide 02", type: "Existing System Capital asset", src: "/brand-kit/assets/slide-02.svg" },
  { title: "Carousel slide 03", type: "Existing System Capital asset", src: "/brand-kit/assets/slide-03.svg" },
  { title: "Carousel slide 04", type: "Existing System Capital asset", src: "/brand-kit/assets/slide-04.svg" },
  { title: "Carousel slide 05", type: "Existing System Capital asset", src: "/brand-kit/assets/slide-05.svg" },
];

const voice = ["Precise", "Calm", "Decisive", "Elite", "Operational", "Human-centered"];
const components = ["Command cards", "Automation panels", "Signal badges", "Agent status chips"];

export default function BrandKitPage() {
  return (
    <main className="brand-board">
      <section className="board-hero panel glow-panel">
        <div className="hero-copy">
          <p className="eyebrow">System Capital // Alora brand system</p>
          <h1>Premium AI infrastructure for operators who expect leverage.</h1>
          <p className="hero-text">
            A futuristic one-page brand board for System Capital and Alora: dark, precise,
            high-trust, and built for a billion-dollar automation company.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#palette">View system</a>
            <a className="btn btn-ghost" href="#assets">Asset gallery</a>
          </div>
        </div>
        <div className="logo-stage" aria-label="System Capital and Alora logo lockup">
          <Image src="/brand-kit/assets/system-capital-mark.svg" alt="System Capital geometric mark" width={260} height={260} priority />
          <div>
            <span>System Capital</span>
            <strong>Alora</strong>
            <small>Autonomous intelligence assistant</small>
          </div>
        </div>
      </section>

      <section className="section-grid two-columns">
        <div className="panel logo-panel">
          <p className="section-kicker">01 / Logo</p>
          <h2>Logo system</h2>
          <div className="logo-row">
            <div className="logo-tile"><Image src="/brand-kit/assets/system-capital-mark.svg" alt="System Capital mark" width={150} height={150} /></div>
            <div className="logo-tile"><Image src="/brand-kit/assets/alora-orb.svg" alt="Alora orb icon" width={150} height={150} /></div>
          </div>
          <p className="muted">
            The requested “System Capital Branding” folder was not present in this workspace, so the board uses existing System Capital carousel assets plus elegant generated placeholders.
          </p>
        </div>

        <div className="panel" id="palette">
          <p className="section-kicker">02 / Color</p>
          <h2>Color palette</h2>
          <div className="swatches">
            {palette.map((color) => (
              <article className="swatch" key={color.hex}>
                <div className="swatch-fill" style={{ background: color.hex }} />
                <div>
                  <strong>{color.name}</strong>
                  <code>{color.hex}</code>
                  <span>{color.use}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-grid three-columns">
        <div className="panel typography-card">
          <p className="section-kicker">03 / Typography</p>
          <h2>Font pairing</h2>
          <div className="type-sample display">Geist Sans</div>
          <div className="type-sample mono">Geist Mono</div>
          <p className="muted">Use Geist Sans for product clarity and Geist Mono for signal labels, IDs, automation logs, and agent telemetry.</p>
        </div>
        <div className="panel voice-card">
          <p className="section-kicker">04 / Voice</p>
          <h2>Brand voice</h2>
          <div className="tag-cloud">
            {voice.map((item) => <span key={item}>{item}</span>)}
          </div>
          <p className="quote">“Alora does not overwhelm. She reduces ambiguity into action.”</p>
        </div>
        <div className="panel buttons-card">
          <p className="section-kicker">09 / Buttons</p>
          <h2>Button styles</h2>
          <button className="btn btn-primary">Deploy agent</button>
          <button className="btn btn-secondary">Review signal</button>
          <button className="btn btn-ghost">Open console</button>
        </div>
      </section>

      <section className="panel website-mockup">
        <p className="section-kicker">05 / Website hero</p>
        <div className="mock-browser">
          <div className="browser-dots"><span /><span /><span /></div>
          <div className="mock-hero-content">
            <div>
              <p className="eyebrow">AI automation command layer</p>
              <h2>Turn every workflow into an intelligent operating system.</h2>
              <p>System Capital deploys autonomous agents, signal engines, and Alora-led execution loops for founders, operators, and capital allocators.</p>
              <div className="hero-actions"><a className="btn btn-primary">Build with Alora</a><a className="btn btn-ghost">Watch demo</a></div>
            </div>
            <div className="hero-orb"><Image src="/brand-kit/assets/alora-orb.svg" alt="Alora orb" width={280} height={280} /></div>
          </div>
        </div>
      </section>

      <section className="section-grid dashboard-grid">
        <div className="panel dashboard-card">
          <p className="section-kicker">06 / AI dashboard UI</p>
          <h2>Alora command dashboard</h2>
          <div className="metric-row">
            <span><strong>97%</strong> agent uptime</span>
            <span><strong>42</strong> live automations</span>
            <span><strong>12ms</strong> signal latency</span>
          </div>
          <div className="signal-list">
            {['Lead capture routed', 'Macro risk posture updated', 'Follow-up sequence generated', 'Revenue leak detected'].map((item, index) => (
              <div className="signal-item" key={item}><span>0{index + 1}</span>{item}<b>Active</b></div>
            ))}
          </div>
        </div>
        <div className="panel components-card">
          <p className="section-kicker">10 / Components</p>
          <h2>Cards + panels</h2>
          {components.map((item) => <div className="component-pill" key={item}>{item}<span /></div>)}
        </div>
      </section>

      <section className="section-grid media-grid">
        <div className="panel social-card">
          <p className="section-kicker">07 / Social post</p>
          <div className="post-preview">
            <Image src="/brand-kit/assets/system-capital-mark.svg" alt="System Capital social avatar" width={74} height={74} />
            <h2>Your business does not need more tools. It needs an operating system.</h2>
            <p>Alora turns messy workflows into autonomous execution loops.</p>
          </div>
        </div>
        <div className="panel youtube-card">
          <p className="section-kicker">08 / YouTube thumbnail</p>
          <div className="thumbnail-preview">
            <span>ALORA AI</span>
            <h2>I built an AI command center for my company</h2>
            <Image src="/brand-kit/assets/alora-orb.svg" alt="Alora thumbnail orb" width={260} height={260} />
          </div>
        </div>
      </section>

      <section className="panel asset-gallery" id="assets">
        <p className="section-kicker">11 / Asset gallery</p>
        <h2>Imported and reusable assets</h2>
        <div className="asset-grid">
          {assetGallery.map((asset) => (
            <article className="asset-card" key={asset.src}>
              <Image src={asset.src} alt={asset.title} width={260} height={260} />
              <strong>{asset.title}</strong>
              <span>{asset.type}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
