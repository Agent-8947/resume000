const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Basic .env parser
try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
} catch (err) {
    console.error('Error loading .env file:', err);
}

// Configuration
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID_HERE';

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/contact') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { name, email, message } = JSON.parse(body);

                if (!name || !email || !message) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing fields' }));
                    return;
                }

                const text = `📬 *New Form Submission*\n\n👤 *Name:* ${name}\n📧 *Email:* ${email}\n💬 *Message:* ${message}`;

                const telegramData = JSON.stringify({
                    chat_id: CHAT_ID,
                    text: text,
                    parse_mode: 'Markdown'
                });

                const options = {
                    hostname: 'api.telegram.org',
                    port: 443,
                    path: `/bot${BOT_TOKEN}/sendMessage`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': telegramData.length
                    }
                };

                const telegramReq = https.request(options, (telegramRes) => {
                    let telegramResponseData = '';
                    telegramRes.on('data', d => {
                        telegramResponseData += d;
                    });
                    telegramRes.on('end', () => {
                        res.writeHead(telegramRes.statusCode, { 'Content-Type': 'application/json' });
                        res.end(telegramResponseData);
                    });
                });

                telegramReq.on('error', (e) => {
                    console.error(e);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal Server Error' }));
                });

                telegramReq.write(telegramData);
                telegramReq.end();

            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Telegram Bot Token: ${BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE' ? 'NOT SET' : 'SET'}`);
    console.log(`Telegram Chat ID: ${CHAT_ID === 'YOUR_CHAT_ID_HERE' ? 'NOT SET' : 'SET'}`);
});
