export default async function CommandCenter() {
  let data;

  try {
    const res = await fetch("http://localhost:3000/api/signals", {
      cache: "no-store",
    });

    data = await res.json();
  } catch (error) {
    data = null;
  }

  if (!data) {
    return (
      <div className="p-10 text-white bg-black min-h-screen">
        <h1 className="text-2xl">System Capital</h1>
        <p className="mt-4 text-red-400">No signal data available</p>
      </div>
    );
  }

  return (
    <div className="p-10 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">System Capital</h1>

      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <h2 className="text-xl mb-2">Market Regime</h2>
        <p className="text-4xl font-bold">{data.label}</p>
        <p className="text-sm text-zinc-400 mt-2">
          Confidence: {data.confidence}%
        </p>
      </div>

      <div className="mt-6 bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <h2 className="text-xl mb-2">Outlook</h2>
        <p>{data.horizon}</p>
      </div>

      <div className="mt-6 bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <h2 className="text-xl mb-2">Context</h2>
        <p>{data.context}</p>
      </div>
      
    </div>
  );
}