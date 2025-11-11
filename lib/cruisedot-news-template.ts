export type NewsIntroBlock = {
  id: string;
  type: "intro";
  kicker: string;
  lead: string;
};

export type NewsVideoBlock = {
  id: string;
  type: "video";
  url: string;
  caption: string;
  autoplay: boolean;
  mute: boolean;
};

export type NewsSectionBlock = {
  id: string;
  type: "section";
  heading: string;
  body: string;
  listItems: string[];
};

export type NewsCalloutBlock = {
  id: string;
  type: "callout";
  title: string;
  body: string;
};

export type NewsImageBlock = {
  id: string;
  type: "image";
  src: string;
  alt: string;
  caption: string;
};

export type NewsSummaryBlock = {
  id: string;
  type: "summary";
  title: string;
  body: string;
};

export type NewsBlock =
  | NewsIntroBlock
  | NewsVideoBlock
  | NewsSectionBlock
  | NewsCalloutBlock
  | NewsImageBlock
  | NewsSummaryBlock;

export const NEWS_TEMPLATE_STYLE = `
  :root {
    --news-bg: #f6f8fc;
    --news-surface: #ffffff;
    --news-accent: #f43f5e;
    --news-accent-soft: #fee2e2;
    --news-text: #1f2937;
    --news-muted: #6b7280;
    --news-radius: 28px;
  }
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    font-family: "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background-color: var(--news-bg);
    color: var(--news-text);
    line-height: 1.85;
    font-size: 18px;
    word-break: keep-all;
  }
  .news-wrapper {
    max-width: 880px;
    margin: 0 auto;
    padding: 54px 32px 120px;
    background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.75));
    border-radius: var(--news-radius);
    box-shadow: 0 28px 60px rgba(15, 23, 42, 0.12);
    backdrop-filter: blur(12px);
  }
  .news-intro {
    text-align: center;
    margin-bottom: 48px;
  }
  .news-intro .intro-kicker {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--news-accent);
    background: var(--news-accent-soft);
    border-radius: 999px;
    padding: 10px 20px;
    font-weight: 700;
  }
  .news-intro .intro-lead {
    margin-top: 24px;
    font-size: 22px;
    font-weight: 600;
    color: var(--news-text);
  }
  .news-highlight {
    margin: 0 auto 40px;
    max-width: 720px;
    padding: 28px 32px;
    background: linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(244, 63, 94, 0.28));
    border-radius: calc(var(--news-radius) - 6px);
    border: 1px solid rgba(244, 63, 94, 0.22);
    color: #be123c;
    font-weight: 600;
    text-align: center;
    line-height: 1.7;
  }
  .news-video-block {
    margin: 0 auto 56px;
    border-radius: calc(var(--news-radius) - 4px);
    overflow: hidden;
    background: #0f172a;
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.28);
  }
  .news-video-block .video-frame {
    position: relative;
    width: 100%;
    padding-top: 56.25%;
  }
  .news-video-block iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
  .media-caption {
    margin: 0;
    padding: 18px 22px;
    font-size: 14px;
    color: #f8fafc;
    background: rgba(15, 23, 42, 0.85);
    text-align: center;
  }
  .news-content {
    display: flex;
    flex-direction: column;
    gap: 48px;
  }
  .news-section-block h2 {
    font-family: "Noto Serif KR", serif;
    font-size: 32px;
    line-height: 1.4;
    color: #111827;
    margin-bottom: 18px;
  }
  .news-section-block p {
    margin: 0;
    font-size: 19px;
    color: var(--news-text);
  }
  .news-list {
    margin: 16px 0 0;
    padding: 0;
    display: grid;
    gap: 14px;
    list-style: none;
  }
  .news-section-block .news-list li {
    padding: 16px 18px;
    background: rgba(244, 63, 94, 0.08);
    border-left: 4px solid var(--news-accent);
    border-radius: 18px;
    font-weight: 600;
  }
  .news-image-block {
    margin: 48px 0;
    text-align: center;
  }
  .news-image-block img {
    width: 100%;
    border-radius: calc(var(--news-radius) - 8px);
    box-shadow: 0 24px 50px rgba(15, 23, 42, 0.16);
  }
  .news-image-block figcaption {
    margin-top: 14px;
    font-size: 14px;
    color: var(--news-muted);
  }
  .news-callout {
    margin: 56px 0;
    padding: 36px 32px;
    border-radius: calc(var(--news-radius) - 6px);
    background: linear-gradient(120deg, rgba(244, 63, 94, 0.12), rgba(244, 63, 94, 0.04));
    border: 1px solid rgba(244, 63, 94, 0.16);
  }
  .news-callout h3 {
    margin-bottom: 16px;
    font-size: 24px;
    font-weight: 700;
    color: #9f1239;
  }
  .news-summary {
    margin-top: 64px;
    padding: 36px 32px;
    background: rgba(15, 23, 42, 0.03);
    border-radius: calc(var(--news-radius) - 6px);
    border: 1px solid rgba(15, 23, 42, 0.08);
  }
  .news-summary h3 {
    margin-bottom: 12px;
    font-size: 22px;
    font-weight: 700;
  }
  .news-summary p {
    margin: 0;
    color: var(--news-muted);
  }
  @media (max-width: 768px) {
    body {
      font-size: 17px;
    }
    .news-wrapper {
      padding: 40px 20px 96px;
      border-radius: 20px;
    }
    .news-section-block h2 {
      font-size: 26px;
    }
    .news-video-block {
      margin-bottom: 40px;
    }
  }
`.trim();

export const DEFAULT_NEWS_TITLE = "크루즈 HQ 칼럼 제목을 입력하세요";
export const DEFAULT_NEWS_HIGHLIGHT =
  "독자에게 가장 먼저 전달하고 싶은 핵심 문장을 여기에 작성하세요.";

export const DEFAULT_NEWS_BLOCKS: NewsBlock[] = [
  {
    id: "intro-1",
    type: "intro",
    kicker: "[KEYWORD] HQ INSIGHT",
    lead: "이 서문 문장을 독자에게 전하고 싶은 핵심 메시지로 교체하세요. 2-3문장으로 구성하면 좋습니다.",
  },
  {
    id: "video-1",
    type: "video",
    url: "https://www.youtube.com/embed/QkC4Ymf7CR8?rel=0&mute=1&controls=1",
    caption: "영상 설명을 입력하세요. (예: 2025 크루즈닷 HQ 인사이드 리포트)",
    autoplay: false,
    mute: true,
  },
  {
    id: "section-1",
    type: "section",
    heading: "1. 첫 번째 소제목을 입력하세요",
    body: "첫 번째 본문 문단을 작성하세요. 데이터, 인용구, 현장 경험을 중심으로 4~6문장 분량을 권장합니다.",
    listItems: [
      "핵심 통계 혹은 인사이트를 bullet 형식으로 정리하세요.",
      "독자가 바로 실행할 수 있는 팁을 함께 제시하세요.",
      "필요하다면 불릿 개수를 자유롭게 조정하세요.",
    ],
  },
  {
    id: "section-2",
    type: "section",
    heading: "2. 두 번째 소제목을 입력하세요",
    body: "두 번째 본문 문단입니다. 비교, 사례, 고객 반응 등을 활용해 설득력을 높여 주세요. 중요 수치는 굵게 또는 형광펜 효과로 강조할 수 있습니다.",
    listItems: [],
  },
  {
    id: "callout-1",
    type: "callout",
    title: "CHECK POINT",
    body: "핵심 메시지를 2~3문장으로 요약한 콜아웃을 작성하세요. 셀링 포인트나 고객에게 꼭 알려야 할 사실을 넣으면 좋습니다.",
  },
  {
    id: "image-1",
    type: "image",
    src: "https://placehold.co/960x540/f43f5e/f8fafc?text=Cruisedot+Image",
    alt: "이미지 설명을 입력하세요",
    caption: "이미지에 대한 설명을 입력하세요. (예: 2025 크루즈 선박 내부)",
  },
  {
    id: "summary-1",
    type: "summary",
    title: "마무리 정리",
    body: "본문 핵심을 요약하고 다음 행동(Call to Action)으로 자연스럽게 이어 주세요. 예: '이번 주 HQ 세미나에서 자세히 안내드릴 예정입니다.'",
  },
];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const renderBlockHtml = (block: NewsBlock) => {
  switch (block.type) {
    case "intro":
      return `
        <section class="news-intro">
          <div class="intro-kicker">${escapeHtml(block.kicker)}</div>
          <p class="intro-lead">${escapeHtml(block.lead)}</p>
        </section>
      `;
    case "video": {
      const url = escapeHtml(block.url);
      const caption = escapeHtml(block.caption);
      return `
        <section class="news-video-block">
          <div class="video-frame">
            <iframe
              src="${url}"
              title="Cruisedot HQ Video"
              loading="lazy"
              ${block.autoplay ? 'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"' : 'allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"'}
              ${block.mute ? 'data-muted="true"' : ""}
              allowfullscreen
            ></iframe>
          </div>
          <p class="media-caption">${caption}</p>
        </section>
      `;
    }
    case "section": {
      const listItems = block.listItems.filter((item) => item.trim().length > 0);
      const listMarkup =
        listItems.length > 0
          ? `
            <ul class="news-list">
              ${listItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          `
          : "";
      return `
        <article class="news-section-block">
          <h2>${escapeHtml(block.heading)}</h2>
          <p>${escapeHtml(block.body)}</p>
          ${listMarkup}
        </article>
      `;
    }
    case "callout":
      return `
        <section class="news-callout">
          <h3>${escapeHtml(block.title)}</h3>
          <p>${escapeHtml(block.body)}</p>
        </section>
      `;
    case "image":
      return `
        <figure class="news-image-block">
          <img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" />
          <figcaption>${escapeHtml(block.caption)}</figcaption>
        </figure>
      `;
    case "summary":
      return `
        <section class="news-summary">
          <h3>${escapeHtml(block.title)}</h3>
          <p>${escapeHtml(block.body)}</p>
        </section>
      `;
    default:
      return "";
  }
};

export const buildNewsHtml = ({
  title,
  highlight,
  blocks,
}: {
  title: string;
  highlight: string;
  blocks: NewsBlock[];
}) => {
  const renderedBlocks = blocks.map((block) => renderBlockHtml(block)).join("\n");
  const safeHighlight = highlight.trim()
    ? `<div class="news-highlight">${escapeHtml(highlight.trim())}</div>`
    : "";

  return `
    <!DOCTYPE html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
        <style>${NEWS_TEMPLATE_STYLE}</style>
      </head>
      <body>
        <div class="news-wrapper">
          <header class="news-header">
            <h1 class="news-title">${escapeHtml(title)}</h1>
          </header>
          ${safeHighlight}
          <main class="news-content">
            ${renderedBlocks}
          </main>
        </div>
      </body>
    </html>
  `.trim();
};

