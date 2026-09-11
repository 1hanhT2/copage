export async function testConnection(config) {
    if (!config.apiKey && config.provider === "openrouter") {
        return { success: false, message: "API Key is required for OpenRouter." };
    }
    const baseUrl = config.baseUrl.replace(/\/$/, "");
    const url = `${baseUrl}/chat/completions`;
    const headers = {
        "Content-Type": "application/json"
    };
    if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
    }
    if (config.provider === "openrouter") {
        headers["HTTP-Referer"] = "https://github.com/1hanhT2/copage";
        headers["X-Title"] = "Copage Inspector";
    }
    try {
        const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({
                model: config.model,
                messages: [{ role: "user", content: "Hi" }],
                max_tokens: 5
            })
        });
        if (!res.ok) {
            const errBody = await res.text().catch(() => "");
            return { success: false, message: `HTTP ${res.status}: ${errBody || res.statusText}` };
        }
        const data = await res.json();
        return {
            success: true,
            message: `Connection successful! (${data.model || config.model})`
        };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, message: `Network Error: ${msg}` };
    }
}
export async function streamCompletion(config, messages, onChunk) {
    const baseUrl = config.baseUrl.replace(/\/$/, "");
    const url = `${baseUrl}/chat/completions`;
    const headers = {
        "Content-Type": "application/json"
    };
    if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
    }
    if (config.provider === "openrouter") {
        headers["HTTP-Referer"] = "https://github.com/1hanhT2/copage";
        headers["X-Title"] = "Copage Inspector";
    }
    const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
            model: config.model,
            messages,
            stream: true
        })
    });
    if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`LLM Error ${response.status}: ${errText || response.statusText}`);
    }
    if (!response.body) {
        throw new Error("No response body received from provider.");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";
    let buffer = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done)
            break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:"))
                continue;
            const dataStr = trimmed.slice(5).trim();
            if (dataStr === "[DONE]")
                continue;
            try {
                const json = JSON.parse(dataStr);
                const delta = json.choices?.[0]?.delta?.content || "";
                if (delta) {
                    accumulated += delta;
                    onChunk(delta);
                }
            }
            catch { }
        }
    }
    return accumulated;
}
