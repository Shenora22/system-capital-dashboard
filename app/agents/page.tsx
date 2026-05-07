import ShenoraShell from "@/dashboard/components/ShenoraShell";
import AgentsInteractive from "@/agents/components/AgentsInteractive";

export default function AgentsPage() {
  return (
    <ShenoraShell
      current="agents"
      title="Agents"
      description="Spin up, pause, and inspect autonomous workers running inside Shenora Network."
    >
      <AgentsInteractive />
    </ShenoraShell>
  );
}
