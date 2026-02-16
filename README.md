# GraviGauge

A lightweight VS Code extension that monitors your AI model quotas from the local Antigravity server in real-time.

## Features

- **Side Bar Dashboard**: A rich, visual dashboard in the Activity Bar showing progress bars for all your models.
- **Real-Time Usage**: Displays your lowest available quota percentage directly in the status bar.
- **Detailed Tooltip**: Hover over the status bar item to see a complete list of all models.
- **Auto-Refresh**: Automatically fetches new data every 60 seconds.
- **Manual Refresh**: Click the status bar item or the "Refresh Now" button in the dashboard to force an update.

## Requirements

- **Antigravity AI Application**: You must have the local Antigravity application (IDE/Server) running on your machine.
    - The extension automatically detects the running process and connects to it using the active session token.

## Usage

1.  Make sure Antigravity is running.
2.  Install this extension.
3.  **Zero Configuration**: No API keys or port settings are required.
4.  **Activity Bar**: Click the GraviGauge icon in the left Activity Bar to view the full **Quota Dashboard**.
5.  **Status Bar**: Look for the rocket icon `$(rocket)` in the bottom-right.
    - **Green/White**: Healthy quota.
    - **Red**: Low quota (< 20%) or critical status.

## Troubleshooting

- **"No Connection"**:
    - Ensure Antigravity is running.
    - The extension uses a PowerShell script to find the process. Ensure PowerShell is available on your system.
- **"0%" Models**:
    - This means the API is returning no remaining quota for this model.
- **"Self-signed Certificate" Errors**:
    - The extension is configured to bypass local SSL errors solely for `127.0.0.1`.

## Release Notes

### 1.2.0
- **New Feature**: Added a dedicated **Side Bar Dashboard** with visual progress bars for all models.
- **UI Update**: Improved status bar coloring logic.

### 1.1.0
- **Dynamic Port Findings**: Automatically finds the Antigravity server port.
- **Zero Config**: No longer requires manual API Key setup. Authenticates using the active session token.
- Support for `GetUserStatus` API to show all available models.
- Handling for undefined/zero quotas.

### 1.0.0
- Initial release.
- Support for `GetUserStatus` API to show all available models.
- Handling for undefined/zero quotas.
