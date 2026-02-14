import * as vscode from 'vscode';
import axios from 'axios';
import * as https from 'https';

// 1. Interfaces for Type Safety
interface QuotaInfo {
    remainingFraction: number; // e.g., 0.8 for 80%
    resetTime: string;
}

interface ModelOrAlias {
    model: string;
}

interface ModelConfig {
    label: string; // e.g., "Gemini 3 Pro (Low)"
    modelOrAlias: ModelOrAlias;
    quotaInfo?: QuotaInfo;
    allowedTiers?: string[];
}

interface UserStatus {
    cascadeModelConfigData?: {
        clientModelConfigs: ModelConfig[];
    }
}

interface ApiResponse {
    userStatus: UserStatus;
}

// 2. Global State
let myStatusBarItem: vscode.StatusBarItem;
const SERVER_URL = 'https://127.0.0.1:50069/exa.language_server_pb.LanguageServerService/GetUserStatus';

// 3. SSL Agent to ignore self-signed cert errors on localhost
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

export function activate(context: vscode.ExtensionContext) {
    console.log('GraviGauge is active!');

    // Create Status Bar Item
    myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    myStatusBarItem.command = 'gravigauge.refresh'; // Make clickable
    context.subscriptions.push(myStatusBarItem);
    myStatusBarItem.show();

    // Register Refresh Command
    const refreshCmd = vscode.commands.registerCommand('gravigauge.refresh', async () => {
        await updateQuota();
        vscode.window.showInformationMessage('GraviGauge Refreshed');
    });
    context.subscriptions.push(refreshCmd);

    // Initial Fetch & Interval (Every 60 seconds)
    updateQuota();
    setInterval(updateQuota, 60000);
}

async function updateQuota() {
    try {
        console.log(`Fetching from ${SERVER_URL}...`);

        // 4. Fetch Data
        // Get credentials from Settings
        const config = vscode.workspace.getConfiguration('gravigauge');
        const apiKey = config.get<string>('apiKey') || '';
        const csrfToken = config.get<string>('csrfToken') || '';

        if (!apiKey || !csrfToken) {
            myStatusBarItem.text = '$(key) Missing Keys';
            myStatusBarItem.tooltip = 'Please set gravigauge.apiKey and gravigauge.csrfToken in VS Code Settings.';
            return;
        }

        // Payload key for auth
        const payload = {
            metadata: {
                ideName: "gravigauge",
                ideVersion: "1.0.0",
                extensionName: "gravigauge",
                locale: "en",
                apiKey: apiKey
            }
        };

        const response = await axios.post<ApiResponse>(SERVER_URL, payload, {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                'Connect-Protocol-Version': '1',
                'X-Codeium-Csrf-Token': csrfToken,
                'Origin': 'vscode-file://vscode-app'
            }
        });

        // Parse new response structure: userStatus -> cascadeModelConfigData -> clientModelConfigs
        const configs = response.data?.userStatus?.cascadeModelConfigData?.clientModelConfigs;

        console.log('Raw Configs:', JSON.stringify(configs, null, 2)); // Debugging

        if (!configs || configs.length === 0) {
            myStatusBarItem.text = '$(warning) No Models';
            return;
        }

        // 5. Calculate Status
        let lowestPercentage = 100;
        const md = new vscode.MarkdownString();
        md.appendMarkdown(`**GraviGauge Status**\n\n---\n`);

        for (const config of configs) {
            const label = config.label;

            // Treat undefined remainingFraction as 0% (Not Available / No Quota)
            const rawFraction = config.quotaInfo?.remainingFraction;
            const percent = rawFraction !== undefined ? Math.round(rawFraction * 100) : 0;

            if (percent < lowestPercentage) lowestPercentage = percent;

            // Icon logic: Check (>20%), Alert (<=20% or 0)
            const icon = percent > 20 ? '$(check)' : '$(alert)';

            md.appendMarkdown(`${icon} **${label}**: ${percent}%\n\n`);
        }

        md.appendMarkdown(`---\n$(sync) Click to refresh`);
        md.isTrusted = true;

        // 6. Update UI
        // Color Red if low (< 20%)
        if (lowestPercentage <= 20) {
            myStatusBarItem.text = `$(alert) ${lowestPercentage}%`;
            myStatusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        } else {
            // Normal state
            myStatusBarItem.text = `$(rocket) ${lowestPercentage}%`;
            myStatusBarItem.backgroundColor = undefined;
        }

        myStatusBarItem.tooltip = md;

    } catch (error: any) {
        console.error('Quota Fetch Error:', error);
        myStatusBarItem.text = '$(error) Conn Error';

        const md = new vscode.MarkdownString();
        md.appendMarkdown(`**Error Fetching Quota**\n\n`);
        md.appendMarkdown(`Could not connect to:\n\`${SERVER_URL}\`\n\n`);
        md.appendMarkdown(`Error: \`${error.message}\`\n\n`);
        md.appendMarkdown(`*Make sure Antigravity IS RUNNING and the port hasn't changed.*`);
        myStatusBarItem.tooltip = md;
    }
}

export function deactivate() { }
