'use client';

import { useMemo, useState } from 'react';

const MINUTES_PER_CALL = 2.2;
const WORKING_DAYS = 260;

const money = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
};

const label = { fontSize: 14, color: '#B6C0D2' } as const;
const readout = { fontSize: 15, color: '#EAF1FF' } as const;

function Slider({
  title,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  title: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label htmlFor={title} style={label}>
          {title}
        </label>
        <span className="lc-mono" style={readout}>
          {display}
        </span>
      </div>
      <input
        id={title}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ marginTop: 14 }}
      />
    </div>
  );
}

export function RoiCalc({ costPerMinute }: { costPerMinute: number }) {
  const [sdrs, setSdrs] = useState(4);
  const [cost, setCost] = useState(85_000);
  const [calls, setCalls] = useState(2_000);

  const { teamCost, laycalCost, savings } = useMemo(() => {
    const team = sdrs * cost;
    const laycal = calls * WORKING_DAYS * MINUTES_PER_CALL * costPerMinute;
    return { teamCost: team, laycalCost: laycal, savings: Math.max(0, team - laycal) };
  }, [sdrs, cost, calls, costPerMinute]);

  return (
    <div
      data-reveal
      style={{
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        background: 'rgba(11,13,20,0.72)',
        backdropFilter: 'blur(10px)',
        padding: 36,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <Slider title="SDRs on the team" value={sdrs} display={String(sdrs)} min={1} max={25} step={1} onChange={setSdrs} />
        <Slider
          title="Fully loaded cost per SDR / year"
          value={cost}
          display={money(cost)}
          min={40_000}
          max={140_000}
          step={5_000}
          onChange={setCost}
        />
        <Slider
          title="Calls you want per day"
          value={calls}
          display={calls.toLocaleString()}
          min={200}
          max={12_000}
          step={100}
          onChange={setCalls}
        />
      </div>

      <div
        className="lc-stack-sm"
        style={{
          marginTop: 32,
          paddingTop: 28,
          borderTop: '1px solid rgba(255,255,255,0.09)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 22,
        }}
      >
        {[
          ['Team cost', `${money(teamCost)}/yr`, '#8E99AC', '#6E788C'],
          ['Laycal cost', `${money(laycalCost)}/yr`, '#EAF1FF', '#6E788C'],
          ['You keep', `${money(savings)}/yr`, '#6FA8FF', '#9EC0FF'],
        ].map(([k, v, tone, capTone]) => (
          <div key={k}>
            <div
              className="lc-mono"
              style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: capTone }}
            >
              {k}
            </div>
            <div style={{ marginTop: 8, fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', color: tone }}>{v}</div>
          </div>
        ))}
      </div>

      <p style={{ margin: '22px 0 0', fontSize: 12, lineHeight: 1.6, color: '#5F6A7D' }}>
        Assumes {MINUTES_PER_CALL} minutes per call across {WORKING_DAYS} working days at ${costPerMinute.toFixed(2)}/min.
        Indicative only — your rates are confirmed on the demo.
      </p>
    </div>
  );
}
