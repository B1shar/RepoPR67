const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

// Azure injecte automatiquement le port dans process.env.PORT
const PORT = process.env.PORT || 8080; 

// On utilise /home car c'est le seul dossier persistant et accessible en écriture sur Azure Linux
const FILE = "/home/visits.json";

let lock = false;

function readCounter() {
    try {
        if (!fs.existsSync(FILE)) {
            fs.writeFileSync(FILE, JSON.stringify({ count: 0 }));
        }
        const data = fs.readFileSync(FILE);
        return JSON.parse(data).count;
    } catch (err) {
        console.error("Erreur lecture:", err);
        return 0;
    }
}

function writeCounter(count) {
    try {
        fs.writeFileSync(FILE, JSON.stringify({ count }, null, 2));
    } catch (err) {
        console.error("Erreur écriture:", err);
    }
}

app.get("/", async (req, res) => {
    while (lock) { await new Promise(r => setTimeout(r, 10)); }
    lock = true;
    try {
        let count = readCounter();
        count++;
        writeCounter(count);
        res.send(`
            <h1>Compteur de visites Azure</h1>
            <p><strong>Visites :</strong> ${count}</p>
            <p><strong>Serveur :</strong> ${req.hostname}</p>
        `);
    } finally {
        lock = false;
    }
});

app.listen(PORT, () => {
    console.log(`Le serveur écoute sur le port ${PORT}`);
});