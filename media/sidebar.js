
const vscode = acquireVsCodeApi();

// Global state to hold intervals so we can clear them on update
let intervals = [];

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
        case 'updateData':
            updateUI(message.configs, message.planInfo);
            break;
    }
});

function formatTimeRemaining(isoString) {
    if (!isoString) return '';
    const resetTime = new Date(isoString);
    const now = new Date();
    const diffMs = resetTime - now;

    if (diffMs <= 0) return 'Resetted';

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHrs > 0) {
        return `${diffHrs}h ${diffMins}m`;
    } else {
        return `${diffMins}m`;
    }
}

function updateUI(configs, planInfo) {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';

    // Clear existing intervals
    intervals.forEach(clearInterval);
    intervals = [];

    // 1. Display Plan Info
    if (planInfo && planInfo.planName) {
        const planDiv = document.createElement('div');
        planDiv.className = 'plan-info';
        planDiv.innerHTML = `
            <span class="plan-label">Current Plan:</span>
            <span class="plan-name">${planInfo.planName}</span>
        `;
        container.appendChild(planDiv);
    }

    if (!configs || configs.length === 0) {
        const msg = document.createElement('div');
        msg.className = 'no-data';
        msg.textContent = 'No data available. Attempting to connect...';
        container.appendChild(msg);
        return;
    }

    // 2. Display Models
    configs.forEach(config => {
        // Extract Data
        const name = config.label || config.modelOrAlias?.model || 'Unknown';
        const rawQuota = config.quotaInfo?.remainingFraction;
        const resetTime = config.quotaInfo?.resetTime;
        const percent = rawQuota !== undefined ? Math.round(rawQuota * 100) : 0;

        // Determine Color Class
        let colorClass = 'high-quota';
        if (percent <= 20) colorClass = 'low-quota';
        else if (percent <= 50) colorClass = 'medium-quota';

        // Create Card HTML
        const card = document.createElement('div');
        card.className = 'card';

        const resetText = formatTimeRemaining(resetTime);
        const resetHtml = resetText ? `<div class="reset-timer">Resets in: <span class="time-val">${resetText}</span></div>` : '';

        card.innerHTML = `
            <div class="header">
                <span class="model-name" title="${name}">${name}</span>
                <span class="percentage">${percent}%</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar ${colorClass}" style="width: ${percent}%"></div>
            </div>
            ${resetHtml}
        `;
        container.appendChild(card);
    });
}

document.getElementById('refresh-btn').addEventListener('click', () => {
    vscode.postMessage({ command: 'refresh' });
});
