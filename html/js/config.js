// config structure version, please change to value in github-file after update and adding new values
var config_struc_ver = 20210312.1;

// 1 = show link to QRZ.com, 0 = off
var qrz = 1;

// 1 = enable debug in javascript-console, 0 = 0ff
var debug = 0;

// Set messagecounters for different badge-colors
var warnlevel = 200;
var emergencylevel = 500;


// 1 = show tab, 2 = show tab and make it default-tab on startup, 0 = suppress it
var currtx = 1;
var lastheard = 2;
var localheard = 1;
var allheard = 1;
var qso = 1;
var dapnet = 1;
var sysinfo = 1;
var about = 1;

// Set displayed timezone and timestamp to timezone of browser if 1, else use UTC for displaying
var useClientTimezone = 1;

// Show link to BrandMeister-LastHeard on TG if 1, else no link

var showBMTGLink = 1;

// Array of callsigns that should not be linked to qrz.com
var qrz_blacklist = [
"N0CALL",
]

// Array of callsigns that should generally not be listed on the dashboard

var dashboard_blacklist = [
"MY0CALL",
]