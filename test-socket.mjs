import { io } from "socket.io-client";
console.log("Connecting to http://localhost:8000/qr-auth...");
const socket = io('http://localhost:8000/qr-auth', { transports: ['websocket'] });

socket.on('connect', () => {
    console.log("✅ Socket connected! Native ID:", socket.id);
});

socket.on('connected', (data) => {
    console.log("📩 Received 'connected' event from server:", data);
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.log("❌ Connection Error:", err.message);
    process.exit(1);
});

setTimeout(() => {
    console.log("⏳ Timeout reached (5 seconds)");
    process.exit(1);
}, 5000);
