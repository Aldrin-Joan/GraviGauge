
const vscode = acquireVsCodeApi();

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
        case 'updateData':
            updateUI(message.configs);
            break;
    }
});

function updateUI(configs) {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';

    if (!configs || configs.length === 0) {
        container.innerHTML = '<div class="no-data">No data available. Attempting to connect...</div>';
        return;
    }

    configs.forEach(config => {
        // Extract Data
        const name = config.label || config.modelOrAlias?.model || 'Unknown';
        const rawQuota = config.quotaInfo?.remainingFraction;
        const percent = rawQuota !== undefined ? Math.round(rawQuota * 100) : 0;

        // Determine Color Class
        let colorClass = 'high-quota';
        if (percent <= 20) colorClass = 'low-quota';
        else if (percent <= 50) colorClass = 'medium-quota';

        // Create Card HTML
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="header">
                <span class="model-name" title="${name}">${name}</span>
                <span class="percentage">${percent}%</span>
            </div>
            <div class="progress-container">
                <div class="progress-bar ${colorClass}" style="width: ${percent}%"></div>
            </div>
        `;
        container.appendChild(card);
    });
}

document.getElementById('refresh-btn').addEventListener('click', () => {
    vscode.postMessage({ command: 'refresh' });
});
