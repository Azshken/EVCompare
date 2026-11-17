import type { IncomingMessage, ServerResponse } from 'http';

interface LeadSubmission {
  submittedAt: string;
  source: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    message: string;
    consent: boolean;
  };
  snapshot: {
    running: {
      distance: number;
      fuelType: string;
      fuelConsumption: number;
      fuelPrice: number;
      evConsumption: number;
      electricityPrice: number;
      annualSavings: number;
      monthlySavings: number;
    };
    financing: {
      vehiclePrice: number;
      downPayment: number;
      months: number;
      apr: number;
      amountFinanced: number;
      monthlyPayment: number;
    };
    models: {
      selected: string | null;
      checked: string[];
    };
  };
}

const DEALERS = [
  {
    id: 'main',
    name: 'EVCompare Admin',
    email: 'marianbottyan@gmail.com',
    brands: ['*'],
  },
];

function matchDealers(lead: LeadSubmission) {
  return DEALERS;
}

function formatLeadEmail(lead: LeadSubmission): string {
  const { contact, snapshot, source, submittedAt } = lead;
  const models = snapshot.models.checked.length
    ? snapshot.models.checked.join(', ')
    : snapshot.models.selected || 'None selected';

  return `
New EVCompare lead

Submitted: ${submittedAt}
Source: ${source}

Contact
-------
Name: ${contact.name}
Email: ${contact.email}
Phone: ${contact.phone || '—'}
Message: ${contact.message || '—'}

Models of interest
------------------
${models}

Running costs snapshot
----------------------
Annual distance: ${snapshot.running.distance} km
Fuel type: ${snapshot.running.fuelType}
Fuel consumption: ${snapshot.running.fuelConsumption} l/100km
Fuel price: €${snapshot.running.fuelPrice}
EV consumption: ${snapshot.running.evConsumption} kWh/100km
Electricity price: €${snapshot.running.electricityPrice}/kWh
Annual EV savings: €${snapshot.running.annualSavings.toFixed(2)}
Monthly EV savings: €${snapshot.running.monthlySavings.toFixed(2)}

Financing snapshot
------------------
Vehicle price: €${snapshot.financing.vehiclePrice}
Down payment: €${snapshot.financing.downPayment}
Term: ${snapshot.financing.months} months
APR: ${snapshot.financing.apr}%
Amount financed: €${snapshot.financing.amountFinanced}
Estimated monthly payment: €${snapshot.financing.monthlyPayment.toFixed(0)}

---
Forward this lead to the relevant dealership partner.
  `.trim();
}

export default async function handler(
  req: IncomingMessage & { body?: LeadSubmission },
  res: ServerResponse & { json: (data: unknown) => void; status: (code: number) => any; setHeader: (name: string, value: string) => void },
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const lead = req.body as LeadSubmission | undefined;
  if (!lead?.contact?.email || !lead.contact.consent) {
    res.status(400).json({ error: 'Invalid lead' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('Lead received (no RESEND_API_KEY set):', JSON.stringify(lead, null, 2));
    res.status(200).json({ ok: true, warning: 'Email not configured' });
    return;
  }

  const matched = matchDealers(lead);
  const toEmails = matched.map((d) => d.email);

  const emailBody = formatLeadEmail(lead);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'EVCompare <onboarding@resend.dev>',
        to: toEmails,
        subject: `New EV lead: ${lead.contact.name} (${lead.snapshot.models.selected || lead.snapshot.models.checked[0] || 'no model'})`,
        text: emailBody,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend error:', errText);
      res.status(502).json({ error: 'Failed to send email' });
      return;
    }

    res.status(200).json({ ok: true, forwardedTo: toEmails.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal error' });
  }
}
