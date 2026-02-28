import { motion } from "framer-motion";
import { Bot } from "lucide-react";

interface AgentNode {
  id: string;
  name: string;
  status: string;
  x: number;
  y: number;
}

interface AgentNetworkProps {
  agents: { id: string; name: string; status: string }[];
}

const AgentNetwork = ({ agents }: AgentNetworkProps) => {
  // Position agents in a radial layout around center
  const centerX = 160;
  const centerY = 140;
  const radius = 90;

  const nodes: AgentNode[] = agents.slice(0, 8).map((a, i) => {
    const angle = (2 * Math.PI * i) / Math.min(agents.length, 8) - Math.PI / 2;
    return {
      ...a,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

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
      <div className="relative h-[280px] mx-3 mb-3 rounded-lg overflow-hidden" style={{
        backgroundImage: `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`,
        backgroundSize: '20px 20px',
      }}>
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
          {nodes.map((node) => (
            <motion.line
              key={`line-${node.id}`}
              x1={centerX}
              y1={centerY}
              x2={node.x}
              y2={node.y}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          ))}
        </svg>

        {/* Center node */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="absolute z-10 flex items-center justify-center"
          style={{ left: centerX - 20, top: centerY - 20 }}
        >
          <div className="h-10 w-10 rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
        </motion.div>

        {/* Agent nodes */}
        {nodes.map((node, i) => (
          <motion.div
            key={node.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 + i * 0.08 }}
            className="absolute z-10 group cursor-pointer"
            style={{ left: node.x - 16, top: node.y - 16 }}
          >
            <div className={`h-8 w-8 rounded-full border flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-200 group-hover:scale-110 ${
              node.status === "running"
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border bg-card text-muted-foreground"
            }`}>
              {node.name.charAt(0).toUpperCase()}
            </div>
            {/* Tooltip */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="text-[9px] font-mono text-muted-foreground whitespace-nowrap bg-card px-1.5 py-0.5 rounded border border-border">
                {node.name}
              </span>
            </div>
            {/* Active pulse */}
            {node.status === "running" && (
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </motion.div>
        ))}

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
          <span className="text-xs font-mono text-muted-foreground">Active Agents</span>
          <span className="text-xs font-mono text-primary font-bold">
            {agents.filter((a) => a.status === "running").length || "None"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AgentNetwork;
