import { VegaEmbed } from 'react-vega';
import { useAgentUI } from '../context/AgentUIContext';

const ChartPanel = () => {
  const { chartSpec } = useAgentUI();

  if (!chartSpec) return null;

  return (
    <section className="max-w-[1200px] mx-auto mb-12 px-2">
      <div className="font-mono text-xs text-zinc-500 mb-4 tracking-wide">$ fredbot --chart</div>
      <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800">
        <VegaEmbed spec={chartSpec} options={{ actions: false }} className="w-full" />
      </div>
    </section>
  );
};

export default ChartPanel;
