const WebSocket = require('ws'); // Import the 'ws' WebSocket library
const express = require('express'); // Express for serving static files
const path = require('path');

// Initialize Express app
const app = express();
const port = 3000;

// Serve static files (e.g., index.html, main.js, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Create WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// When a new WebSocket connection is made
wss.on('connection', (ws) => {
    console.log('New client connected.');

    // When a message is received from the client
    ws.on('message', (message) => {
        console.log('Received message:', message); // Log message to ensure it's being received

        // Parse the message as JSON to ensure proper handling
        try {
            const data = JSON.parse(message); // Parse the incoming JSON message


            if (data.type === 'message' && typeof data.content === 'string'&& data.content && data.username) {
                // Broadcast the text message to all other connected clients
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        console.log('Sending message to another client');
                        client.send(JSON.stringify({
                            type: 'message',
                            content: data.content, // Ensure message content is a string
                           username: data.username
                        }));
                    }
                });
            } else if (data.type === 'file' && data.fileName && data.fileContent) {
                // Broadcast file messages (image or document)
                console.log('Broadcasting file to other clients');
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        console.log('Sending file to another client');
                        client.send(JSON.stringify({
                            type: 'file',
                            //content:data.content,
                            fileName: data.fileName,
                            fileContent: data.fileContent, // Send the file content as base64 string
                            fileType: data.fileType,  // Send the file type (image, document, etc.)
                           username: data.username
                        }));
                    }
                });
            } else {
                console.error('Invalid message format received:', data);
            }
        } catch (error) {
            console.error('Error parsing incoming message:', error);
        }
    });

    // When the WebSocket connection is closed
    ws.on('close', () => {
        console.log('Client disconnected.');
    });

    // Handle WebSocket errors
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Handle HTTP upgrades for WebSocket connections
app.server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Upgrade the HTTP server to handle WebSocket connections
app.server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});


