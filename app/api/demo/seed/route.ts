import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ingestMessage } from "@/lib/ingestion";

export async function POST() {
  // Ensure one demo founder user exists (idempotent — safe to re-run)
  const userResult = await pool.query(
    `INSERT INTO users (email, name, gmail_connected)
     VALUES ($1, $2, true)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    ["founder@demo.com", "Demo Founder"]
  );
  const user = userResult.rows[0];

  // Three leads, each with a small realistic back-and-forth thread
  const leadThreads = [
    {
      email: "jordan@acme.co", name: "Jordan Lee", company: "Acme Co",
      messages: [
        { direction: "outbound" as const, subject: "Quick intro", bodyText: "Hi Jordan, saw Acme is scaling fast — thought our tool might help with onboarding. Open to a quick chat?", hoursAgo: 60 },
        { direction: "inbound" as const, subject: "Re: Quick intro", bodyText: "Hi, thanks for reaching out! We're definitely interested, but I need to know more about pricing for our team of 50. Also, can you confirm this integrates with Salesforce?", hoursAgo: 51 },
      ],
    },
    {
      email: "priya@northwind.io", name: "Priya Shah", company: "Northwind",
      messages: [
        { direction: "outbound" as const, subject: "Following up", bodyText: "Hi Priya, circling back on our demo last week — any thoughts?", hoursAgo: 40 },
        { direction: "inbound" as const, subject: "Re: Following up", bodyText: "Honestly we're a bit frustrated — the trial account kept logging us out. Can you fix that before we move forward?", hoursAgo: 30 },
      ],
    },
    {
      email: "sam@globex.com", name: "Sam Okafor", company: "Globex",
      messages: [
        { direction: "outbound" as const, subject: "Intro", bodyText: "Hi Sam, would love to show you what we've built.", hoursAgo: 5 },
      ],
    },
  ];

  let seededMessages = 0;
  for (const thread of leadThreads) {
    for (const [i, msg] of thread.messages.entries()) {
      const sentAt = new Date(Date.now() - msg.hoursAgo * 60 * 60 * 1000).toISOString();
      await ingestMessage({
        userId: user.id,
        leadEmail: thread.email,
        leadName: thread.name,
        leadCompany: thread.company,
        direction: msg.direction,
        subject: msg.subject,
        bodyText: msg.bodyText,
        sentAt,
        gmailMessageId: `seed-${thread.email}-${i}`,
      });
      seededMessages++;
    }
  }

  return NextResponse.json({ seeded: leadThreads.length, messages: seededMessages });
}
