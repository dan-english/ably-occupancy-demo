// debug.js — custom browser console helpers
// Import this before app.js so helpers are available immediately.

const DEBUG = true; // set to false to silence in production

const styles = {
  info: 'color: #6B7FD7; font-weight: bold',
  success: 'color: #4CAF50; font-weight: bold',
  warn: 'color: #FFA500; font-weight: bold',
  error: 'color: #F44336; font-weight: bold',
  ably: 'color: #FF5416; font-weight: bold',
  presenceEnter: 'color: #057869; font-weight: bold',
  presenceEnterGroup: 'color: #057869; font-weight: bold',
  presenceEnterSync: 'color: #057869; font-weight: bold',
  presenceLeave: 'color: #9C27B0; font-weight: bold',
  connected: 'color: #FF5416; background: #1a1a1a; padding: 1px 4px; border-radius: 2px; font-weight: bold',
  occupancy: 'color: #29B6F6; font-weight: bold',
};

export function presenceEnterSync(msg, data) { if (DEBUG) data !== undefined ? console.log(`%c[presence:enter] ${msg}`, styles.presenceEnterSync, data) : console.log(`%c[presence:enter] ${msg}`, styles.presenceEnterSync); }
export function presenceEnter(msg, data) { if (DEBUG) data !== undefined ? console.log(`%c[presence:enter] ${msg}`, styles.presenceEnter, data) : console.log(`%c[presence:enter] ${msg}`, styles.presenceEnter); }
export function presenceEnterWithData(msg, data) { if (DEBUG) data !== undefined ? console.groupCollapsed(`%c[presence:enter] ${msg}`, styles.presenceEnterGroup, data) : console.groupCollapsed(`%c[presence:enter] ${msg}`, styles.presenceEnterGroup); }
export function presenceLeave(msg, data) { if (DEBUG) data !== undefined ? console.log(`%c[presence:leave] ${msg}`, styles.presenceLeave, data) : console.log(`%c[presence:leave] ${msg}`, styles.presenceLeave); }

export function clientConnected(msg, data) { if (DEBUG) data !== undefined ? console.log(`%c[client:connected] ${msg}`, styles.connected, data) : console.log(`%c[client:connected] ${msg}`, styles.connected); }
export function occupancy(msg, data) { if (DEBUG) data !== undefined ? console.log(`%c[occupancy] ${msg}`, styles.occupancy, data) : console.log(`%c[occupancy] ${msg}`, styles.occupancy); }

export function log(msg, data) { if (DEBUG) data !== undefined ? console.log(`%c[app] ${msg}`, styles.info, data) : console.log(`%c[app] ${msg}`, styles.info); }
export function success(msg, data) { if (DEBUG) data !== undefined ? console.log(`%c[app] ${msg}`, styles.success, data) : console.log(`%c[app] ${msg}`, styles.success); }
export function warn(msg, data) { if (DEBUG) data !== undefined ? console.warn(`%c[app] ${msg}`, styles.warn, data) : console.warn(`%c[app] ${msg}`, styles.warn); }
export function error(msg, data) { data !== undefined ? console.error(`%c[app] ${msg}`, styles.error, data) : console.error(`%c[app] ${msg}`, styles.error); }
export function ably(msg, data) { if (DEBUG) data !== undefined ? console.log(`%c[ably] ${msg}`, styles.ably, data) : console.log(`%c[ably] ${msg}`, styles.ably); }
