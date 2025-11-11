import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug'); // 예: "코스타세레나/코스타 객실"
    const type = url.searchParams.get('type'); // "all" | "images" | "videos"
    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    const root = path.join(process.cwd(), 'public', '크루즈정보사진');
    const abs = path.join(root, slug);

    if (!abs.startsWith(root) || !fs.existsSync(abs)) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    const all = fs.readdirSync(abs);
    const images: string[] = [];
    const videos: string[] = [];

    for (const f of all) {
      const ext = path.extname(f).toLowerCase();
      const rel = `/크루즈정보사진/${slug}/${f}`;
      if (['.jpg','.jpeg','.png','.gif','.webp'].includes(ext)) images.push(rel);
      if (['.mp4','.webm','.mov'].includes(ext)) videos.push(rel);
    }

    const want = type === 'videos' ? { videos } :
                 type === 'images' ? { images } :
                 { images, videos };

    return NextResponse.json({ slug, ...want });
  } catch (e) {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
} 