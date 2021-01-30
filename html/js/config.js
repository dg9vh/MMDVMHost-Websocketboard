// 1 = show link to QRZ.com, 0 = off
var qrz = 1;

// 1 = enable debug in javascript-console, 0 = 0ff
var debug = 0;

// Set messagecounters for different badge-colors
var warnlevel = 200;
var emergencylevel = 500;


// 1 = show tab, 0 = suppress it
var currtx = 1;
var lastheard = 1;
var localheard = 1;
var qso = 1;
var dapnet = 1;
var sysinfo = 1;
var about = 1;

// default-tab to show
// chose from following list: CurrTXTab, LastHeardTab, LocalHeadTab, InQSOTab, DAPNETMessagesTab, SysInfoTab, AboutTab
var defaultTab = "LastHeardTab";

// Set displayed timezone and timestamp to timezone of browser if 1, else use UTC for displaying
var useClientTimezone = 1;

// Show link to BrandMeister-LastHeard on TG if 1, else no link

var showBMTGLink = 1;
