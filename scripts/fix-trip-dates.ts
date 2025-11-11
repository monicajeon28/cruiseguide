import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function parseDateFlexible(v:any): Date | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return new Date(v);
  if (typeof v === 'string') {
    const t = v.trim();
    if (/^\d+$/.test(t)) return new Date(Number(t));
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return new Date(t+'T00:00:00.000Z');
    const d = new Date(t);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

async function main() {
  const trips = await prisma.trip.findMany();
  for (const t of trips) {
    const sd = parseDateFlexible((t as any).startDate);
    const ed = parseDateFlexible((t as any).endDate);
    const dest = typeof (t as any).destination === 'string'
      ? (()=>{ try { return JSON.parse((t as any).destination); } catch { return []; } })()
      : (t as any).destination;

    if (sd && ed) {
      await prisma.trip.update({
        where: { id: t.id },
        data: { startDate: sd, endDate: ed, destination: Array.isArray(dest) ? dest : [] },
      });
    }
  }
  console.log('done');
}

main().finally(()=>prisma.$disconnect());





