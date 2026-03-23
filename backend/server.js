require('dotenv').config();
const express = require('express');
const path = require('path');
const Ably = require('ably');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

const CHANNEL_NAME = process.env.ABLY_CHANNEL_NAME

// ── Parse API key into name + secret (format: "<keyName>:<keySecret>") ────────
const [keyName, keySecret] = (process.env.ABLY_API_KEY || '').split(':');
if (!keyName || !keySecret) {
  console.error('ABLY_API_KEY must be in the format "<keyName>:<keySecret>"');
  process.exit(1);
}

// ── Ably Realtime client (server-side, basic auth is fine here) ───────────────
const ably = new Ably.Realtime({ key: process.env.ABLY_API_KEY, clientId: 'demo-server' });

ably.connection.on('connected', () => {
  console.log('Ably connected');
});

ably.connection.on('failed', () => {
  console.error('Ably connection failed — check your ABLY_API_KEY in .env');
});

const channel = ably.channels.get(process.env.ABLY_CHANNEL_NAME || 'main');

// ── Express setup ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));


// ── JWT token endpoint — issues short-lived Ably JWTs to browser clients ──────
// The client SDK calls this automatically on connect and before token expiry.
app.get('/api/ably-token', (req, res) => {
  const channelName = process.env.ABLY_CHANNEL_NAME || 'main';
  const clientId = req.query.clientId || `client-${Date.now()}`;

  const ablyJwt = jwt.sign(
    {
      'x-ably-clientId': clientId,
      // Full rights on the configured channel
      'x-ably-capability': JSON.stringify({
        [channelName]: ['publish', 'subscribe', 'history', 'presence', 'channel-metadata'],
      }),
    },
    keySecret,
    {
      algorithm: 'HS256',
      keyid: keyName,
      expiresIn: '2h',
    }
  );

  // Return the JWT as plain text — the Ably SDK expects a string, not JSON
  res.setHeader('Content-Type', 'text/plain');
  res.send(ablyJwt);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



//. Mock more connections
const CONNECTION_COUNT = 5;

async function createConnections(count = CONNECTION_COUNT) {
  console.log(`Creating ${count} Ably connections...`);
  const clients = [];

  for (let i = 1; i <= count; i++) {
    const clientId = `test-user-${i}-${Math.random().toString(36).slice(2, 7)}`;

    const client = new Ably.Realtime({
      key: process.env.ABLY_API_KEY,
      clientId,
    });

    await new Promise((resolve, reject) => {
      client.connection.once('connected', () => {
        console.log(`✓ Connection ${i + 1} established (clientId: ${clientId})`);
        resolve();
      });
      client.connection.once('failed', reject);
    });

    // Subscribe to the main channel
    const channel = client.channels.get(CHANNEL_NAME);
    await channel.presence.enter();

    await channel.subscribe((msg) => {
      console.log(`[${clientId}] message on '${CHANNEL_NAME}': ${msg.name}`, msg.data);
    });
    console.log(`  └─ subscribed to '${CHANNEL_NAME}'`);

    clients.push({ client, channel, clientId });

  }

  console.log(`All ${count} connections live. Closing in 30s...`);

  // Keep them alive for 30 seconds then clean up
  setTimeout(() => {
    clients.forEach((c, i) => {
      c.client.close();
      console.log(`✗ Connection ${i + 1} closed`);
    });
  }, 20_000);

  return clients;
}

app.get('/api/mock-connections', async (req, res) => {
  const count = parseInt(req.query.count ?? '5', 10);

  try {

    const members = await channel.presence.get();
    const currentCount = members.length;
    const CAP = 30;

    if (currentCount >= CAP) {
      return res.status(429).json({
        ok: false,
        error: `Presence cap reached: ${currentCount}/${CAP} members already connected`
      });
    }

    await createConnections(count);
    res.json({ ok: true, connections: count });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});




// ── Get channel metadata via REST to determine oocupancy ─────────────────────────────────────────────
app.get('/api/channel-metadata', async (req, res) => {
  try {
    const response = await fetch(
      `https://rest.ably.io/channels/${encodeURIComponent(CHANNEL_NAME)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(process.env.ABLY_API_KEY).toString('base64')}`,
        },
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





app.get('/api/silent-connection', async (req, res) => {
  const clientId = `silent-user-${Math.random().toString(36).slice(2, 7)}`;

  const client = new Ably.Realtime({
    key: process.env.ABLY_API_KEY,
    clientId,
  });

  await new Promise((resolve, reject) => {
    client.connection.once('connected', resolve);
    client.connection.once('failed', reject);
  });

  // Subscribe to channel but deliberately skip presence.enter()
  const silentChannel = client.channels.get(CHANNEL_NAME);
  await silentChannel.attach();

  console.log(`Silent connection established: ${clientId}`);

  // Clean up after 20s to match mock connection behaviour
  setTimeout(() => {
    client.close();
    console.log(`Silent connection closed: ${clientId}`);
  }, 20_000);

  res.json({ ok: true, clientId });
});