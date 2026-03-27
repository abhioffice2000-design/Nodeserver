import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Create HTTP server (required for Socket.IO)
const server = http.createServer(app);

// 🔹 Initialize Socket.IO (:contentReference[oaicite:0]{index=0})
const io = new Server(server, {
    cors: {
        origin: "*", // restrict in production
    },
});

// 🔹 Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log("Body:", req.body);

    // Basic validation for POST
    if (req.method === "POST" && !req.body.type) {
        return res.status(400).json({ error: "Event type is required" });
    }

    next();
});

// 🔹 Serve static Angular files
app.use(express.static(path.join(__dirname, 'public')));

// 🔌 Socket connection
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// 🔹 Event Trigger API
app.post("/notify", (req, res) => {
    const { type, data } = req.body;

    switch (type) {
        case "LOGIN":
            io.emit("userLogin", data);
            break;

        case "LOGOUT":
            io.emit("userLogout", data);
            break;

        case "CANDIDATE_APPLIED":
            io.emit("candidateApplied", data);
            break;

        default:
            return res.status(400).json({ error: "Invalid event type" });
    }

    res.json({ message: "Event broadcasted successfully" });
});

// 🔹 Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🚀 Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
   
});