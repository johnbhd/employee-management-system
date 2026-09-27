import type { HrCorrectionHistoryItem } from "@/data/hr-correction-requests";

type CorrectionHistoryProps = {
  history: readonly HrCorrectionHistoryItem[];
};

export function CorrectionHistory({ history }: CorrectionHistoryProps) {
  return (
    <ol className="hr-correction-history">
      {history.map((item) => (
        <li key={item.id}>
          <span className="hr-correction-history-marker" aria-hidden="true" />
          <div>
            <strong>{item.action}</strong>
            <span>{item.actor} · {item.occurredAt}</span>
            {item.note ? <p>{item.note}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
