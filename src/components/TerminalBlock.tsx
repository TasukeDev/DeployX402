const TerminalBlock = () => {
  return (
    <div className="terminal-window rounded-2xl overflow-hidden glow-card border-gradient">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-primary/60" />
          <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
          <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
        </div>
        <span className="text-xs text-muted-foreground font-mono ml-2">agent.config.yaml</span>
      </div>

      {/* Code */}
      <div className="p-6 text-left font-mono text-[13px] leading-relaxed">
        <Line k="name" v='"customer-support"' />
        <Line k="model" v='"gpt-4o"' />
        <div className="mt-2">
          <span className="text-terminal-key">channels:</span>
        </div>
        <ListItem text="telegram" />
        <ListItem text="discord" />
        <ListItem text="whatsapp" />
        <ListItem text="slack" />
        <div className="mt-2">
          <span className="text-terminal-key">tools:</span>
          <span className="text-terminal-value"> [search, browser, email, memory]</span>
        </div>
        <Line k="risk_mode" v='"safe"' />
        <Line k="deploy" v='"everywhere"' highlight />
      </div>
    </div>
  );
};

const Line = ({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) => (
  <div className={highlight ? "mt-2 px-2 py-1 -mx-2 rounded bg-primary/5 border border-primary/10" : ""}>
    <span className="text-terminal-key">{k}:</span>{" "}
    <span className={highlight ? "text-primary" : "text-terminal-string"}>{v}</span>
  </div>
);

const ListItem = ({ text }: { text: string }) => (
  <div className="pl-4">
    <span className="text-terminal-value">- {text}</span>
  </div>
);

export default TerminalBlock;
