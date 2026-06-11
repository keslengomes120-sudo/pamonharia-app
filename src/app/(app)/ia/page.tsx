"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string; createdAt?: string };

const QUICK_ACTIONS = [
  "Qual foi meu CMV hoje?",
  "Quais produtos têm maior margem?",
  "Estoque baixo de algum insumo?",
  "Resumo das vendas da semana",
  "Como melhorar meu CMV?",
  "Dica pra aumentar faturamento",
];

export default function IaPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<{ provider: string; model: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
    loadConfig();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadHistory() {
    try {
      const r = await fetch("/api/ai/history").then((r) => r.json());
      if (Array.isArray(r)) setMessages(r);
    } catch {}
  }

  async function loadConfig() {
    try {
      const r = await fetch("/api/settings/ai").then((r) => r.json());
      if (r.provider) setConfig({ provider: r.provider, model: r.model });
    } catch {}
  }

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro na IA");
      }
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao consultar IA");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  const providerLabels: Record<string, string> = {
    google: "Gemini", anthropic: "Claude", openai: "GPT", deepseek: "DeepSeek", mistral: "Mistral", ollama: "Ollama",
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-0px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
        <div>
          <h1 className="font-bold text-gray-900">🤖 Assistente IA</h1>
          {config && (
            <p className="text-xs text-gray-400">{providerLabels[config.provider] ?? config.provider} — {config.model}</p>
          )}
        </div>
        <a href="/configuracoes" className="text-xs text-orange-500 hover:underline">Configurar IA</a>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">🤖</p>
            <p className="text-gray-500 text-sm font-medium">Olá! Sou sua IA especialista em pamonharia.</p>
            <p className="text-gray-400 text-xs mt-1">Posso analisar suas vendas, CMV, estoque e muito mais.</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-orange-500 text-white rounded-br-sm"
                : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
            }`}>
              {m.role === "assistant" && <span className="text-base mr-1">🤖</span>}
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      {messages.length === 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_ACTIONS.map((a) => (
              <button key={a} onClick={() => send(a)}
                className="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:border-orange-300 hover:text-orange-600 whitespace-nowrap">
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Pergunte sobre vendas, CMV, estoque..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-colors"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center disabled:opacity-40 hover:bg-orange-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
