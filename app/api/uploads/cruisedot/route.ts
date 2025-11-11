import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MEDIA_ROOT = path.join(process.cwd(), "public", "크루즈정보사진");
const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".avif"]);

const ensureMediaRoot = async () => {
  await fs.mkdir(MEDIA_ROOT, { recursive: true });
};

const isSafeSegment = (segment: string) => /^[a-zA-Z0-9가-힣_\- ]+$/.test(segment);

const sanitizeSubfolder = (subfolder: string) => {
  const trimmed = subfolder.trim();
  if (!trimmed) return "";
  const segments = trimmed.split("/").map((part) => part.trim()).filter(Boolean);
  for (const segment of segments) {
    if (!isSafeSegment(segment)) {
      throw new Error("서브 폴더 이름에는 한글, 영문, 숫자, 공백, -, _만 사용할 수 있습니다.");
    }
  }
  return segments.join("/");
};

const sanitizeFileName = (name: string, fallback: string) => {
  const trimmed = name.trim().replace(/\s+/g, "-");
  if (!trimmed) return fallback;
  const safe = trimmed.replace(/[^a-zA-Z0-9가-힣_\-\.]/g, "");
  return safe || fallback;
};

type MediaDirectory = {
  name: string;
  path: string;
};

type MediaFile = {
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
};

const readMediaLibrary = async (): Promise<{ directories: MediaDirectory[]; files: MediaFile[] }> => {
  const directories: MediaDirectory[] = [];
  const files: MediaFile[] = [];

  const walk = async (currentPath: string, relativePath = ""): Promise<void> => {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      const entryRelativePath = path.join(relativePath, entry.name);
      if (entry.isDirectory()) {
        directories.push({
          name: entry.name,
          path: `/${path.join("크루즈정보사진", entryRelativePath).replace(/\\/g, "/")}`,
        });
        await walk(entryPath, entryRelativePath);
      } else if (entry.isFile()) {
        const stat = await fs.stat(entryPath);
        files.push({
          name: entry.name,
          path: `/${path.join("크루즈정보사진", entryRelativePath).replace(/\\/g, "/")}`,
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
        });
      }
    }
  };

  await ensureMediaRoot();
  await walk(MEDIA_ROOT);

  return { directories, files };
};

export async function GET() {
  try {
    const data = await readMediaLibrary();
    return NextResponse.json({ ok: true, ...data });
  } catch (error: any) {
    console.error("[CRUISEDOT MEDIA] GET error:", error);
    return NextResponse.json(
      { ok: false, error: "미디어 라이브러리를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureMediaRoot();
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "업로드할 파일을 찾을 수 없습니다." }, { status: 400 });
    }

    const subfolderValue = (formData.get("subfolder") as string | null) ?? "";
    const filenameValue = (formData.get("filename") as string | null) ?? "";

    const safeSubfolder = sanitizeSubfolder(subfolderValue);
    const originalName = sanitizeFileName(file.name, `image-${Date.now()}`);
    const baseName = filenameValue
      ? sanitizeFileName(filenameValue, originalName.replace(/\.[^.]+$/, ""))
      : originalName.replace(/\.[^.]+$/, "");
    const extension = path.extname(originalName).toLowerCase();

    if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { ok: false, error: "지원하지 않는 이미지 형식입니다. (jpg, png, gif, webp, svg, avif)" },
        { status: 400 }
      );
    }

    const finalName = `${baseName}${extension}`;
    const targetDir = safeSubfolder ? path.join(MEDIA_ROOT, safeSubfolder) : MEDIA_ROOT;
    await fs.mkdir(targetDir, { recursive: true });

    const targetPath = path.join(targetDir, finalName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(targetPath, buffer);

    const relativePath = `/${path.join("크루즈정보사진", safeSubfolder, finalName).replace(/\\/g, "/")}`;
    return NextResponse.json({ ok: true, file: { path: relativePath, name: finalName } });
  } catch (error: any) {
    console.error("[CRUISEDOT MEDIA] POST error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "이미지 업로드에 실패했습니다." },
      { status: 500 }
    );
  }
}

