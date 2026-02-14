# GraviGauge

A lightweight VS Code extension that monitors your AI model quotas from the local Antigravity server in real-time.

## Features

- **Real-Time Usage**: Displays your lowest available quota percentage directly in the status bar.
- **Detailed Tooltip**: Hover over the status bar item to see a complete list of all models, including:
    - **Active Quotas**: Shows exact percentage remaining.
    - **Green Checks**: For healthy quotas (> 20%).
    - **Red Alerts**: For low quotas (<= 20%) or exhausted/unavailable models (0%).
- **Auto-Refresh**: Automatically fetches new data every 60 seconds.
- **Manual Refresh**: Click the status bar item to force an immediate update.

## Requirements

- **Antigravity AI Application**: You must have the local Antigravity application (IDE/Server) running on your machine.
    - The extension connects to the local service (default port `61314`).

## Configuration

To use this extension, you need to provide your Antigravity authentication details in VS Code Settings:

1.  Open VS Code Settings (`Ctrl+,` or `Cmd+,`).
2.  Search for `GraviGauge`.
3.  Enter your:
    - `GraviGauge: Api Key`
    - `GraviGauge: Csrf Token`

## Usage

1.  Make sure Antigravity is running.
2.  Install this extension.
3.  Look for the rocket icon `$(rocket)` in the bottom-right status bar.
    - **Green/White**: Healthy quota.
    - **Red**: Low quota (< 20%) or critical status.
4.  **Hover** to see the full breakdown of all models (Gemini, Claude, GPT-OSS, etc.).
5.  **Click** to refresh the data.

## Troubleshooting

- **"Conn Error" or "No Models"**:
    - Ensure Antigravity is running.
    - The server port might have changed (currently defaults to `61314`).
- **"0%" Models**:
    - This means the API is returning no remaining quota for this model, indicating it is either exhausted or not available on your current tier.
- **"Self-signed Certificate" Errors**:
    - The extension is configured to bypass local SSL errors solely for `127.0.0.1`, which is necessary for the local server communication.

## Release Notes

### 1.0.0
- Initial release.
- Support for `GetUserStatus` API to show all available models.
- Handling for undefined/zero quotas.
