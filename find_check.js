const { exec } = require('child_process');
const https = require('https');
const axios = require('axios');

// PowerShell command to find the process
const PS_COMMAND = `Get-CimInstance Win32_Process -Filter "name='language_server_windows_x64.exe'" | Select-Object CommandLine | ConvertTo-Json`;

const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

function findAntigravityProcess() {
    return new Promise((resolve, reject) => {
        console.log('Scanning for Antigravity process...');
        // Execute the PS1 file directly to avoid quoting issues
        exec(`powershell -NoProfile -ExecutionPolicy Bypass -File find_antigravity.ps1`, (error, stdout, stderr) => {
            if (error) {
                console.error('PowerShell Error:', error.message);
                return reject(error);
            }
            if (stderr) {
                console.error('PowerShell Stderr:', stderr);
            }

            try {
                // Parse JSON output
                const output = stdout.trim();
                // Handle case where Output might be empty or single object vs array
                const processes = output ? JSON.parse(output) : [];
                const list = Array.isArray(processes) ? processes : [processes];

                for (const p of list) {
                    const cmd = p.CommandLine || "";
                    if (cmd.includes('--extension_server_port') && cmd.includes('--csrf_token')) {

                        // Extract Port
                        const portMatch = cmd.match(/--extension_server_port[=\s]+(\d+)/);
                        const port = portMatch ? portMatch[1] : null;

                        // Extract CSRF Token
                        const tokenMatch = cmd.match(/--csrf_token[=\s]+([a-f0-9-]+)/i);
                        const token = tokenMatch ? tokenMatch[1] : null;

                        if (port && token) {
                            resolve({ port, token });
                            return;
                        }
                    }
                }
                reject(new Error('Antigravity process found but could not extract Port or Token.'));
            } catch (e) {
                reject(new Error('Failed to parse PowerShell output: ' + e.message));
            }
        });
    });
}

function checkApi(port, token) {
    const url = `https://127.0.0.1:${port}/exa.language_server_pb.LanguageServerService/GetUserStatus`;
    console.log(`\nTesting Connection to: ${url}`);
    console.log(`Using CSRF Token: ${token}`);
    console.log('Attempting request WITHOUT "apiKey"...');

    return axios.post(url, {
        metadata: {
            ideName: "antigravity",
            ideVersion: "1.16.5",
            extensionName: "antigravity",
            locale: "en"
            // Intentionally OMITTING apiKey
        }
    }, {
        httpsAgent,
        headers: {
            'Content-Type': 'application/json',
            'Connect-Protocol-Version': '1',
            'X-Codeium-Csrf-Token': token,
            'Origin': 'vscode-file://vscode-app'
        }
    });
}

// Main execution
(async () => {
    try {
        const { port, token } = await findAntigravityProcess();
        console.log(`✅ Found Antigravity! Port: ${port}, Token: ${token.substring(0, 8)}...`);

        const response = await checkApi(port, token);
        console.log('✅ API Request Successful!');
        console.log('User Name:', response.data.userStatus.name);
        console.log('Conclusion: API Key is NOT required if we have the valid dynamic CSRF token.');

    } catch (err) {
        console.error('❌ Failed:', err.message);
        if (err.response) {
            console.error('API Error Status:', err.response.status);
            console.error('API Error Data:', JSON.stringify(err.response.data, null, 2));
        }
    }
})();
