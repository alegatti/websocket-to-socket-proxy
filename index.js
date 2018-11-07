'use strict';
const net = require('net');

const app = require('express')();
require('express-ws')(app);

app.get('/', function (req, res) {
    res.json({ status: true });
});

app.ws('/', function (ws, req) {
    try {
        const { host, port } = req.query;
        if (!host) throw new Error('No parameter "host"');
        if (!port) throw new Error('No parameter "port"');

        const socket = new net.Socket();
        console.log(`Opening socket ${host}:${port}`);
        socket.connect(port, host, _ => ws.send(JSON.stringify({ status: true, connected: true })));
        socket.on('data', data => {
            console.log('data', data);
            ws.send(JSON.stringify({ status: true, data }))
        });
        socket.on('error', error => {
            console.error(error.stack);
            ws.send(JSON.stringify({ status: false, error }));
        });

        ws.on('message', function (msg) {
            const data = JSON.parse(msg);
            // TODO: Handle when the JSON.parse throws an error
            // TODO: Check that data is valid and the 
            if ('Buffer' === data.type)
                return socket.write(Buffer.from(data.data))
            socket.write(data);
        });
        ws.on('close', _ => {
            socket.destroy();
        });
    } catch (err) {
        console.error(err.stack);
        ws.send(JSON.stringify({ status: false, error: err }));
        ws.close();
        if (socket)
            socket.destroy();
    }
});

app.listen(3000);
