// debug.js — custom browser console helpers
// Import this before app.js so helpers are available immediately.

const DEBUG = true; // set to false to silence in production

const styles = {
  info:    'color: #6B7FD7; font-weight: bold',
  success: 'color: #4CAF50; font-weight: bold',
  warn:    'color: #FFA500; font-weight: bold',
  error:   'color: #F44336; font-weight: bold',
  ably:    'color: #FF5416; font-weight: bold',  // Ably orange
};

export function log(msg, data)    { if (DEBUG) data !== undefined ? console.log(`%c[app] ${msg}`, styles.info, data)    : console.log(`%c[app] ${msg}`, styles.info); }
export function success(msg, data){ if (DEBUG) data !== undefined ? console.log(`%c[app] ${msg}`, styles.success, data) : console.log(`%c[app] ${msg}`, styles.success); }
export function warn(msg, data)   { if (DEBUG) data !== undefined ? console.warn(`%c[app] ${msg}`, styles.warn, data)   : console.warn(`%c[app] ${msg}`, styles.warn); }
export function error(msg, data)  {            data !== undefined ? console.error(`%c[app] ${msg}`, styles.error, data) : console.error(`%c[app] ${msg}`, styles.error); }
export function ably(msg, data)   { if (DEBUG) data !== undefined ? console.log(`%c[ably] ${msg}`, styles.ably, data)   : console.log(`%c[ably] ${msg}`, styles.ably); }
