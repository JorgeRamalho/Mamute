import { TICKER_ITEMS } from "../../data/ticker";

export function StatusBar() {
  const loop = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="status-bar" role="status" aria-label="Feed ao vivo de DJs, músicas e eventos">
      <div className="status-track">
        {loop.map((item, index) => (
          <span className="status-item" data-kind={item.kind} key={`${item.label}-${index}`}>
            <strong>{item.kind.toUpperCase()} · {item.label}</strong>
            {" — "}
            {item.detail}
          </span>
        ))}
      </div>
    </div>
  );
}
