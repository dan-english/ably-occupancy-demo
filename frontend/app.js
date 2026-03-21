import * as debug from './debug.js';
import * as Ably from 'ably';

// ── Read channel name injected by Vite from .env (VITE_ABLY_CHANNEL_NAME) ────
const channelName =
  document.querySelector('meta[name="ably-channel"]')?.content || 'main';

debug.ably(`Connecting to channel: "${channelName}"`);

// ── Ably Realtime client ──────────────────────────────────────────────────────
const client = new Ably.Realtime({
  authCallback: async (tokenParams, callback) => {
    try {
      const response = await fetch('/api/ably-token');
      if (!response.ok) throw new Error(`Auth request failed: ${response.status}`);
      const token = await response.text();
      callback(null, token);
    } catch (err) {
      debug.error('Failed to fetch Ably token', err);
      callback(err, null);
    }
  },
});

client.connection.on('connected', () => {
  debug.success('Ably connected');
  window.__logToScreen?.('system', 'Ably connected');
});

client.connection.on('failed', () => {
  debug.error('Ably connection failed — check /api/ably-token on the backend');
  window.__logToScreen?.('system', 'Ably connection failed');
});

client.connection.on('disconnected', () => {
  debug.warn('Ably disconnected — will attempt to reconnect automatically');
  window.__logToScreen?.('system', 'Ably disconnected');
});

// ── Subscribe to channel ──────────────────────────────────────────────────────
const channel = client.channels.get(channelName, {
  params: { occupancy: 'metrics.subscribers' },
});

// Regular messages
channel.subscribe((message) => {
  if (message.name?.startsWith('[meta]')) return;
  debug.ably(`Message received on "${channelName}"`, message);
  window.__logToScreen?.('message', `[${message.name}] ${JSON.stringify(message.data)}`);
});

// Occupancy events
channel.subscribe('[meta]occupancy', (msg) => {
  const subscribers = msg.data.metrics.subscribers;
  console.log('Subscribers:', subscribers);
  window.__logToScreen?.('occupancy', `Occupancy update — subscribers: ${subscribers}`);
});

channel.on('attached', () => {
  debug.ably(`Attached to channel: "${channelName}"`);
  window.__logToScreen?.('system', `Attached to channel: "${channelName}"`);
});

debug.log('app.js loaded');