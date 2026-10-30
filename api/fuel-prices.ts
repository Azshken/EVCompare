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

    // Parse the Slovnaft row from the brand prices table.
    // Example text: Slovnaft\t1.834\t1.988\t0.928\t...
    const match = html.match(/Slovnaft[^0-9]*([0-9]+\.[0-9]+)[^0-9]*([0-9]+\.[0-9]+)/i);

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
