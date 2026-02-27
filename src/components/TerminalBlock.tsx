const TerminalBlock = () => {
  return (
    <div className="terminal-window rounded-xl max-w-2xl mx-auto overflow-hidden glow-soft">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-primary/80" />
          <div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
          <div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
        </div>
        <span className="text-xs text-muted-foreground font-mono ml-2">agent.config.yaml</span>
      </div>

      {/* Code content */}
      <div className="p-5 text-left font-mono text-sm leading-relaxed">
        <Line k="name" v='"customer-support"' />
        <Line k="model" v='"gpt-4o"' />
        <div className="mt-1">
          <span className="text-terminal-key">channels:</span>
        </div>
        <ListItem text="telegram" />
        <ListItem text="discord" />
        <ListItem text="whatsapp" />
        <ListItem text="slack" />
        <div className="mt-1">
          <span className="text-terminal-key">tools:</span>
          <span className="text-terminal-value"> [search, browser, email, memory]</span>
        </div>
        <Line k="deploy" v='"everywhere"' />
      </div>
    </div>
  );
};

const Line = ({ k, v }: { k: string; v: string }) => (
  <div>
    <span className="text-terminal-key">{k}:</span>{" "}
    <span className="text-terminal-string">{v}</span>
  </div>
);

const ListItem = ({ text }: { text: string }) => (
  <div className="pl-4">
    <span className="text-terminal-value">- {text}</span>
  </div>
);

export default TerminalBlock;
