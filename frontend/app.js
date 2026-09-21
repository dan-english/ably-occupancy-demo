import * as debug from './debug.js';
import * as Ably from 'ably';
import { showToast } from './toast.js';

debug.log('app.js loaded');

const channelName = import.meta.env.VITE_ABLY_CHANNEL_NAME
debug.ably(`Connecting to channel: "${channelName}"`);

const clientId = `browser-user-${Math.floor(Math.random() * 1000000)}`;
document.getElementById('client-id-value').textContent = clientId;
//running list of active connected clients (updated on presence enter/leave)
const connectedClients = new Map();



const client = new Ably.Realtime({
  authCallback: async (tokenParams, callback) => {
    try {

      const response = await fetch(`/api/ably-token?clientId=${clientId}`); // <-- pass it

      if (!response.ok) throw new Error(`Auth request failed: ${response.status}`);
      const token = await response.text();
      callback(null, token);
    } catch (err) {
      debug.error('Failed to fetch Ably token', err);
      callback(err, null);
    }
  },
  params: { occupancy: 'metrics' }
}
);


const channel = client.channels.get(channelName, {
  params: { occupancy: 'metrics.subscribers' },
});

client.connection.on('connected', () => {
  debug.success('Ably connected');
  window.__logToScreen?.('system', 'Ably Client Connected');
});

client.connection.on('failed', () => {
  debug.error('Ably connection failed — check /api/ably-token on the backend');
  window.__logToScreen?.('system', 'Ably connection failed');
});

client.connection.on('disconnected', () => {
  debug.warn('Ably disconnected — will attempt to reconnect automatically');
  window.__logToScreen?.('system', 'Ably disconnected');
});



// Subscribe to changes on Occupancy events
channel.subscribe('[meta]occupancy', (msg) => {
  const subscribers = msg.data.metrics.subscribers;
  debug.occupancy('Subscribers:', subscribers);
  window.__logToScreen?.('occupancy', `Occupancy update — subscriber: ${subscribers}`);
});

// Server-side webhooks land here — see POST /api/webhooks on the backend,
// which republishes the incoming payload on this channel as 'webhook-event'.
channel.subscribe('webhook-event', (msg) => {
  debug.log('Webhook event received:', msg.data);
  window.__logToScreen?.('system', `Webhook event: ${JSON.stringify(msg.data)}`);
  showToast(`Webhook: ${JSON.stringify(msg.data)}`, 'info');
});


channel.on('attached', () => {
  debug.ably(`Attached to channel: "${channelName}"`);
  window.__logToScreen?.('system', `Attached to channel: "${channelName}"`);
  //enter the browser client into the room
  channel.presence.enter({
    'extra': 'for experts',
    'can_add_some_customer_info_here': 'like last seen'
  });
});




/**
 * Presence functions are: enter, leave, update, present
 */

// Subscribe BEFORE the channel attaches - catches 'present' actions during sync
channel.presence.subscribe('present', (member) => {
  debug.presenceEnterSync('--- Client already in channel and present during sync:', member.clientId);

  // store the existing users present in an array
  window.__updateClientList?.(Array.from(connectedClients.keys()));
});


// listen for new enters on the channel
channel.presence.subscribe('enter', async (member) => {

  const members = await channel.presence.get();
  connectedClients.clear();

  const id = member.clientId;

  members.forEach(member => {
    const id = member.clientId;
    connectedClients.set(id, (connectedClients.get(id) || 0) + 1);
  });

  window.__updateClientList?.(connectedClients);

  if (member.data !== undefined) {
    debug.presenceEnterWithData('Client entered with meta-data:', member.clientId);
    console.log(member);

  }
  else {
    debug.presenceEnter('Client entered:', member.clientId);
  }

  window.__logToScreen('presence-enter', `Client entered: ${member.clientId}`);



});


// listen for the leave event
channel.presence.subscribe('leave', async (member) => {

  debug.presenceLeave('Client left:', member.clientId);
  connectedClients.clear();

  //get latest presence data
  const members = await channel.presence.get();
  // update the UI list with existing members
  members.forEach(member => {
    const id = member.clientId;
    connectedClients.set(id, (connectedClients.get(id) || 0) + 1);
  });

  window.__updateClientList?.(connectedClients);

  const count = connectedClients.get(member.clientId);
  if (count > 0) {
    window.__logToScreen('presence-left', `Client left: ${member.clientId} still active in ${count} tabs`);
  }
  else {
    window.__logToScreen('presence-left', `Client left: ${member.clientId}`);
  }

});


/**
 * A silent connection will increment the number of
 * connections
 * subscribers
 * presence connections
 * presence subscribers
 * BUT NOT presence members.
 */

/** occupancy pay load
{
  name: '[meta]occupancy',
    id: 'V12G5ABc_M:0:0',
    timestamp: 1612286351217,
    clientId: undefined,
    connectionId: undefined,
    connectionKey: undefined,
    data: {
      metrics: {
        connections: 1,
        publishers: 1,
        subscribers: 1,
        presenceConnections: 1,
        presenceMembers: 0,
        presenceSubscribers: 1,
        objectPublishers: 1,
        objectSubscribers: 1
    }
  },
  encoding: null,
    extras: undefined,
      size: undefined
}
*/