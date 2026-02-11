import * as server from "expo-http-server";
import { Platform } from "react-native";
import * as Network from "expo-network";
import { logger } from "./logger";

const log = logger.withContext("ConfigServer");
const PORT = 19280;

let isRunning = false;
let onConfigReceived: ((config: ProviderConfig) => void) | null = null;

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
}

const CONFIG_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Avatar — Provider Setup</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 4px;
    }
    .subtitle {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 28px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 15px;
      color: #1f2937;
      margin-bottom: 20px;
      transition: border-color 0.2s;
      outline: none;
    }
    input:focus { border-color: #667eea; }
    input::placeholder { color: #9ca3af; }
    .presets {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 24px;
    }
    .preset-btn {
      padding: 6px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      background: #f9fafb;
      font-size: 13px;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;
    }
    .preset-btn:hover { background: #667eea; color: white; border-color: #667eea; }
    .submit-btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .submit-btn:hover { opacity: 0.9; }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .success {
      text-align: center;
      padding: 40px 20px;
    }
    .success-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .success h2 { color: #059669; margin-bottom: 8px; }
    .success p { color: #6b7280; font-size: 14px; }
    .security-note {
      margin-top: 24px;
      padding: 12px 16px;
      background: #f0f9ff;
      border-radius: 10px;
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="card">
    <div id="form-view">
      <h1>🤖 Avatar</h1>
      <p class="subtitle">Configure your AI provider from the comfort of your keyboard.</p>

      <label>Quick Select</label>
      <div class="presets">
        <button class="preset-btn" onclick="applyPreset('OpenAI','https://api.openai.com/v1')">OpenAI</button>
        <button class="preset-btn" onclick="applyPreset('Anthropic','https://api.anthropic.com/v1')">Anthropic</button>
        <button class="preset-btn" onclick="applyPreset('OpenRouter','https://openrouter.ai/api/v1')">OpenRouter</button>
        <button class="preset-btn" onclick="applyPreset('DeepSeek','https://api.deepseek.com/v1')">DeepSeek</button>
        <button class="preset-btn" onclick="applyPreset('Groq','https://api.groq.com/openai/v1')">Groq</button>
        <button class="preset-btn" onclick="applyPreset('Together','https://api.together.xyz/v1')">Together</button>
      </div>

      <label>Provider Name</label>
      <input type="text" id="name" placeholder="e.g. OpenRouter" />

      <label>Base URL</label>
      <input type="url" id="baseUrl" placeholder="https://api.example.com/v1" />

      <label>API Key</label>
      <input type="password" id="apiKey" placeholder="sk-..." />

      <button class="submit-btn" id="submitBtn" onclick="submitConfig()">Send to Avatar App</button>

      <div class="security-note">
        🔒 Your API key is sent directly to your phone over the local network. It never leaves your devices.
      </div>
    </div>

    <div id="success-view" class="success hidden">
      <div class="success-icon">✅</div>
      <h2>Configuration Sent!</h2>
      <p>Check your Avatar app — the provider should appear in your settings.</p>
      <p style="margin-top:12px;font-size:13px;color:#9ca3af;">You can close this page now.</p>
    </div>
  </div>

  <script>
    function applyPreset(name, url) {
      document.getElementById('name').value = name;
      document.getElementById('baseUrl').value = url;
      document.getElementById('apiKey').focus();
    }

    async function submitConfig() {
      const name = document.getElementById('name').value.trim();
      const baseUrl = document.getElementById('baseUrl').value.trim();
      const apiKey = document.getElementById('apiKey').value.trim();

      if (!name || !baseUrl || !apiKey) {
        alert('All fields are required.');
        return;
      }

      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.textContent = 'Sending...';

      try {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, baseUrl, apiKey }),
        });
        if (res.ok) {
          document.getElementById('form-view').classList.add('hidden');
          document.getElementById('success-view').classList.remove('hidden');
        } else {
          const data = await res.json();
          alert(data.error || 'Failed to send configuration.');
          btn.disabled = false;
          btn.textContent = 'Send to Avatar App';
        }
      } catch (err) {
        alert('Connection failed. Make sure you are on the same network as your phone.');
        btn.disabled = false;
        btn.textContent = 'Send to Avatar App';
      }
    }
  </script>
</body>
</html>`;

export async function startConfigServer(
  callback: (config: ProviderConfig) => void,
): Promise<string> {
  if (isRunning) {
    const ip = await getLocalIP();
    return `http://${ip}:${PORT}`;
  }

  onConfigReceived = callback;

  server.setup(PORT, (event) => {
    log.info(`Server status: ${event.status} - ${event.message}`);
  });

  server.route("/", "GET", async () => ({
    statusCode: 200,
    contentType: "text/html",
    body: CONFIG_PAGE_HTML,
  }));

  server.route("/api/config", "POST", async (request) => {
    try {
      const config: ProviderConfig = JSON.parse(request.body);
      if (!config.name || !config.baseUrl || !config.apiKey) {
        return {
          statusCode: 400,
          contentType: "application/json",
          body: JSON.stringify({ error: "All fields are required" }),
        };
      }
      onConfigReceived?.(config);
      return {
        statusCode: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      };
    } catch {
      return {
        statusCode: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "Invalid JSON" }),
      };
    }
  });

  // CORS preflight
  server.route("/api/config", "OPTIONS", async () => ({
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: "",
  }));

  server.start();
  isRunning = true;

  const ip = await getLocalIP();
  const url = `http://${ip}:${PORT}`;
  log.info(`Config server started at ${url}`);
  return url;
}

export function stopConfigServer() {
  if (!isRunning) return;
  server.stop();
  isRunning = false;
  onConfigReceived = null;
  log.info("Config server stopped");
}

async function getLocalIP(): Promise<string> {
  try {
    const ip = await Network.getIpAddressAsync();
    return ip;
  } catch {
    return "localhost";
  }
}
