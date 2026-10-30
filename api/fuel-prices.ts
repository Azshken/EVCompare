import type { IncomingMessage, ServerResponse } from 'http';

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse & { json: (data: unknown) => void; status: (code: number) => any; setHeader: (name: string, value: string) => void },
) {
  try {
    const response = await fetch('https://sk.fuelo.net/prices', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EVCompareBot/1.0; +https://evcompare-seven.vercel.app)',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      res.status(502).json({ error: 'Failed to fetch Slovnaft prices from Fuelo' });
      return;
    }

    const html = await response.text();

    // Parse the Slovnaft row: look for the brand link then the next two price spans (Evo 95 / Evo Diesel).
    const match = html.match(/Slovnaft[\s\S]*?<span[^>]*>\s*([0-9]+\.[0-9]+)\s*<\/span>[\s\S]*?<span[^>]*>\s*([0-9]+\.[0-9]+)\s*<\/span>/i);

    if (!match) {
      res.status(500).json({ error: 'Could not parse Slovnaft prices' });
      return;
    }

    const petrol = Number(match[1]);
    const diesel = Number(match[2]);

    if (!Number.isFinite(petrol) || !Number.isFinite(diesel)) {
      res.status(500).json({ error: 'Invalid price values' });
      return;
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.json({
      petrol,
      diesel,
      source: 'Slovnaft network averages via Fuelo.net',
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
