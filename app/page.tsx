"use client";
import { useEffect, useMemo, useState } from "react";
type Inputs = {
  Dealers: number; RevPerCar: number; HQ_Margin_Pct: number; Calls_Dealer: number;
  MissedRate: number; LeadShare: number; LeadConv: number; HQ_Setup: number;
  HQ_OpEx: number; YearStart: number; YearEnd: number; WACC: number;
};
function compute(i: Inputs) {
  const numYears = i.YearEnd - i.YearStart + 1;
  const marginVeh = i.RevPerCar * i.HQ_Margin_Pct;
  const incrNetwork = i.Calls_Dealer * i.MissedRate * i.LeadShare * i.LeadConv * i.Dealers;
  const grossAnnual = incrNetwork * marginVeh;
  const netAnnual = grossAnnual - i.HQ_OpEx;
  const years: number[] = [], gross: number[] = [], net: number[] = [], ncf: number[] = [], cum: number[] = [], disc: number[] = [];
  let run = 0;
  for (let t = 1; t <= numYears; t++) {
    const capex = t === 1 ? -i.HQ_Setup : 0;
    const cf = grossAnnual - i.HQ_OpEx + capex;
    run += cf;
    years.push(i.YearStart + t - 1); gross.push(grossAnnual); net.push(netAnnual);
    ncf.push(cf); cum.push(run); disc.push(cf / Math.pow(1 + i.WACC, t));
  }
  return {
    years, gross, net, ncf, cum,
    ncf6: ncf.reduce((a, b) => a + b, 0),
    paybackMonths: (i.HQ_Setup / netAnnual) * 12,
    npv: disc.reduce((a, b) => a + b, 0),
    totalInvest: -i.HQ_Setup,
  };
}
const FIELDS: { n: keyof Inputs; label: string; pct: boolean; step: number }[] = [
  { n: "Dealers", label: "Dealers in pilot", pct: false, step: 1 },
  { n: "RevPerCar", label: "Revenue per new car (EUR)", pct: false, step: 1000 },
  { n: "HQ_Margin_Pct", label: "HQ transfer margin", pct: true, step: 0.5 },
  { n: "Calls_Dealer", label: "Inbound calls / dealer / yr", pct: false, step: 500 },
  { n: "MissedRate", label: "Missed call rate", pct: true, step: 1 },
  { n: "LeadShare", label: "Missed calls w/ lead potential", pct: true, step: 0.5 },
  { n: "LeadConv", label: "Lead-to-sale conversion", pct: true, step: 0.5 },
  { n: "HQ_Setup", label: "HQ one-time setup (EUR)", pct: false, step: 10000 },
  { n: "HQ_OpEx", label: "HQ annual OpEx (EUR)", pct: false, step: 5000 },
  { n: "WACC", label: "Discount rate / WACC", pct: true, step: 0.5 },
];
const eur = (v: number) => new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(v) + " EUR";
export default function Page() {
  const [base, setBase] = useState<any>(null);
  const [inp, setInp] = useState<Inputs | null>(null);
  useEffect(() => { fetch("/model.json").then(r => r.json()).then(d => { setBase(d); setInp(d.inputs); }); }, []);
  const out = useMemo(() => (inp ? compute(inp) : null), [inp]);
  if (!inp || !out || !base) return <p style={{ padding: 24 }}>Loading model…</p>;
  const set = (n: keyof Inputs, ui: number, pct: boolean) => setInp({ ...inp, [n]: pct ? ui / 100 : ui });
  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ color: "#0E3A2F" }}>{base.initiative}</h1>
      <p style={{ color: "#555" }}>{base.market} · published {base.publishedAt}</p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" }}>
        {[["NPV @ WACC", eur(out.npv)], ["6-yr net cash flow", eur(out.ncf6)],
          ["Payback", `${out.paybackMonths.toFixed(1)} months`], ["Total HQ investment", eur(out.totalInvest)]]
          .map(([k, v]) => (
          <div key={k} style={{ flex: "1 1 200px", background: "#D6E2DD", padding: 16, borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: "#0E3A2F" }}>{k}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
        <section style={{ flex: "1 1 340px" }}>
          <h3>Assumptions</h3>
          {FIELDS.map(f => {
            const ui = f.pct ? Math.round((inp[f.n] as number) * 1000) / 10 : inp[f.n];
            return (
              <div key={f.n} style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13 }}>{f.label}: <b>{ui}{f.pct ? "%" : ""}</b></label>
                <input type="number" step={f.step} value={ui as number}
                  onChange={e => set(f.n, Number(e.target.value), f.pct)} style={{ width: "100%", padding: 6 }} />
              </div>
            );
          })}
          <button onClick={() => setInp(base.inputs)} style={{ marginTop: 8, padding: "8px 14px" }}>Reset to published base</button>
        </section>
        <section style={{ flex: "1 1 480px" }}>
          <h3>Cash flow {out.years[0]}–{out.years[out.years.length - 1]}</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>{["", ...out.years].map((y, i) => <th key={i} style={{ textAlign: "right", borderBottom: "2px solid #0E3A2F", padding: 6 }}>{y}</th>)}</tr></thead>
            <tbody>
              {[["Gross benefit", out.gross], ["Net benefit", out.net], ["Net cash flow", out.ncf], ["Cumulative", out.cum]].map(([lab, row]: any) => (
                <tr key={lab}><td style={{ padding: 6 }}>{lab}</td>
                  {row.map((v: number, i: number) => <td key={i} style={{ textAlign: "right", padding: 6 }}>{eur(v)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
