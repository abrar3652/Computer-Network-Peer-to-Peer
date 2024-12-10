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

// Keep track of all connected peers, storing both ID and name
let peers = []; // Store an array of peer objects { peerId, peerName, ws }

// When a new WebSocket connection is made
wss.on('connection', (ws) => {
    console.log('New client connected.');

    // Generate a unique peer ID for this new connection
    const peerId = `peer-${Date.now()}`; // Simple unique peer ID using timestamp
    
    // Add the peer to the peers list
    
    // When a message is received from the client
    ws.on('message', (message) => {
        console.log('Received message:', message); // Log message to ensure it's being received
        
        // Parse the message as JSON to ensure proper handling
        try {
            const data = JSON.parse(message); // Parse the incoming JSON message
            
            // Handle the event when a peer joins and sends their name
            if (data.type === 'join-peer') {
                const newPeer = { peerId, peerName:data.peerName, ws }; // Default peer name based on ID
                peers.push(newPeer);
                console.log("peer name received");
                //const peerName = data.peerName || newPeer.peerName; // Use peer's provided name or default
                
                // Update the peer's name in the peers array
                // newPeer.peerName = peerName;

                console.log("1. peer name send to all",data.type);
                // Broadcast the new peer to all connected clients
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'new-peer',
                            peerId: newPeer.peerId,
                            peerName: newPeer.peerName
                        }));
                        console.log("2. peer name send to all");
                    }
                });
                console.log("3. peer name send to all");
                // console.log("2. peer name send to all");
                
                
                // //Send the new peer's ID and name back to the joining peer
                // ws.send(JSON.stringify({
                //     type: 'new-peer',
                //     peerId: newPeer.peerId,
                //     peerName: newPeer.peerName,
                // }));
                // console.log("peer name send to all");
            }

            // Handle a chat message from a peer
            if (data.type === 'message' && typeof data.content === 'string' && data.content && data.username) {
                // Broadcast the text message to all other connected clients
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        console.log('Sending message to another client');
                        client.send(JSON.stringify({
                            type: 'message',
                            content: data.content, // Ensure message content is a string
                            username: data.username
                        }));
                        console.log("4a. message get.");
                    }
                        console.log("4b. message get.");

                });
            }

            // Handle file message (e.g., image or document)
            if (data.type === 'file' && data.fileName && data.fileContent) {
                // Broadcast file messages (image or document)
                console.log('Broadcasting file to other clients');
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        console.log('Sending file to another client');
                        client.send(JSON.stringify({
                            type: 'file',
                            fileName: data.fileName,
                            fileContent: data.fileContent, // Send the file content as base64 string
                            fileType: data.fileType,  // Send the file type (image, document, etc.)
                            username: data.username
                        }));
                    }
                });
            }

        } catch (error) {
            console.error('Error parsing incoming message:', error);
        }
    });

    // When the WebSocket connection is closed
    ws.on('close', () => {
        console.log('Client disconnected.');

        // Remove the disconnected peer from the peers array
        peers = peers.filter(peer => peer.ws !== ws);

        // Notify all other clients that this peer has disconnected
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'peer-disconnected',
                    peerId: newPeer.peerId,
                    peerName: newPeer.peerName
                }));
            }
        });
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
