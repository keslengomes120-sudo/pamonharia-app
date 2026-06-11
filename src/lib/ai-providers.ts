export type AiModel = {
  id: string; label: string; description?: string; free?: boolean; pricing?: string;
};

export type AiProvider = {
  id: string; label: string; icon: string; description: string;
  free?: boolean; local?: boolean;
  keyLink?: string; keyPlaceholder?: string;
  defaultModel: string;
  models: AiModel[];
};

export const AI_PROVIDERS: AiProvider[] = [
  {
    id: "google", label: "Google Gemini", icon: "🟦",
    description: "Ótimo pra começar — modelo Flash é gratuito",
    free: true, keyLink: "https://aistudio.google.com/app/apikey",
    keyPlaceholder: "AIza...", defaultModel: "gemini-2.0-flash",
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", description: "Rápido e gratuito", free: true },
      { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite", description: "Ultra-leve, gratuito", free: true },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", description: "Mais capaz", pricing: "pago" },
    ],
  },
  {
    id: "anthropic", label: "Claude (Anthropic)", icon: "🟠",
    description: "Mais inteligente, respostas mais precisas",
    keyLink: "https://console.anthropic.com/", keyPlaceholder: "sk-ant-...",
    defaultModel: "claude-haiku-4-5-20251001",
    models: [
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5", description: "Rápido e econômico", pricing: "$0.80/M" },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", description: "Alta inteligência", pricing: "$3/M" },
    ],
  },
  {
    id: "openai", label: "OpenAI GPT", icon: "⚫",
    description: "Opção popular, boa precisão",
    keyLink: "https://platform.openai.com/api-keys", keyPlaceholder: "sk-...",
    defaultModel: "gpt-4o-mini",
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o Mini", description: "Barato e rápido", pricing: "$0.15/M" },
      { id: "gpt-4o", label: "GPT-4o", description: "Mais capaz", pricing: "$2.50/M" },
    ],
  },
  {
    id: "deepseek", label: "DeepSeek", icon: "🐋",
    description: "Custo muito baixo, boa performance",
    keyLink: "https://platform.deepseek.com/", keyPlaceholder: "sk-...",
    defaultModel: "deepseek-chat",
    models: [
      { id: "deepseek-chat", label: "DeepSeek V3", description: "Baratíssimo", pricing: "$0.07/M" },
      { id: "deepseek-reasoner", label: "DeepSeek R1", description: "Raciocínio profundo", pricing: "$0.55/M" },
    ],
  },
  {
    id: "mistral", label: "Mistral AI", icon: "🌊",
    description: "Europeu, bom em português",
    keyLink: "https://console.mistral.ai/", keyPlaceholder: "...",
    defaultModel: "mistral-small-latest",
    models: [
      { id: "mistral-small-latest", label: "Mistral Small", description: "Rápido", pricing: "$0.20/M" },
      { id: "mistral-large-latest", label: "Mistral Large", description: "Preciso", pricing: "$2/M" },
    ],
  },
  {
    id: "ollama", label: "Ollama (Local)", icon: "🦙",
    description: "100% local e gratuito — precisa de PC razoável",
    free: true, local: true, keyLink: "https://ollama.ai",
    defaultModel: "llama3.2:3b",
    models: [
      { id: "llama3.2:3b", label: "Llama 3.2 3B", description: "Leve", free: true },
      { id: "llama3.2:8b", label: "Llama 3.2 8B", description: "Médio", free: true },
      { id: "qwen2.5:7b", label: "Qwen 2.5 7B", description: "Bom em português", free: true },
      { id: "mistral:7b", label: "Mistral 7B", description: "Equilibrado", free: true },
    ],
  },
];

export function getProviderModels(providerId: string): AiModel[] {
  return AI_PROVIDERS.find((p) => p.id === providerId)?.models ?? [];
}

export function getDefaultModel(providerId: string): string {
  return AI_PROVIDERS.find((p) => p.id === providerId)?.defaultModel ?? "";
}
