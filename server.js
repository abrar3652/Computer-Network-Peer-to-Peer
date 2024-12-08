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
            if (data.type === 'message' && typeof data.content === 'string') {
                // Broadcast the text message to all other connected clients
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        console.log('Sending message to another client');
                        client.send(JSON.stringify({
                            type: 'message',
                            content: data.content, // Ensure message content is a string
                           // username: data.username
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
                           // username: data.username
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



// const WebSocket = require('ws'); // Import the 'ws' WebSocket library
// const express = require('express'); // Express for serving static files
// const path = require('path');

// // Initialize Express app
// const app = express();
// const port = 3000;

// // Serve static files (e.g., index.html, main.js, etc.)
// app.use(express.static(path.join(__dirname, 'public')));

// // Create WebSocket server
// const wss = new WebSocket.Server({ noServer: true });

// // When a new WebSocket connection is made
// wss.on('connection', (ws) => {
//     console.log('New client connected.');

//     // When a message is received from the client
//     ws.on('message', (message) => {
//         console.log('Received message:', message); // Log message to ensure it's being received

//         // Parse the message as JSON to ensure proper handling
//         try {
//             const data = JSON.parse(message); // Parse the incoming JSON message
//             if (data.type === 'message' && typeof data.content === 'string') {
//                 // Broadcast the message to all other connected clients
//                 wss.clients.forEach((client) => {
//                     if (client !== ws && client.readyState === WebSocket.OPEN) {
//                         console.log('Sending message to another client'); // Log to confirm broadcasting
//                         client.send(JSON.stringify({
//                             type: 'message',
//                             content: data.content // Ensure message content is a string
//                         }));
//                     }
//                 });
//             } else if (data.type === 'file' && data.fileName && data.fileContent) {
//                 // Broadcast file messages
//                 wss.clients.forEach((client) => {
//                     if (client !== ws && client.readyState === WebSocket.OPEN) {
//                         console.log('Sending file to another client');
//                         client.send(JSON.stringify({
//                             type: 'file',
//                             fileName: data.fileName,
//                             fileContent: data.fileContent, // Send the file content as base64 string
//                             fileType: data.fileType  // Send the file type (image, document, etc.)
//                         }));
//                     }
//                 });
//             } else {
//                 console.error('Invalid message format received:', data);
//             }
//         } catch (error) {
//             console.error('Error parsing incoming message:', error);
//         }
//     });

//     // When the WebSocket connection is closed
//     ws.on('close', () => {
//         console.log('Client disconnected.');
//     });

//     // Handle WebSocket errors
//     ws.on('error', (error) => {
//         console.error('WebSocket error:', error);
//     });
// });

// // Handle HTTP upgrades for WebSocket connections
// app.server = app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// });

// // Upgrade the HTTP server to handle WebSocket connections
// app.server.on('upgrade', (request, socket, head) => {
//     wss.handleUpgrade(request, socket, head, (ws) => {
//         wss.emit('connection', ws, request);
//     });
// });



// const WebSocket = require('ws'); // Import the 'ws' WebSocket library
// const express = require('express'); // Express for serving static files
// const path = require('path');

// // Initialize Express app
// const app = express();
// const port = 3000;

// // Serve static files (e.g., index.html, main.js, etc.)
// app.use(express.static(path.join(__dirname, 'public')));

// // Create WebSocket server
// const wss = new WebSocket.Server({ noServer: true });

// // When a new WebSocket connection is made
// wss.on('connection', (ws) => {
//     console.log('New client connected.');

//     // When a message is received from the client
//     ws.on('message', (message) => {
//         console.log('Received message:', message); // Log message to ensure it's being received

//         // Parse the message as JSON to ensure proper handling
//         try {
//             const data = JSON.parse(message); // Parse the incoming JSON message
//             if (data.type === 'message' && typeof data.content === 'string') {
//                 // Broadcast the message to all other connected clients
//                 wss.clients.forEach((client) => {
//                     if (client !== ws && client.readyState === WebSocket.OPEN) {
//                         console.log('Sending message to another client'); // Log to confirm broadcasting
//                         client.send(JSON.stringify({
//                             type: 'message',
//                             content: data.content // Ensure message content is a string
//                         }));
//                     }
//                 });
//             }else if (data.type === 'file' && data.fileName && data.fileContent) {
//               // Broadcast file messages
//               wss.clients.forEach((client) => {
//                   if (client !== ws && client.readyState === WebSocket.OPEN) {
//                       console.log('Sending file to another client');
//                       client.send(JSON.stringify({
//                           type: 'file',
//                           fileName: data.fileName,
//                           fileContent: data.fileContent // Send the file content as base64 string
//                       }));
//                   }
//               });
//           } else {
//                 console.error('Invalid message format received:', data);
//             }
//         } catch (error) {
//             console.error('Error parsing incoming message:', error);
//         }
//     });

//     // When the WebSocket connection is closed
//     ws.on('close', () => {
//         console.log('Client disconnected.');
//     });

//     // Handle WebSocket errors
//     ws.on('error', (error) => {
//         console.error('WebSocket error:', error);
//     });
// });

// // Handle HTTP upgrades for WebSocket connections
// app.server = app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// });

// // Upgrade the HTTP server to handle WebSocket connections
// app.server.on('upgrade', (request, socket, head) => {
//     wss.handleUpgrade(request, socket, head, (ws) => {
//         wss.emit('connection', ws, request);
//     });
// });











// ------------------------------------------- last 4 pages

// const express = require('express');
// const http = require('http');
// const WebSocket = require('ws');
// const app = express();
// const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });

// // Serve static files (CSS, JS, HTML)
// app.use(express.static('public'));

// // Store clients (peers)
// let clients = [];

// wss.on('connection', (ws) => {
//     console.log('New peer connected');
    
//     // Assign an ID for each connected peer
//     const peerId = generatePeerId();
//     ws.peerId = peerId;
//     clients.push(ws);

//     // Send initial connection message
//     ws.send(JSON.stringify({ type: 'welcome', peerId }));

//     // Handle incoming messages from clients
//     ws.on('message', (message) => {
//         const data = JSON.parse(message);

//         // Broadcast message to all peers except the sender
//         if (data.type === 'chatMessage') {
//             broadcastMessage(data, ws.peerId);
//         }

//         // Handle "group creation" message
//         if (data.type === 'createGroup') {
//             handleGroupCreation(data, ws);
//         }

//         // Handle peer disconnection
//         ws.on('close', () => {
//             console.log('Peer disconnected');
//             clients = clients.filter(client => client !== ws);
//             broadcastPeerList(); // Update the remaining peers
//         });
//     });

//     // Send the updated list of all connected peers to all clients
//     broadcastPeerList();
// });

// // Function to generate unique peer IDs
// function generatePeerId() {
//     return 'peer-' + Math.floor(Math.random() * 10000);
// }

// // Broadcast message to all clients except sender
// function broadcastMessage(data, senderId) {
//     clients.forEach(client => {
//         if (client.peerId !== senderId) {
//             client.send(JSON.stringify(data));
//         }
//     });
// }

// // Send the updated list of connected peers to all clients
// function broadcastPeerList() {
//     const peerList = clients.map(client => client.peerId);
//     clients.forEach(client => {
//         client.send(JSON.stringify({ type: 'updatePeerList', peers: peerList }));
//     });
// }

// // Handle group creation
// function handleGroupCreation(data, ws) {
//     const selectedPeers = data.selectedPeers;
    
//     // Check if selected peers exist
//     const validPeers = selectedPeers.filter(peer => clients.some(client => client.peerId === peer));

//     if (validPeers.length > 0) {
//         // Create group and send to clients
//         validPeers.forEach(peer => {
//             const groupMessage = {
//                 type: 'groupMessage',
//                 groupId: `group-${generatePeerId()}`,
//                 members: [ws.peerId, ...validPeers]
//             };
//             // Send the group info to the selected peers
//             clients.forEach(client => {
//                 if (client.peerId === peer) {
//                     client.send(JSON.stringify(groupMessage));
//                 }
//             });
//         });

//         // Notify sender that the group was created
//         ws.send(JSON.stringify({ type: 'groupCreated', members: validPeers }));
//     } else {
//         ws.send(JSON.stringify({ type: 'groupCreationFailed', message: 'Invalid peers selected' }));
//     }
// }

// // Start the server
// server.listen(3000, () => {
//     console.log('Server is listening on port 3000');
// });

