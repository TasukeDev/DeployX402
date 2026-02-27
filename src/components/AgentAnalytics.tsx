import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Clock, MessageSquare, Activity } from "lucide-react";

interface Analytics {
  agent_id: string;
  request_count: number;
  total_tokens: number;
  last_active_at: string | null;
}

interface AgentAnalyticsProps {
  agentIds: string[];
  agentStatuses: Record<string, string>;
  agentCreatedAts: Record<string, string>;
}

export const AgentAnalytics = ({ agentIds, agentStatuses, agentCreatedAts }: AgentAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<Analytics[]>([]);

  useEffect(() => {
    if (agentIds.length === 0) return;
    supabase
      .from("agent_analytics")
      .select("*")
      .in("agent_id", agentIds)
      .then(({ data }) => {
        if (data) setAnalytics(data);
      });
  }, [agentIds]);

  const totalRequests = analytics.reduce((sum, a) => sum + a.request_count, 0);
  const activeAgents = Object.values(agentStatuses).filter((s) => s === "running").length;

  const calcUptime = () => {
    let totalHours = 0;
    for (const id of agentIds) {
      const created = agentCreatedAts[id];
      if (created && agentStatuses[id] === "running") {
        totalHours += (Date.now() - new Date(created).getTime()) / 3600000;
      }
    }
    return totalHours.toFixed(1);
  };

  const lastActive = analytics
    .filter((a) => a.last_active_at)
    .sort((a, b) => new Date(b.last_active_at!).getTime() - new Date(a.last_active_at!).getTime())[0];

  const stats = [
    {
      label: "Total Requests",
      value: totalRequests.toLocaleString(),
      icon: MessageSquare,
      color: "text-blue-400",
      bg: "bg-blue-400/10 border-blue-400/20",
    },
    {
      label: "Active Agents",
      value: activeAgents,
      icon: Activity,
      color: "text-green-400",
      bg: "bg-green-400/10 border-green-400/20",
    },
    {
      label: "Total Uptime",
      value: `${calcUptime()}h`,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-400/10 border-amber-400/20",
    },
    {
      label: "Last Active",
      value: lastActive?.last_active_at
        ? new Date(lastActive.last_active_at).toLocaleDateString()
        : "Never",
      icon: BarChart3,
      color: "text-purple-400",
      bg: "bg-purple-400/10 border-purple-400/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};
