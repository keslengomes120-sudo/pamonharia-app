"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AI_PROVIDERS, getProviderModels } from "@/lib/ai-providers";

type Config = {
  provider: string; model: string; apiKey: string; ollamaUrl: string;
  temperature: number; maxTokens: number; active: boolean;
};

export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<Config>({
    provider: "google", model: "gemini-2.0-flash", apiKey: "",
    ollamaUrl: "http://localhost:11434", temperature: 0.7, maxTokens: 1024, active: true,
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/settings/ai").then((r) => r.json()).then((d) => {
      if (d.provider) setConfig((prev) => ({ ...prev, ...d, apiKey: d.apiKey ?? "" }));
      setLoaded(true);
    });
  }, []);

  const models = getProviderModels(config.provider);
  const selectedProvider = AI_PROVIDERS.find((p) => p.id === config.provider);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error();
      toast.success("Configurações salvas!");
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function test() {
    setTesting(true);
    try {
      const res = await fetch("/api/ai/test", { method: "POST" });
      const data = await res.json();
      if (res.ok) toast.success(`✅ IA respondeu: "${data.reply?.slice(0, 80)}..."`);
      else toast.error(data.error ?? "Erro no teste");
    } catch { toast.error("Falha na conexão"); }
    finally { setTesting(false); }
  }

  if (!loaded) return <div className="p-6 text-gray-400">Carregando...</div>;

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-5">⚙️ Configurações</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {/* Provedor */}
        <div className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">🤖 Provedor de IA</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AI_PROVIDERS.map((p) => (
              <button key={p.id} onClick={() => setConfig({ ...config, provider: p.id, model: p.defaultModel })}
                className={`flex flex-col items-center p-3 rounded-xl border text-xs font-medium transition-colors ${
                  config.provider === p.id
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}>
                <span className="text-2xl mb-1">{p.icon}</span>
                <span>{p.label}</span>
                {p.free && <span className="text-[10px] text-green-600 mt-0.5">Grátis</span>}
                {p.local && <span className="text-[10px] text-blue-600 mt-0.5">Local</span>}
              </button>
            ))}
          </div>

          {selectedProvider && (
            <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-500">
              {selectedProvider.description}
              {selectedProvider.keyLink && (
                <a href={selectedProvider.keyLink} target="_blank" rel="noopener noreferrer"
                  className="ml-2 text-orange-500 underline">Obter chave →</a>
              )}
            </div>
          )}
        </div>

        {/* Modelo */}
        <div className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">🧠 Modelo</h2>
          <div className="grid gap-2">
            {models.map((m) => (
              <button key={m.id} onClick={() => setConfig({ ...config, model: m.id })}
                className={`flex justify-between items-center p-3 rounded-xl border text-sm transition-colors ${
                  config.model === m.id ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                }`}>
                <div className="text-left">
                  <p className="font-medium text-gray-800">{m.label}</p>
                  {m.description && <p className="text-xs text-gray-400 mt-0.5">{m.description}</p>}
                </div>
                <div className="text-right text-xs text-gray-400">
                  {m.free ? <span className="text-green-600 font-medium">Grátis</span> : m.pricing}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chave de API / URL Ollama */}
        <div className="p-5">
          {config.provider === "ollama" ? (
            <>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">🌐 URL do Ollama</h2>
              <input value={config.ollamaUrl}
                onChange={(e) => setConfig({ ...config, ollamaUrl: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="http://localhost:11434" />
            </>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">🔑 Chave de API</h2>
              <input type="password" value={config.apiKey ?? ""}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder={selectedProvider?.keyPlaceholder ?? "sk-..."} />
              {config.apiKey?.startsWith("***") && (
                <p className="text-xs text-gray-400 mt-1">Chave salva (oculta). Preencha novamente para alterar.</p>
              )}
            </>
          )}
        </div>

        {/* Parâmetros */}
        <div className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">🎛️ Parâmetros</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-gray-600">Temperatura: <strong>{config.temperature}</strong></label>
                <span className="text-xs text-gray-400">{config.temperature < 0.4 ? "Mais preciso" : config.temperature > 0.8 ? "Mais criativo" : "Equilibrado"}</span>
              </div>
              <input type="range" min="0" max="1" step="0.1" value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: Number(e.target.value) })}
                className="w-full accent-orange-500" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-gray-600">Máx. tokens: <strong>{config.maxTokens}</strong></label>
              </div>
              <input type="range" min="256" max="4096" step="256" value={config.maxTokens}
                onChange={(e) => setConfig({ ...config, maxTokens: Number(e.target.value) })}
                className="w-full accent-orange-500" />
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="p-5 flex gap-3">
          <button onClick={test} disabled={testing}
            className="flex-1 py-3 border border-orange-400 text-orange-600 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-orange-50">
            {testing ? "Testando..." : "🧪 Testar IA"}
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-orange-600">
            {saving ? "Salvando..." : "💾 Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
