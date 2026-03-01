import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";

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

const getInitialPos = (index: number, total: number, centerX: number, centerY: number, radius: number) => {
  const angle = (2 * Math.PI * index) / Math.max(total, 1) - Math.PI / 2;
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
};

const AgentNetwork = ({ agents }: AgentNetworkProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const centerX = 170;
  const centerY = 145;
  const radius = 95;

  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [centerPos, setCenterPos] = useState({ x: centerX, y: centerY });

  // When agents list changes, register positions for any new agents
  useEffect(() => {
    setNodePositions((prev) => {
      const updated = { ...prev };
      const visibleAgents = agents.slice(0, 8);
      let added = false;
      visibleAgents.forEach((a, i) => {
        if (!(a.id in updated)) {
          // Recalculate angles for all nodes based on new total
          const pos = getInitialPos(i, visibleAgents.length, centerX, centerY, radius);
          updated[a.id] = pos;
          added = true;
        }
      });
      return added ? updated : prev;
    });
  }, [agents]);

  const visibleAgents = agents.slice(0, 8);

  const getNodePos = useCallback(
    (agent: { id: string }, index: number) =>
      nodePositions[agent.id] ?? getInitialPos(index, visibleAgents.length, centerX, centerY, radius),
    [nodePositions, visibleAgents.length]
  );

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
        {/* Connection lines — SVG redraws on every drag */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {visibleAgents.map((agent, i) => {
            const pos = getNodePos(agent, i);
            return (
              <motion.line
                key={`line-${agent.id}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                x1={centerPos.x}
                y1={centerPos.y}
                x2={pos.x}
                y2={pos.y}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}
        </svg>

        {/* Center node — draggable DX402 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          drag
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={containerRef}
          onDrag={(_e, info) => {
            setCenterPos((prev) => ({
              x: prev.x + info.delta.x,
              y: prev.y + info.delta.y,
            }));
          }}
          className="absolute z-20 cursor-grab active:cursor-grabbing"
          style={{ left: centerPos.x - 28, top: centerPos.y - 28 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.96 }}
        >
          <div className="relative h-14 w-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 shadow-[0_0_18px_hsl(var(--primary)/0.25)]" />
            <div className="absolute inset-1 rounded-full border border-primary/20" />
            <div className="h-10 w-10 rounded-full border border-primary/60 bg-card flex flex-col items-center justify-center shadow-[0_0_14px_hsl(var(--primary)/0.4)] gap-0.5">
              <span className="text-primary font-mono text-xs font-bold leading-none">◆</span>
              <span className="text-[7px] font-mono font-bold text-primary leading-tight tracking-wide">DX402</span>
            </div>
            <span className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-30" />
          </div>
        </motion.div>

        {/* Draggable agent nodes */}
        <AnimatePresence>
          {visibleAgents.map((agent, i) => {
            const pos = getNodePos(agent, i);
            const isRunning = agent.status === "running";
            return (
              <motion.div
                key={agent.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
                drag
                dragMomentum={false}
                dragElastic={0}
                dragConstraints={containerRef}
                onDrag={(_e, info) => {
                  setNodePositions((prev) => ({
                    ...prev,
                    [agent.id]: {
                      x: (prev[agent.id]?.x ?? pos.x) + info.delta.x,
                      y: (prev[agent.id]?.y ?? pos.y) + info.delta.y,
                    },
                  }));
                }}
                className="absolute z-10 group cursor-grab active:cursor-grabbing"
                style={{ left: pos.x - 20, top: pos.y - 20 }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 1.05 }}
              >
                <div className={`h-10 w-10 flex items-center justify-center rounded-full border bg-card transition-all duration-200 ${
                  isRunning
                    ? "border-primary/50 shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
                    : "border-border opacity-60"
                }`}>
                  <span className="text-primary font-mono text-xs">◆</span>
                </div>

                {/* Tooltip */}
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                  <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap bg-card px-2 py-1 rounded-md border border-border shadow-md">
                    {agent.name}
                  </span>
                </div>

                {/* Active pulse ring */}
                {isRunning && (
                  <>
                    <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-primary border-2 border-card" />
                    <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-primary animate-ping opacity-40" />
                  </>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty state */}
        {agents.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[10px] font-mono text-muted-foreground text-center px-4">
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
