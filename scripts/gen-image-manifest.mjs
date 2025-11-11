import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// public/크루즈정보사진 밑의 모든 이미지 경로를 수집해서 태그를 폴더명 기반으로 생성
const PUBLIC_ROOT = path.join(__dirname, "..", "public");
const BASE_DIR    = path.join(PUBLIC_ROOT, "크루즈정보사진");

const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

// 폴더명에서 태그 뽑기 (한/영/숫자, 공백·기호 제거, 괄호 안 영문 제거)
function toTagsFromFolderName(folderName) {
  // 괄호 안 텍스트 제거
  const noParen = folderName.replace(/\([^)]*\)/g, "");
  // 특수기호 → 공백 치환
  const cleaned = noParen.replace(/[_\-\/\\.,]/g, " ");
  // 공백 단위 토큰
  const raw = cleaned.split(/\s+/).map(s => s.trim()).filter(Boolean);
  // 한글/영문/숫자만 남기고 2글자 이상만 태그로
  const tags = raw
    .map(t => t.replace(/[^0-9A-Za-z가-힣]/g, ""))
    .filter(t => t.length >= 2);

  // 자주 쓰는 약어/영문 별칭 매핑(원하면 더 추가)
  const alias = [];
  if (tags.some(t => /퀀텀|Quantum|퀀텀오브더시즈|퀀텀오브더/gi.test(t))) alias.push("퀀텀","quantum");
  if (tags.some(t => /벨리시마|Bellissima/i.test(t))) alias.push("벨리시마","bellissima","MSC");
  if (tags.some(t => /세레나|코스타세레나|Serena/i.test(t))) alias.push("세레나","코스타","serena","costa");
  // …필요시 계속 추가

  return Array.from(new Set([...tags, ...alias]));
}

function walk(dir) {
  const result = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    const items = fs.readdirSync(d, { withFileTypes: true });
    for (const it of items) {
      const full = path.join(d, it.name);
      if (it.isDirectory()) {
        stack.push(full);
      } else {
        const ext = path.extname(it.name).toLowerCase();
        if (exts.has(ext)) result.push(full);
      }
    }
  }
  return result;
}

function relPublic(p) {
  return "/" + path.relative(PUBLIC_ROOT, p).replace(/\\/g, "/");
}

const allFiles = fs.existsSync(BASE_DIR) ? walk(BASE_DIR) : [];
const items = allFiles.map(f => {
  const rel = relPublic(f); // 예: /크루즈정보사진/로얄캐리비안 퀀텀/xxx.jpg
  const folder = path.dirname(rel).split("/").slice(-1)[0]; // 마지막 폴더명
  return {
    path: rel,
    folder,
    tags: toTagsFromFolderName(folder)
  };
});

const backgrounds = items.filter(i => /background|배경|크루즈배경이미지/i.test(i.path));
// '고객 후기 자료' 풀
const reviews = items.filter(i => /고객\s*후기\s*자료/i.test(i.path));

const manifest = {
  generatedAt: new Date().toISOString(),
  total: items.length,
  items,
  backgrounds: backgrounds.map(b => b.path),
  reviews: reviews.map(r => r.path)
};

const OUT = path.join(__dirname, "..", "data", "image_manifest.json");
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2), "utf8");

console.log(`✅ image_manifest.json generated (${items.length} images) -> data/image_manifest.json`);















