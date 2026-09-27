import type { IconName, StatusTone } from "@/types/ui";

import { Icon } from "@/components/ui/Icon";
import { StatusBadge } from "@/components/ui/StatusBadge";

type FlowNode = {
  label: string;
  detail: string;
  icon: IconName;
  status?: string;
  tone?: StatusTone;
};

type FlowDiagramProps = {
  nodes: readonly FlowNode[];
  className?: string;
};

export function FlowDiagram({ nodes, className = "" }: FlowDiagramProps) {
  return (
    <div className={`flow-grid ${className}`.trim()} aria-label="Integration data flow">
      {nodes.map((node, index) => (
        <div className="flow-segment" key={`${node.label}-${index}`}>
          <div className="flow-node">
            <Icon name={node.icon} />
            <strong>{node.label}</strong>
            <small>{node.detail}</small>
            {node.status ? <StatusBadge tone={node.tone}>{node.status}</StatusBadge> : null}
          </div>
          {index < nodes.length - 1 ? <span className="flow-arrow" aria-hidden="true"><Icon name="arrow" /></span> : null}
        </div>
      ))}
    </div>
  );
}
