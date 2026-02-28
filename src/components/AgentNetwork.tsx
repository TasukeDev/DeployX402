import { motion, useMotionValue } from "framer-motion";
import { Bot, User } from "lucide-react";
import { useState, useRef, useCallback } from "react";

// Generate a deterministic avatar color from agent id
const AVATAR_COLORS = [
  "from-primary/40 to-primary/10",
  "from-blue-500/30 to-blue-400/10",
  "from-amber-500/30 to-amber-400/10",
  "from-rose-500/30 to-rose-400/10",
  "from-violet-500/30 to-violet-400/10",
  "from-cyan-500/30 to-cyan-400/10",
  "from-emerald-500/30 to-emerald-400/10",
  "from-orange-500/30 to-orange-400/10",
];

interface AgentNetworkProps {
  agents: { id: string; name: string; status: string }[];
}

interface NodePos {
  id: string;
  name: string;
  status: string;
  x: number;
  y: number;
}

const AgentNetwork = ({ agents }: AgentNetworkProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerX = 170;
  const centerY = 145;
  const radius = 95;

  const initialNodes: NodePos[] = agents.slice(0, 8).map((a, i) => {
    const angle = (2 * Math.PI * i) / Math.min(agents.length, 8) - Math.PI / 2;
    return {
      ...a,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  const getNodePos = (node: NodePos) => nodePositions[node.id] || { x: node.x, y: node.y };

  const handleDrag = useCallback((id: string, info: { point: { x: number; y: number } }, element: HTMLElement) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = info.point.x - rect.left;
    const y = info.point.y - rect.top;
    setNodePositions((prev) => ({ ...prev, [id]: { x, y } }));
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-sm font-medium text-foreground">Agent Network</h3>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
          Drag to explore the network
        </p>
      </div>

      {/* Grid background + nodes */}
      <div
        ref={containerRef}
        className="relative h-[290px] mx-3 mb-3 rounded-lg overflow-hidden select-none"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      >
        {/* Connection lines (SVG re-renders on drag) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {initialNodes.map((node) => {
            const pos = getNodePos(node);
            return (
              <line
                key={`line-${node.id}`}
                x1={centerX}
                y1={centerY}
                x2={pos.x}
                y2={pos.y}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.6"
              />
            );
          })}
        </svg>

        {/* Center node */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="absolute z-20 flex items-center justify-center"
          style={{ left: centerX - 24, top: centerY - 24 }}
        >
          <div className="h-12 w-12 rounded-full border-2 border-primary/40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-[0_0_20px_-4px_hsl(var(--primary)/0.3)]">
            <Bot className="h-5 w-5 text-primary" />
          </div>
        </motion.div>

        {/* Draggable agent nodes */}
        {initialNodes.map((node, i) => {
          const colorClass = AVATAR_COLORS[i % AVATAR_COLORS.length];
          const pos = getNodePos(node);
          return (
            <motion.div
              key={node.id}
              initial={{ scale: 0, opacity: 0, x: node.x - 20, y: node.y - 20 }}
              animate={{ scale: 1, opacity: 1, x: pos.x - 20, y: pos.y - 20 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 + i * 0.08 }}
              drag
              dragMomentum={false}
              dragElastic={0}
              dragConstraints={containerRef}
              onDrag={(_, info) => {
                const container = containerRef.current;
                if (!container) return;
                const rect = container.getBoundingClientRect();
                // Use the element's current transform to compute position
                const el = _.target as HTMLElement;
                const elRect = el.getBoundingClientRect();
                const cx = elRect.left + 20 - rect.left;
                const cy = elRect.top + 20 - rect.top;
                setNodePositions((prev) => ({ ...prev, [node.id]: { x: cx, y: cy } }));
              }}
              className="absolute z-10 group cursor-grab active:cursor-grabbing"
              style={{ left: 0, top: 0 }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 1.05 }}
            >
              {/* Profile avatar */}
              <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center bg-gradient-to-br ${colorClass} transition-shadow duration-200 group-hover:shadow-[0_0_16px_-2px_hsl(var(--primary)/0.25)] ${
                node.status === "running"
                  ? "border-primary/50"
                  : "border-border"
              }`}>
                <User className={`h-4 w-4 ${
                  node.status === "running" ? "text-primary" : "text-muted-foreground"
                }`} />
              </div>

              {/* Tooltip */}
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap bg-card px-2 py-1 rounded-md border border-border shadow-md">
                  {node.name}
                </span>
              </div>

              {/* Active pulse ring */}
              {node.status === "running" && (
                <>
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-primary border-2 border-card" />
                  <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-primary animate-ping opacity-40" />
                </>
              )}
            </motion.div>
          );
        })}

        {/* Empty state */}
        {agents.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[10px] font-mono text-muted-foreground">
              More agents will connect as the network grows
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="divider-fade mx-5" />

      {/* Network Status */}
      <div className="px-5 py-4 space-y-2">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          Network Status
        </span>
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">Connected Nodes</span>
          <span className="text-xs font-mono text-primary font-bold">{agents.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">Center Agent</span>
          <span className="text-xs font-mono text-foreground">
            {agents.length > 0 ? agents[0].name : "None"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AgentNetwork;
