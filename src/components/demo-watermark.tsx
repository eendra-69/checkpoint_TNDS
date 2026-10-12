export function DemoWatermark({ label }: { label?: string }) {
  return (
    <div className="demo-watermark" aria-hidden>
      <span>{label ?? "DEMO — synthetic data"}</span>
    </div>
  );
}
