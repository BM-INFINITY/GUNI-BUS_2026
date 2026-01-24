const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/driver/scan',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log(`Testing POST http://${options.hostname}:${options.port}${options.path}...`);

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('BODY:', data);
        if (res.statusCode === 401) {
            console.log('✅ SUCCESS: Endpoint found (401 Expected without token)');
        } else if (res.statusCode === 200) {
            console.log('✅ SUCCESS: Endpoint found (200 OK)');
        } else if (res.statusCode === 404) {
            console.log('❌ FAILURE: Endpoint NOT found (404)');
        } else {
            console.log(`⚠️ UNEXPECTED STATUS: ${res.statusCode}`);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ ERROR: problem with request: ${e.message}`);
});

req.write(JSON.stringify({ qrData: 'test' }));
req.end();
