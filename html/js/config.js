// config structure version, please change to value in github-file after update and adding new values
var config_struc_ver = 20210501.1;

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
var services = 1;
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

// 1 = enable dark display theme, 0 = use bright theme
var useDarkTheme = 1;

// Here you can put in your own html to be shown centered in the headline, to show no text, just set it to ``
var customHeadlineText = `Custom-Headline-Text`;

// Here you can put your own html to be shown between the header and the table-section, to show no text, just set it to ``
var customText = `<h2>This is an example</h2>
<p>you can use all html-tags and multiline-text.</p>`;
