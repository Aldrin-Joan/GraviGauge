const axios = require('axios');
const https = require('https');

const SERVER_URL = 'https://127.0.0.1:50069/exa.language_server_pb.LanguageServerService/GetUserStatus';

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

async function checkApi() {
    try {
        console.log(`Fetching from ${SERVER_URL}...`);

        const payload = {
            metadata: {
                ideName: "antigravity",
                ideVersion: "1.16.5",
                extensionName: "antigravity",
                locale: "en",
                apiKey: "ya29.a0AUMWg_KnjcQxiUBWlkNEKhE7-4Ns-6TB8zUNNng7_Cv5A79YAdHl3DQ0qUD2BXAF2MmbWjHLXEFI0r9MCW4haFCrTx7a416Xhw934kfydaI8LXZz74RlGnknMBsX8Ni_GKipKd3qDbxdPnt7t0AYLJu15PZ28bOVJBCaa3UdBEApK5dLASHyfemjbv9iDxUj4on3s9Gx-sqoeQaCgYKAdISARMSFQHGX2MiTPr8KkEG3PNDEYsREHtFvQ0213"
            }
        };

        const response = await axios.post(SERVER_URL, payload, {
            httpsAgent,
            headers: {
                'Content-Type': 'application/json',
                'Connect-Protocol-Version': '1',
                'X-Codeium-Csrf-Token': '35e28d50-5c3e-47bb-8eb8-173906b41633',
                'Origin': 'vscode-file://vscode-app'
            }
        });

        const fs = require('fs');
        fs.writeFileSync('debug_output.json', JSON.stringify(response.data, null, 2));
        console.log('Response saved to debug_output.json');

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            const fs = require('fs');
            fs.writeFileSync('debug_error.json', JSON.stringify(error.response.data, null, 2));
        }
    }
}

checkApi();
