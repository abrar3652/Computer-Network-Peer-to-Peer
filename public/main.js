// WebSocket connection
// const socket = new WebSocket('ws://localhost:3000');  // Connect to the WebSocket server
const socket = new WebSocket('ws://192.168.231.225:3000');  // Connect to the WebSocket server

// Ensure the WebSocket is sending and receiving text
socket.binaryType = 'text'; // We expect text datacmd


// DOM Elements
const usernameForm = document.getElementById('usernameForm');
const chatInterface = document.getElementById('chatInterface');
const startChatButton = document.getElementById('startChatButton');
const usernameInput = document.getElementById('usernameInput');
const usernameDisplay = document.getElementById('usernameDisplay');
const sendButton = document.getElementById('sendButton');
const messageInput = document.getElementById('messageInput');
const fileInput = document.getElementById('fileInput');
const messagesContainer = document.getElementById('messages');
const emojiButton = document.getElementById('emojiButton');
const emojiPicker = document.getElementById('emojiPicker');
const mediaButton = document.getElementById('mediaButton');

const goToPage3Button = document.getElementById('goToPage3');
const goToPage4Button = document.getElementById('goToPage4');

const page3 = document.getElementById('page3');
const backToChatPageButton = document.getElementById('backToChatPage');

const page4 = document.getElementById('page4');
const backToChatPage2Button = document.getElementById('backToChatPage2');


// Event listeners
startChatButton.addEventListener('click', startChat);
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('input', toggleSendButton);
fileInput.addEventListener('change', sendFile);
messageInput.addEventListener('keydown', handleKeyPress);
emojiButton.addEventListener('click', toggleEmojiPicker);
mediaButton.addEventListener('click', openFilePicker);  // Handle file picker click

// List to hold all the connected peers
let peers = [];

let sharedKey;
const passphrase = "your-secure-passphrase"; // Replace with a strong passphrase
generateKey(passphrase).then((key) => {
    sharedKey = key;
});


// Start the chat after user enters their name
chatInterface.style.display = 'none';
function startChat() {

    const enteredUsername = usernameInput.value.trim();
    if (enteredUsername) {
        sessionStorage.setItem('username', enteredUsername);  
        switchToChat(enteredUsername);
    } else {
        alert('Please enter a valid name.');
    }
}

// Add event listener for pressing Enter key
usernameInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        // Prevent default behavior (e.g., form submission if inside a form)
        event.preventDefault();
        
        const username = document.getElementById('usernameInput').value.trim();
        if (username) {
            // Update the chat title with the username
            document.querySelector('#chatInterface h1').textContent = username;
            const peerInfo = {
                type: 'join-peer', // Custom message type for new peer joining
                peerName: username
            };

            socket.send(JSON.stringify(peerInfo)); // Send to server
            console.log("peer name send to server");

        } else {
            alert('Please enter a valid name.');
        }
        // Trigger the start chat function

      startChat();
    }
  });

// When the "Start Chat" button is clicked, Put Peer name on chat header
document.getElementById('startChatButton').addEventListener('click', function() {
    const username = document.getElementById('usernameInput').value.trim();

    if (username) {
        // Update the chat title with the username
        document.querySelector('#chatInterface h1').textContent = username;
        console.log("stimulating peer1");
    } else {
        alert('Please enter a valid name.');
    }
});

// Switch to the chat interface
function switchToChat(username) {
    usernameForm.style.display = 'none';
    chatInterface.style.display = 'block';
    usernameDisplay.textContent = username;
    socket.send(JSON.stringify({ type: 'join', username: username })); // Send join message to the server
}

// Enable the Send button only when there's text in the message input
function toggleSendButton() {
    sendButton.disabled = !messageInput.value.trim();
}

// Function to handle Enter key press
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();  // Prevent the default action (line break)
        sendMessage();
    }
}

    // Navigate to Connected Peers (Page 3)
    goToPage3Button.addEventListener('click', function () {
        chatInterface.style.display = 'none';
        page3.style.display = 'block';

        console.log("peers print");
        
        // Populate the peer list on Page 3
       populatePeerList();
    });

    // Navigate to Dedicated Groups (Page 4)
    goToPage4Button.addEventListener('click', function () {
        chatInterface.style.display = 'none';
        page4.style.display = 'block';
    });

    // Back to Chat Page from Connected Peers (Page 3)
    backToChatPageButton.addEventListener('click', function () {
        page3.style.display = 'none';
        chatInterface.style.display = 'block';
    });

    // Back to Chat Page from Dedicated Groups (Page 4)
    backToChatPage2Button.addEventListener('click', function () {
        page4.style.display = 'none';
        chatInterface.style.display = 'block';
    });

    // // Create Group Button Logic (Page 3)
    // document.getElementById('createGroup').addEventListener('click', function () {
    //     const selectedPeers = [];
    //     const peers = document.querySelectorAll('.peer-item input');
    //     peers.forEach((peer, index) => {
    //         if (peer.checked) {
    //             selectedPeers.push(peer.nextSibling.textContent.trim());
    //         }
    //     });

    //     if (selectedPeers.length > 0) {
    //         alert('Group Created with: ' + selectedPeers.join(', '));
    //     } else {
    //         alert('Please select at least one peer.');
    //     }
    // });



    //----------------------------------------------------------------------
    //----------------------------------------------------------------------

    // Generate a 256-bit key from a passphrase
async function generateKey(passphrase) {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(passphrase),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: encoder.encode("some-random-salt"), // Add a fixed salt (can be random for more security)
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
}

// Encrypt a message
async function encryptMessage(message, key) {
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);

    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Generate a random IV
    const encrypted = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        encodedMessage
    );

    // Return the IV and encrypted data concatenated as a base64 string
    return {
        iv: Array.from(iv), // Store IV separately for decryption
        data: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
    };
}

// Decrypt a message
async function decryptMessage(encryptedData, key) {
    const { iv, data } = encryptedData;

    const encryptedBytes = new Uint8Array(atob(data).split("").map(c => c.charCodeAt(0)));
    const ivBytes = new Uint8Array(iv);

    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: ivBytes
        },
        key,
        encryptedBytes
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

    //----------------------------------------------------------------------
    //----------------------------------------------------------------------

// Function to send a text message
async function sendMessage() {
    const message = messageInput.value.trim();
    const username = sessionStorage.getItem('username');

    if (message && username) {
        // Send message via WebSocket

        displayMessage('You: ' + message);

        // const encryptedMessage = encryptMessage(message);
        const encryptedMessage = await encryptMessage(message, sharedKey);

        socket.send(JSON.stringify({ 
            type: 'message', 
            content: message,
            username: username 
        }));

        messageInput.value = ''; // Clear the input after sending
    }
}

// Function to toggle the emoji picker visibility
function toggleEmojiPicker() {
    emojiPicker.style.display = emojiPicker.style.display === 'block' ? 'none' : 'block';
}

// Function to insert the selected emoji into the message input field
function insertEmoji(emoji) {
    messageInput.value += emoji;  // Append the emoji to the text input
    messageInput.focus();  // Focus back to the input field
    toggleEmojiPicker();  // Hide the emoji picker after selecting an emoji
}

// Function to open the file picker
function openFilePicker() {
    fileInput.click();  // Trigger the file input dialog
}

// Function to display messages in the UI
function displayMessage(message, fileElement = null) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    // Check if the message is sent or received
    const username = sessionStorage.getItem('username');
    const isSender = message.includes(username); // Check if the message is from the current user

    // If the message is from the sender (yourself)
    if (isSender) {
        messageElement.classList.add('sent');
    } else {
        messageElement.classList.add('received');
    }

    // Text message
    if (message) {
        const textElement = document.createElement('div');
        textElement.classList.add('text-message');
        textElement.textContent = message;
        messageElement.appendChild(textElement);
    }

    // If there's an image, display it as part of the message
    if (fileElement) {
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');
        imageContainer.appendChild(fileElement);
        messageElement.appendChild(imageContainer);
    }

        // Append the new message
    messagesContainer.prepend(messageElement);

        // Scroll to the bottom to show the latest message
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to the bottom
}

// Function to handle file input and send the file (including images and documents)
function sendFile() {
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const fileContent = event.target.result; // Base64 encoded string

            // Check if the file is an image or a document
            const isImage = file.type.startsWith('image/');

            // const isDocument = !isImage && (file.type === 'application/pdf' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/vnd.ms-powerpoint' || file.type === 'application/xml');
            const isDocument = file.type !== 'image/' && file.type !== '';

            // Handle image files
            if (isImage) {
                const imageElement = document.createElement('img');
                imageElement.src = fileContent;
                imageElement.alt = file.name;
                imageElement.style.maxWidth = '200px'; // Limit image size
                imageElement.style.maxHeight = '200px';
                displayMessage('You shared an image: ' ,imageElement);
                // displayMessage('' , imageElement);
            }

            // Handle document files (e.g., PDF, DOCX, PPTX)
            else if (isDocument) {
                const docLink = document.createElement('a');
                docLink.href = fileContent;
                docLink.target = '_blank'; // Open in a new tab
                docLink.textContent =  file.name;
                displayMessage('You shared a document: ' , docLink);
            }

            // Send the file as base64 string to the server
            socket.send(JSON.stringify({
                type: 'file',
                fileName: file.name,
                fileContent: fileContent,
                fileType: file.type,  // Send the file type (image, document, etc.)
                username: sessionStorage.getItem('username')
            }));
        };
        reader.readAsDataURL(file); // Read the file as base64 (data URL)
        fileInput.value = ''; // Clear the file input after sending
    }
}

// WebSocket event handlers
socket.onopen = function() {
    console.log('WebSocket connection established.');
};

socket.onmessage = async function(event) {
    try {
        const data = JSON.parse(event.data); // Parse the message as JSON
        console.log("1. message get.");
        // for text handling
        if (data.type === 'message'&& data.content && data.username) {

            console.log("2. message get.");
            // const decryptedMessage = await decryptMessage(data.content, sharedKey);

            displayMessage(data.username + ': ' + data.content); // Display the text message content correctly
        } else if (data.type === 'file'&& data.fileContent) {
            
            // Handle file messages (images and documents)
            if (data.fileContent) {
                const isImage = data.fileType.startsWith('image/');
                // const isDocument = !isImage && (data.fileType === 'application/pdf' || data.fileType === 'application/msword' || data.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || data.fileType === 'application/vnd.ms-powerpoint' || data.fileType === 'application/xml');
                const isDocument = !isImage;
                
                if (isImage) {
                    const imageElement = document.createElement('img');
                    imageElement.src = data.fileContent;
                    imageElement.alt = data.fileName;
                    imageElement.style.maxWidth = '200px'; // Limit image size
                    imageElement.style.maxHeight = '200px';
                    displayMessage(data.username + ' shared an image: ' , imageElement);
                }
                
                if (isDocument) {

                    // Create a document link
                    const docLink = document.createElement('a');
                    docLink.href = data.fileContent;
                    
                    // docLink.textContent = data.username +' shared a document: ' + data.fileName;
                    docLink.textContent =  data.fileName;
                    
                    // Add event listener to handle both open and download
                    docLink.addEventListener('click', function(event) {
                        event.preventDefault();
                        
                        // Open the document in a new tab
                        window.open(data.fileContent, '_blank');
                        
                        // Trigger the download
                        const downloadLink = document.createElement('a');
                        downloadLink.href = data.fileContent;
                        downloadLink.download = data.fileName;
                        downloadLink.click();
                    });
                    
                    displayMessage(data.username + ' shared a document: ' , docLink);
                }
            }
        }
        else if (data.type === 'new-peer') {
            console.log("2. message get.");
            const newPeerId = data.peerId;
            const newPeerName = data.peerName; // Use the actual peer name
            addPeer(newPeerId, newPeerName); // Add new peer to the list
            console.log("peer arrived in main");
        }
        else if (data.type === 'peer-disconnected') {
            const peerId = message.peerId;
            removePeer(peerId); // Remove peer from the list
        }
        console.log("3. message get.");
    } catch (error) {
        console.error('Error parsing message:', error);
    }
};

socket.onclose = function() {
    console.log('WebSocket connection closed.');
};

socket.onerror = function(error) {
    console.error('WebSocket error:', error);
};

// Step 2: Handle connected peers and group creation

// Event Listeners for the buttons
document.getElementById('goToPage3').addEventListener('click', showPage3);
document.getElementById('goToPage4').addEventListener('click', showPage4);
document.getElementById('backToChatPage').addEventListener('click', backToChatPage);
document.getElementById('backToChatPage2').addEventListener('click', backToChatPage);
document.getElementById('createGroupButton').addEventListener('click', createGroupChat);



// Function to add a new peer to the network
function addPeer(peerId, peerName) {
    // Check if the peer already exists in the list to prevent duplicates
    const existingPeer = peers.find(peer => peer.id === peerId);
    if (!existingPeer) {
        // Add the new peer to the list
        peers.push({ id: peerId, name: peerName });
        populatePeerList(); // Re-render the list of peers
        console.log("new peer is here");

    }
}

// Function to remove a peer when they disconnect
function removePeer(peerId) {
    // Find the index of the peer to be removed
    const peerIndex = peers.findIndex(peer => peer.id === peerId);
    
    // If the peer exists, remove them
    if (peerIndex !== -1) {
        peers.splice(peerIndex, 1);
        populatePeerList();
    }
}

// Function to populate the peer list dynamically
function populatePeerList() {
    const peerListContainer = document.getElementById('peer-list');
    peerListContainer.innerHTML = ''; // Clear previous list

    peers.forEach(peer => {
        console.log("peer added in page 4");
        const peerItem = document.createElement('div');
        peerItem.classList.add('peer-item');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `peer-${peer.id}`;
        checkbox.addEventListener('change', handlePeerSelection);

        const peerName = document.createElement('span');
        peerName.setAttribute('for', checkbox.id);
        peerName.textContent = peer.name;

        peerItem.appendChild(checkbox);
        peerItem.appendChild(peerName);
        peerListContainer.appendChild(peerItem);
    });
}

// Handle peer selection
let selectedPeers = [];
function handlePeerSelection(event) {
    const peerId = event.target.id.split('-')[1];
    
    if (event.target.checked) {
        selectedPeers.push(peerId);
    } else {
        selectedPeers = selectedPeers.filter(id => id !== peerId);
    }

    // Enable/disable the "Create Group Chat" button
    const createGroupButton = document.getElementById('createGroupButton');
    createGroupButton.disabled = selectedPeers.length === 0;
}

// // Example function to simulate receiving new peers (this can be replaced with actual server events)
// function simulatePeerConnections() {
//     // Simulate new peer connections every 10 seconds for demonstration purposes
//     setInterval(() => {
//         console.log("peer added");
//         const newPeerId = Math.random().toString(36).substring(7); // Generate a random peer ID
//         const newPeerName = `Peer-${newPeerId}`;
//         addPeer(newPeerId, newPeerName); // Add the new peer to the list
//     }, 10000); // Simulate adding new peers every 10 seconds
// }

// // Simulate a peer disconnecting
// function simulatePeerDisconnections() {
//     setInterval(() => {
//         if (peers.length > 0) {
//             const randomPeer = peers[Math.floor(Math.random() * peers.length)];
//             removePeer(randomPeer.id); // Remove a random peer for simulation
//         }
//     }, 15000); // Simulate removing a peer every 15 seconds
// }

// Function for handling the group chat creation
function createGroupChat() {
    if (selectedPeers.length === 1) {
        // 1-on-1 chat with the selected peer
        const peerName = peers.find(peer => peer.id === Number(selectedPeers[0])).name;
        alert(`Starting 1-on-1 chat with ${peerName}`);
    } else if (selectedPeers.length > 1) {
        // Group chat with multiple selected peers
        const groupName = prompt('Enter a name for the group chat:');
        if (groupName) {
            alert(`Starting group chat: ${groupName} with ${selectedPeers.length} peers`);
        }
    }
}
