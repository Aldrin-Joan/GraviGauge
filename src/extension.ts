import * as vscode from 'vscode';
import axios from 'axios';
import * as https from 'https';
import * as cp from 'child_process';
import * as path from 'path';

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

interface ConnectionInfo {
    pid: number;
    token: string;
    port: number;
}

// 2. Global State
let myStatusBarItem: vscode.StatusBarItem;
let cachedConnection: ConnectionInfo | null = null;

// 3. SSL Agent to ignore self-signed cert errors on localhost
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

export function activate(context: vscode.ExtensionContext) {
    console.log('Antigravity Quota Monitor is active!');

    // Create Status Bar Item
    myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    myStatusBarItem.command = 'antigravity-quota.refresh'; // Make clickable
    context.subscriptions.push(myStatusBarItem);
    myStatusBarItem.show();

    // Register Refresh Command
    const refreshCmd = vscode.commands.registerCommand('antigravity-quota.refresh', async () => {
        myStatusBarItem.text = '$(sync~spin) Refreshing...';
        await updateQuota(context.extensionPath);
    });
    context.subscriptions.push(refreshCmd);

    // Initial Fetch & Interval (Every 60 seconds)
    updateQuota(context.extensionPath);
    setInterval(() => updateQuota(context.extensionPath), 60000);
}

async function findAntigravityConnection(extensionPath: string): Promise<ConnectionInfo | null> {
    // If we have a cached connection, try to verify if it's still good? 
    // For now, let's just re-scan if specific calls fail, OR re-scan every time?
    // Scanning is cheap (PS script). Let's scan every time for robustness against restarts.

    return new Promise((resolve) => {
        const scriptPath = path.join(extensionPath, 'find_antigravity.ps1');
        const command = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;

        console.log('Scanning for Antigravity process...');
        cp.exec(command, async (err, stdout, stderr) => {
            if (err) {
                console.error('PS Error:', err.message);
                resolve(null);
                return;
            }

            try {
                const data = JSON.parse(stdout.trim());
                const { pid, token, ports } = data;

                if (!pid || !token || !ports || ports.length === 0) {
                    console.error('Invalid process data found.');
                    resolve(null);
                    return;
                }

                // Check which port is the API port
                for (const port of ports) {
                    try {
                        const url = `https://127.0.0.1:${port}/exa.language_server_pb.LanguageServerService/GetUserStatus`;
                        // Lightweight check (HEAD or simple POST with bad auth just to check connection?)
                        // actually just try the real call in updateQuota, but here we want to return the valid port.
                        // Let's do a quick ping or returning the first one that connects.

                        // We can just return the candidate ports and let updateQuota try them?
                        // Or we verify here. Let's verify here to return a solid ConnectionInfo.

                        // We simply assume strictly if one works, it's THE one.
                        await axios.post(url, {
                            metadata: {
                                ideName: "antigravity",
                                ideVersion: "1.16.5",
                                extensionName: "antigravity",
                                locale: "en"
                            }
                        }, {
                            httpsAgent,
                            headers: {
                                'Content-Type': 'application/json',
                                'Connect-Protocol-Version': '1',
                                'X-Codeium-Csrf-Token': token,
                                'Origin': 'vscode-file://vscode-app'
                            },
                            timeout: 2000 // Fast fail
                        });

                        // If successful (or even 200 OK), we found it.
                        console.log(`Found active API on port ${port}`);
                        resolve({ pid, token, port: parseInt(port) });
                        return;

                    } catch (e: any) {
                        // ignore conn refused
                    }
                }

                resolve(null);

            } catch (e) {
                console.error('Parse Error:', e);
                resolve(null);
            }
        });
    });
}

async function updateQuota(extensionPath: string) {
    try {
        // 1. Find Connection
        const connection = await findAntigravityConnection(extensionPath);

        if (!connection) {
            myStatusBarItem.text = '$(error) No Connection';
            myStatusBarItem.tooltip = 'Could not find running Antigravity process.';
            return;
        }

        const { port, token } = connection;
        const SERVER_URL = `https://127.0.0.1:${port}/exa.language_server_pb.LanguageServerService/GetUserStatus`;

        console.log(`Fetching from ${SERVER_URL}...`);

        // 2. Fetch Data
        const payload = {
            metadata: {
                ideName: "antigravity",
                ideVersion: "1.16.5",
                extensionName: "antigravity",
                locale: "en"
                // No apiKey required!
            }
        };

        const response = await axios.post<ApiResponse>(SERVER_URL, payload, {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                'Connect-Protocol-Version': '1',
                'X-Codeium-Csrf-Token': token,
                'Origin': 'vscode-file://vscode-app'
            }
        });

        // Parse new response structure: userStatus -> cascadeModelConfigData -> clientModelConfigs
        const configs = response.data?.userStatus?.cascadeModelConfigData?.clientModelConfigs;

        if (!configs || configs.length === 0) {
            myStatusBarItem.text = '$(warning) No Models';
            return;
        }

        // 5. Calculate Status
        let lowestPercentage = 100;
        const md = new vscode.MarkdownString();
        md.appendMarkdown(`**Antigravity Status**\n\n---\n`);

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
        md.appendMarkdown(`Error: \`${error.message}\`\n\n`);
        md.appendMarkdown(`*Make sure Antigravity IS RUNNING.*`);
        myStatusBarItem.tooltip = md;
    }
}

export function deactivate() { }
