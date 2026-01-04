const https = require('https');

exports.handler = async function (event, context) {
    // Only allow POST
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { name, email, message } = JSON.parse(event.body);

        if (!name || !email || !message) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
        }

        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
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
                'Content-Length': Buffer.byteLength(telegramData)
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let responseBody = '';
                res.on('data', (chunk) => {
                    responseBody += chunk;
                });
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        body: responseBody
                    });
                });
            });

            req.on('error', (error) => {
                console.error(error);
                resolve({
                    statusCode: 500,
                    body: JSON.stringify({ error: 'Failed to connect to Telegram' })
                });
            });

            req.write(telegramData);
            req.end();
        });

    } catch (error) {
        console.error(error);
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }
};
