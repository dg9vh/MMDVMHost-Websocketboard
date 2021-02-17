var messagecount = 0;
var ts1TXing = null;
var ts2TXing = null;
var ts1timestamp = "";
var ts2timestamp = "";
var talkgroups = [];
// Setting config-defaults if not set
qrz = typeof(qrz) == 'undefined' ? 1 : qrz;
debug = typeof(debug) == 'undefined' ? 0 : debug;
warnlevel = typeof(warnlevel) == 'undefined' ? 200 : warnlevel;
emergencylevel = typeof(emergencylevel) == 'undefined' ? 500 : emergencylevel;
useClientTimezone = typeof(useClientTimezone) == 'undefined' ? 1 : useClientTimezone;
showBMTGLink = typeof(showBMTGLink) == 'undefined' ? 1 : showBMTGLink;
currtx = typeof(currtx) == 'undefined' ? 1 : currtx;
lastheard = typeof(lastheard) == 'undefined' ? 1 : lastheard;
localheard = typeof(localheard) == 'undefined' ? 1 : localheard;
allheard = typeof(allheard) == 'undefined' ? 1 : allheard;
qso = typeof(qso) == 'undefined' ? 1 : qso;
dapnet = typeof(dapnet) == 'undefined' ? 1 : dapnet;
sysinfo = typeof(sysinfo) == 'undefined' ? 1 : sysinfo;
about = typeof(about) == 'undefined' ? 1 : about;

setInterval(getCurrentTXing, 1000);

function logIt(message) {
	if (debug == 1 || message.startsWith("Logtailer-Errormessage:")) {
		console.log(JSON.stringify(message));
	}
}

function getTimezone() {
	if (useClientTimezone) {
		var d = new Date();
		var usertime = d.toLocaleString();

		// Some browsers / OSs provide the timezone name in their local string:
		var tzsregex = /\b(ACDT|ACST|ACT|ADT|AEDT|AEST|AFT|AKDT|AKST|AMST|AMT|ART|AST|AWDT|AWST|AZOST|AZT|BDT|BIOT|BIT|BOT|BRT|BST|BTT|CAT|CCT|CDT|CEDT|CEST|CET|CHADT|CHAST|CIST|CKT|CLST|CLT|COST|COT|CST|CT|CVT|CXT|CHST|DFT|EAST|EAT|ECT|EDT|EEDT|EEST|EET|EST|FJT|FKST|FKT|GALT|GET|GFT|GILT|GIT|GMT|GST|GYT|HADT|HAEC|HAST|HKT|HMT|HST|ICT|IDT|IRKT|IRST|IST|JST|KRAT|KST|LHST|LINT|MART|MAGT|MDT|MET|MEST|MIT|MSD|MSK|MST|MUT|MYT|NDT|NFT|NPT|NST|NT|NZDT|NZST|OMST|PDT|PETT|PHOT|PKT|PST|RET|SAMT|SAST|SBT|SCT|SGT|SLT|SST|TAHT|THA|UYST|UYT|VET|VLAT|WAT|WEDT|WEST|WET|WST|YAKT|YEKT)\b/gi;

		// In other browsers the timezone needs to be estimated based on the offset:
		var timezonenames = {"UTC+0":"GMT","UTC+1":"CET","UTC+2":"EET","UTC+3":"EEDT","UTC+3.5":"IRST","UTC+4":"MSD","UTC+4.5":"AFT","UTC+5":"PKT","UTC+5.5":"IST","UTC+6":"BST","UTC+6.5":"MST","UTC+7":"THA","UTC+8":"AWST","UTC+9":"AWDT","UTC+9.5":"ACST","UTC+10":"AEST","UTC+10.5":"ACDT","UTC+11":"AEDT","UTC+11.5":"NFT","UTC+12":"NZST","UTC-1":"AZOST","UTC-2":"GST","UTC-3":"BRT","UTC-3.5":"NST","UTC-4":"CLT","UTC-4.5":"VET","UTC-5":"EST","UTC-6":"CST","UTC-7":"MST","UTC-8":"PST","UTC-9":"AKST","UTC-9.5":"MIT","UTC-10":"HST","UTC-11":"SST","UTC-12":"BIT"};

		var timezone = usertime.match(tzsregex);
		if (timezone) {
			timezone = timezone[timezone.length-1];
		} else {
			var offset = -1*d.getTimezoneOffset()/60;
			offset = "UTC" + (offset >= 0 ? "+" + offset : offset);
			timezone = timezonenames[offset];
		}

		return timezone;
	} else {
		return "UTC";
	}
}

function inDashboardBlacklist(logline) {
	callsign = logline.substring(logline.indexOf("from") + 5, logline.indexOf("to")).trim();
	name = "";
	if (callsign.indexOf("$") > 0) {
		name = callsign.substring(callsign.indexOf("$") + 1, callsign.lastIndexOf("$"));
		if (name == "$")
			name = "";
		callsign = callsign.substring(0, callsign.indexOf("$"));
	}
	return dashboard_blacklist.includes(callsign);
}

function isDMRHost(logline) {
	if (logline.charAt(22) == " ")
		return true;
	else
		return false;
}

function getLocaltimeFromTimestamp(timestamp) {
	if (useClientTimezone) {
		var localtime = new Date(timestamp.replace(/-/g, "/") + " GMT");
		return localtime.toLocaleString();
	} else {
		return timestamp;
	}
}

function getRawTimestamp(logline) {
	return logline.substring(3,22);
}

function getTimestamp(logline) {
	return getLocaltimeFromTimestamp(getRawTimestamp(logline));
}

function getMode(logline) {
	if (isDMRHost(logline))
		return logline.substring(23, logline.indexOf(","));
	else
		return logline.substring(27, logline.indexOf(","));
}

function getCallsign(logline) {
	callsign = logline.substring(logline.indexOf("from") + 5, logline.indexOf("to")).trim();
	name = "";
	if (callsign.indexOf("$") > 0) {
		name = callsign.substring(callsign.indexOf("$") + 1, callsign.lastIndexOf("$"));
		callsign = callsign.substring(0, callsign.indexOf("$"));
	}
	if (qrz == 1 && isNaN(callsign) && !qrz_blacklist.includes(callsign)) {
		if (name != "") {
			return '<div class=\"tooltip2\"><a target="_new" href="https://qrz.com/db/' + callsign + '">' + callsign + '</a><span class=\"tooltip2text\">Name:<br>' + name + '</span></div>';
		} else {
			return '<a target="_new" href="https://qrz.com/db/' + callsign + '">' + callsign + '</a>';
		}
	} else {
		if (name != "") {
			return '<div class=\"tooltip2\">' + callsign + '<span class=\"tooltip2text\">Name:<br>' + name + '</span></div>';
		} else {
			return callsign;
		}
	}
}

function getRawTarget(logline) {
	if(logline.indexOf(" at ") > 0 && logline.indexOf("late entry") < 0 ) {
		return logline.substring(logline.indexOf(" to ") + 4, logline.lastIndexOf(" at ") + 1);
	} else {
		val = logline.substring(logline.indexOf(" to ") + 4);
		if (val.indexOf(",") > 0) {
			val = val.substring(0, val.indexOf(","));
		}
		return val;
	}
}

function resolveTarget(mode, timeslot, target) {
	if (mode.startsWith("DMR")) {
		mode = "DMR";
	}
	
	retval = null;
	tmpval = talkgroups.filter(function (tg) { return tg[0] == mode});
	switch (mode) {
		case "DMR":
			tmpval = talkgroups.filter(function (tg) { return tg[1] == timeslot});
			retval = tmpval.filter(function (tg) { return tg[2] == target.substring(3, target.length).trim()});
			break;
		case "YSF":
			retval = tmpval.filter(function (tg) { return tg[2] == target.substring(6, target.length).trim()});
			break;
		default:
			break;
	}
	if (retval.length > 0) {
		return retval[0][3];
	} else {
		return target;
	}
}

function getTimeslot(mode) {
	if (mode.startsWith("DMR")) {
		return mode.substring(9, 10);
	} else {
		return null;
	}
}

function getTarget(logline) {
	target = getRawTarget(logline);
	if (showBMTGLink && getMode(logline).startsWith("DMR")) {
		bmlink = "https://brandmeister.network/?page=lh&DestinationID=";
		linkTarget = target;
		if (target.indexOf("TG") == 0) {
			linkTarget = target.substring(3);
		}
		if (isNaN(linkTarget)) {
			name = "";
			if (target.indexOf("$") > 0) {
				name = target.substring(target.indexOf("$") + 1, target.lastIndexOf("$"));
				if (name == "$")
					name = "";
				target = target.substring(0, target.indexOf("$"));
			}
			if (qrz == 1 && isNaN(target) && !qrz_blacklist.includes(target)) {
				if (name != "") {
					return '<div class=\"tooltip2\"><a target="_new" href="https://qrz.com/db/' + target + '">' + target + '</a><span class=\"tooltip2text\">Name:<br>' + name + '</span></div>';
				} else {
					return '<a target="_new" href="https://qrz.com/db/' + target + '">' + target + '</a>';
				}
			} else {
				if (name != "") {
					return '<div class=\"tooltip2\">' + target + '<span class=\"tooltip2text\">Name:<br>' + name + '</span></div>';
				} else {
					return target;
				}
			}
		} else {
			//if (getMode(logline).startsWith("DMR")) {
				link = '<a href="' + bmlink + linkTarget + '" target="_new">' + resolveTarget(getMode(logline), getTimeslot(getMode(logline)), target) + '</a>';
				return link;
			/*} else {
				link = '<a href="' + bmlink + linkTarget + '" target="_new">' + target + '</a>';
				return link;
			}*/
		}
	} else {
		//if (getMode(logline).startsWith("DMR")) {
			return resolveTarget(getMode(logline), getTimeslot(getMode(logline)), target);
		/*} else {
			return target;
		}*/
	}
}	

function getSource(logline) {
	val = logline.substring(logline.indexOf("received") + 9);
	val = val.substring(0, val.indexOf(" "));
	if (val == "network")
		val = "Net";
	return val;
}

function getDuration(logline) {
	if(logline.lastIndexOf("seconds") > 0) {
		val = logline.substring(0, logline.lastIndexOf("seconds"));
		val = val.substring(val.lastIndexOf(",") + 2);
		return val;
	} else {
		return "";
	}
}

function getLoss(logline) {
	if(logline.lastIndexOf("seconds") > 0) {
		val = logline.substring(logline.lastIndexOf("seconds") + 9, logline.indexOf("%") + 1);
		if (val.indexOf("BER") == -1) {
			return val;
		} else {
			return "";
		}
	} else {
		return "";
	}
}

function getRSSI(logline) {
	rssi_raw = logline.substring(logline.lastIndexOf("RSSI:"));
	rssi = parseInt(rssi_raw.substring(rssi_raw.lastIndexOf("/")+1, rssi_raw.lastIndexOf("dBm")-1));
	if (rssi > "-53") retval = "<img src=\"images/4.png\" \> <div class=\"tooltip2\">S9<sup> +40dB</sup> (" + rssi + " dBm)<span class=\"tooltip2text\">(min/max/avg)<br>" + rssi_raw + "</span></div>";
	else if (rssi > "-63") retval = "<img src=\"images/4.png\" \> <div class=\"tooltip2\">S9<sup> +30dB</sup> (" + rssi + " dBm)<span class=\"tooltip2text\">(min/max/avg)<br>" + rssi_raw + "</span></div>";
	else if (rssi > "-73") retval = "<img src=\"images/4.png\" \> <div class=\"tooltip2\">S9<sup> +20dB</sup> (" + rssi + " dBm)<span class=\"tooltip2text\">(min/max/avg)<br>" + rssi_raw + "</span></div>";
	else if (rssi > "-83") retval = "<img src=\"images/4.png\" \> <div class=\"tooltip2\">S9<sup> +10dB</sup> (" + rssi + " dBm)<span class=\"tooltip2text\">(min/max/avg)<br>" + rssi_raw + "</span></div>";
	else if (rssi > "-93") retval = "<img src=\"images/4.png\" \> <div class=\"tooltip2\">S9 (" + rssi + " dBm)<span class=\"tooltip2text\">(min/max/avg)<br>" + rssi_raw + "</span></div>";
	else if (rssi > "-99") retval = "<img src=\"images/3.png\" \> <div class=\"tooltip2\">S8 (" + rssi + " dBm)<span class=\"tooltip2text\">(min/max/avg)<br>" + rssi_raw + "</span></div>";
	else if (rssi > "-105") retval = "<img src=\"images/3.png\" \> <div class=\"tooltip2\">S7 (" + rssi + " dBm)<span class=\"tooltip2text\">(min/max/avg)<br>" + rssi_raw + "</span></div>";
	else if (rssi > "-111") retval = "<img src=\"images/2.png\" \> <div class=\"tooltip2\">S6 (" + rssi + " dBm)<span class=\"tooltip2text\">(min/max/avg)<br>" + rssi_raw + "</span></div>";
	else if (rssi > "-117") retval = "<img src=\"images/2.png\" \> <div class=\"tooltip2\">S5 (" + rssi + " dBm)<span class=\"tooltip2text\">(min/max/avg)<br>" + rssi_raw + "</span></div>";
	else if (rssi > "-123") retval = "<img src=\"images/1.png\" \> <div class=\"tooltip2\">S4 (" + rssi + " dBm)<span class=\"tooltip2text\">(min/max/avg)<br>" + rssi_raw + "</span></div>";
	else if (rssi > "-129") retval = "<img src=\"images/1.png\" \> <div class=\"tooltip2\">S3 (" + rssi + " dBm)<span class=\"tooltip2text\">(min/max/avg)<br>" + rssi_raw + "</span></div>";
	else if (rssi > "-135") retval = "<img src=\"images/0.png\" \> <div class=\"tooltip2\">S2 (" + rssi + " dBm)<span class=\"tooltip2text\">(min/max/avg)<br>" + rssi_raw + "</span></div>";
	else if (rssi > "-141") retval = "<img src=\"images/0.png\" \> <div class=\"tooltip2\">S1 (" + rssi + " dBm)<span class=\"tooltip2text\">(min/max/avg)<br>" + rssi_raw + "</span></div>";
	return retval;
}

function getBER(logline) {
	if(logline.lastIndexOf("BER") > 0) {
		if(logline.lastIndexOf("RSSI:") > 0) {
			retval = logline.substring(logline.lastIndexOf("BER") + 4, logline.lastIndexOf("RSSI:"));
			retval += " " + getRSSI(logline);
			return retval;
		} else {
			return logline.substring(logline.lastIndexOf("BER") + 4);
		}
	} else {
		return "";
	}
}

function getAddToQSO(logline) {
	callsign = logline.substring(logline.indexOf("from") + 5, logline.indexOf("to")).trim();
	name = "";
	if (callsign.indexOf("$") > 0) {
		name = callsign.substring(callsign.indexOf("$") + 1, callsign.lastIndexOf("$"));
		if (name == "$")
			name = "";
		callsign = callsign.substring(0, callsign.indexOf("$"));
	}
	if (name == "" ) {
		retval = '<div class="bd-clipboard"><button type="button" class="btn-cpQSO" title="Copy to QSO" id="' + callsign + '" onclick="copyToQSO(\'' + callsign + '\')">Copy</button></div>';
	} else {
		retval = '<div class="bd-clipboard"><button type="button" class="btn-cpQSO" title="Copy to QSO" id="' + callsign + ' - ' + name + '" onclick="copyToQSO(\'' + callsign + ' - ' + name + '\')">Copy</button></div>';
	}
	return retval;
}

function getSlot(logline) {
	return logline.substring(logline.indexOf("slot") + 5, logline.indexOf("to ")).trim();
}

function getRIC(logline) {
	return logline.substring(logline.indexOf("to ") + 3, logline.indexOf(", type")).trim();
}

function getMessage(logline) {
	message = logline.substring(logline.indexOf("ric:") + 6);
	message = message.substring(0, message.length - 1);
	if (4520 == parseInt(getRIC(logline))) {
		message = rot1(message);
	}
	if (4512 == parseInt(getRIC(logline))) {
		message = decodeSkyperRubric(message);
	}
	
	if (1062 == parseInt(getRIC(logline)) || 1063 == parseInt(getRIC(logline))) {
		//message = '<a href="#" class="tooltip-test" title="' + JSON.stringify(parseMETAR(message)).replace(/\"/g, '').replace(/,/g, ',\n') + '">' + message + '</a>';
		message = '<div class=\"tooltip2\">' + message + '<span class=\"tooltiptext\">Decoded Message:<br>' + JSON.stringify(parseMETAR(message)).replace(/\"/g, '').replace(/,/g, ',\n') + '</span></div>';
	}
	return message;
}

function getMessagesInQueue(line) {
	messagecount = parseInt(line.substring(45));
	logIt("messagecount: " + messagecount);
}

function ord(str) {
	return str.charCodeAt(0);
}

function chr(n) {
	return String.fromCharCode(n);
}

function rot1(text) {
	ric = 0;
	slot = 0;
	out = "";
	for (i = 0; i < text.length; i++) {
		if (i == 0) {
			ric = ord(text[i])-31;
		}
		if (i == 1) {
			slot = ord(text[i])-32;
		}
		if (i > 1) {
			out += chr(ord(text[i])-1);
		}
	}
	return "Skyper-Rubric-No.: " + ric + ", Slot: " + slot + ", message: " + out;
}

function decodeSkyperRubric(rubric) {
	ric = ord(rubric[1]) - 31;
	name = "";
	for (i = 3; i < rubric.length; i++) {
		name += chr(ord(rubric[i])-1);
	}
	return "Skyper-Rubric Announcement: No.: " + ric + ": " + name;
}

function copyToQSO(callsign) {
	$(document).ready(function() {
		var date = new Date().toISOString().split('T')
		t_qso.row.add( [
			callsign,
			getLocaltimeFromTimestamp(date[0] + " " + date[1].substring(0, date[1].indexOf("."))),
			""
		] ).draw(false);
	});
	alert("" + callsign + " added to in QSO-Tab");
	
}

function getCallsign(logline) {
	callsign = logline.substring(logline.indexOf("from") + 5, logline.indexOf("to")).trim();
	name = "";
	if (callsign.indexOf("$") > 0) {
		name = callsign.substring(callsign.indexOf("$") + 1, callsign.lastIndexOf("$"));
		if (name == "$")
			name = "";
		callsign = callsign.substring(0, callsign.indexOf("$"));
	}
	if (qrz == 1 && isNaN(callsign) && !qrz_blacklist.includes(callsign)) {
		if (name != "") {
			return '<div class=\"tooltip2\"><a target="_new" href="https://qrz.com/db/' + callsign + '">' + callsign + '</a><span class=\"tooltip2text\">Name:<br>' + name + '</span></div>';
		} else {
			return '<a target="_new" href="https://qrz.com/db/' + callsign + '">' + callsign + '</a>';
		}
	} else {
		if (name != "") {
			return '<div class=\"tooltip2\">' + callsign + '<span class=\"tooltip2text\">Name:<br>' + name + '</span></div>';
		} else {
			return callsign;
		}
	}
}

function getCurrentTXing() {
	ts1 = null;
	ts2 = null;
	if (ts1TXing != null) {
		matchstring = "";
		ts1 = ts1TXing.split(";");
		ts1[4] = Math.round((Date.now() - Date.parse(ts1timestamp.replace(" ","T")+".000Z"))/1000);
		t_qso.rows( function ( idx, data, node ) {
			callsign = ts1[1];
			name = "";
			if (callsign.indexOf("$") > 0) {
				name = callsign.substring(callsign.indexOf("$") + 1, callsign.lastIndexOf("$"));
				if (name == "$")
					name = "";
				callsign = callsign.substring(0, callsign.indexOf("$"));
			}
			if (name == "" ) {
				matchstring = callsign;
			} else {
				matchstring = callsign + ' - ' + name;
			}
			if(data[0] == matchstring){
				data[2] = getLocaltimeFromTimestamp(ts1timestamp);
				$('#inQSO').dataTable().fnUpdate(data,idx,undefined,false);
			}
		}).draw(false);
	}
	if (ts2TXing != null) {
		matchstring = "";
		ts2 = ts2TXing.split(";");
		ts2[4] = Math.round((Date.now() - Date.parse(ts2timestamp.replace(" ","T")+".000Z"))/1000);
		t_qso.rows( function ( idx, data, node ) {
						callsign = ts2[1];
			name = "";
			if (callsign.indexOf("$") > 0) {
				name = callsign.substring(callsign.indexOf("$") + 1, callsign.lastIndexOf("$"));
				if (name == "$")
					name = "";
				callsign = callsign.substring(0, callsign.indexOf("$"));
			}
			if (name == "" ) {
				matchstring = callsign;
			} else {
				matchstring = callsign + ' - ' + name;
			}
			if(data[0] == matchstring){
				data[2] = getLocaltimeFromTimestamp(ts2timestamp);
				$('#inQSO').dataTable().fnUpdate(data,idx,undefined,false);
			}
		}).draw(false);
	}
	t_ct.clear().draw(false);
	if (ts1 != null) {
		callsign = ts1[1];
		name = "";
		if (callsign.indexOf("$") > 0) {
			name = callsign.substring(callsign.indexOf("$") + 1, callsign.lastIndexOf("$"));
			if (name == "$")
				name = "";
		callsign = callsign.substring(0, callsign.indexOf("$"));
		}
		if (qrz == 1 && isNaN(callsign) && !qrz_blacklist.includes(callsign)) {
			if (name != "") {
				ts1[1] = '<div class=\"tooltip2\"><a target="_new" href="https://qrz.com/db/' + callsign + '">' + callsign + '</a><span class=\"tooltip2text\">Name:<br>' + name + '</span></div>';
			} else {
				ts1[1] =  '<a target="_new" href="https://qrz.com/db/' + callsign + '">' + callsign + '</a>';
			}
		} else {
			if (name != "") {
				ts1[1] =  '<div class=\"tooltip2\">' + callsign + '<span class=\"tooltip2text\">Name:<br>' + name + '</span></div>';
			} else {
				ts1[1] =  callsign;
			}
		}
		t_ct.row.add( [
			ts1[0],
			ts1[1],
			ts1[2],
			ts1[3],
			ts1[4]
		] ).draw(false);
	}
	if (ts2 != null) {
		callsign = ts2[1];
		name = "";
		if (callsign.indexOf("$") > 0) {
			name = callsign.substring(callsign.indexOf("$") + 1, callsign.lastIndexOf("$"));
			if (name == "$")
				name = "";
			callsign = callsign.substring(0, callsign.indexOf("$"));
		}
		if (qrz == 1 && isNaN(callsign) && !qrz_blacklist.includes(callsign)) {
			if (name != "") {
				ts2[1] = '<div class=\"tooltip2\"><a target="_new" href="https://qrz.com/db/' + callsign + '">' + callsign + '</a><span class=\"tooltip2text\">Name:<br>' + name + '</span></div>';
			} else {
				ts2[1] =  '<a target="_new" href="https://qrz.com/db/' + callsign + '">' + callsign + '</a>';
			}
		} else {
			if (name != "") {
				ts2[1] =  '<div class=\"tooltip2\">' + callsign + '<span class=\"tooltip2text\">Name:<br>' + name + '</span></div>';
			} else {
				ts2[1] =  callsign;
			}
		}
		t_ct.row.add( [
			ts2[0],
			ts2[1],
			ts2[2],
			ts2[3],
			ts2[4]
		] ).draw(false);
	}
}

function getMHZ(qrg) {
	qrg = qrg / 1000000;
	return qrg;
}

function getLastHeard(document, event) {
	$(document).ready(function() {
		lines = event.data.split("\n");
		var duration = 0;
		lines.forEach(function(line, index, array) {
			logIt("LogLine: " + line);
			if (!inDashboardBlacklist(line)) {
				/*if (line.indexOf("description:") > 0 ) {
					modem = line.substring(line.indexOf("description:") + 12);
					document.getElementById("modem").innerHTML = modem;
				}*/
				
				txing = false;
				if (line.indexOf("Talker Alias") < 0 && line.indexOf("Downlink Activate") < 0 && line.indexOf("Preamble CSBK") < 0 && line.indexOf("data header") < 0 && line.indexOf("0000:") < 0 && line.length > 0 && (line.indexOf("received") > 0 || line.indexOf("network watchdog") > 0)) {
					if (line.indexOf("received network data") > 0 || line.indexOf("late entry") > 0 || line.indexOf("voice header") > 0 || line.indexOf("received RF header") > 0) {
						txing = true;
						if (getMode(line) == "DMR Slot 1" ) {
							ts1TXing = getMode(line) + ";" + line.substring(line.indexOf("from") + 5, line.indexOf("to")).trim() + ";" + getTarget(line)  + ";" + getSource(line);
							ts1timestamp = getRawTimestamp(line);
						} else {
							ts2TXing = getMode(line) + ";" + line.substring(line.indexOf("from") + 5, line.indexOf("to")).trim() + ";" + getTarget(line)  + ";" + getSource(line);
							ts2timestamp = getRawTimestamp(line);
						}
					}
					if (line.indexOf("network watchdog") > 0 || line.indexOf("end of voice transmission") > 0 || line.indexOf("end of transmission") > 0) {
						if (getMode(line) == "DMR Slot 1" ) {
							ts1TXing = null;
						} else {
							ts2TXing = null;
						}
						txing = false;
						
						if (line.indexOf("network watchdog") > 0) {
							logIt("Network Watchdog!");
							
							var rowIndexes = [];
							t_lh.rows( function ( idx, data, node ) {
								if (getMode(line) == "DMR Slot 1" ) {
									if(data[0] == getLocaltimeFromTimestamp(ts1timestamp)){
										rowIndexes.push(idx);
									}
									return false;
								} else {
									if(data[0] == getLocaltimeFromTimestamp(ts2timestamp)){
										rowIndexes.push(idx);
									}
								}
							});
							if (getMode(line) == "DMR Slot 1" ) {
								duration = Math.round(Date.parse(getRawTimestamp(line).replace(" ","T")+".000Z")/1000 - Date.parse(ts1timestamp.replace(" ","T")+".000Z")/1000);
							} else {
								duration = Math.round(Date.parse(getRawTimestamp(line).replace(" ","T")+".000Z")/1000 - Date.parse(ts2timestamp.replace(" ","T")+".000Z")/1000);
							}
							logIt("RowIndexes: " + rowIndexes);
							if (rowIndexes[0]) {
								if (rowIndexes[0] == "0") {
									t_lh.row(rowIndexes[0]).remove().draw(false);
								}
								logIt("RowIndex[0]: " + rowIndexes[0]);
								if (t_lh.row(rowIndexes[0]).data[0] != null) {
									newData = [
										t_lh.row(rowIndexes[0]).data[0],
										t_lh.row(rowIndexes[0]).data[1],
										t_lh.row(rowIndexes[0]).data[2],
										t_lh.row(rowIndexes[0]).data[3],
										t_lh.row(rowIndexes[0]).data[4],
										duration,
										"",
										"",
										getAddToQSO(line)
									]
									logIt(t_lh.row(rowIndexes[0]).data[2])
									$('#lastHeard').dataTable().fnUpdate(newData,rowIndexes[0],undefined,false);
								} else {
									logIt("Problem replacing watchdog! Indices: " + rowIndexes);
								}
							} 
						}
					}
					logIt("TS1: " + ts1TXing + "|" + ts1timestamp);
					logIt("TS2: " + ts2TXing + "|" + ts2timestamp);
					getCurrentTXing();
					
					if (line.indexOf("network watchdog") < 0 ) {
						var rowIndexes = [],
							timestamp = getTimestamp(line),
							mode = getMode(line),
							callsign = getCallsign(line),
							target = getTarget(line),
							source = getSource(line),
							duration = getDuration(line),
							loss = getLoss(line),
							ber = getBER(line),
							addToQSO = getAddToQSO(line);
						if (txing) {
							duration = "TXing";
							loss = "";
							ber = "";
						}
						if (mode == "POCSAG") {
							callsign = "POCSAG";
							target = "";
							source = "";
							duration = "";
							loss = "";
							ber = "";
							addToQSO = "";
						}
						t_lh.rows( function ( idx, data, node ) {
							if(data[2] == callsign){
								rowIndexes.push(idx);
							}
							return false;
						});
						if (rowIndexes[0] == "0") {
							t_lh.row(rowIndexes[0]).remove().draw(false);
						}
						if (rowIndexes[0]) {
							
							newData = [
								timestamp,
								mode,
								callsign,
								target,
								source,
								duration,
								loss,
								ber,
								addToQSO
							]
							t_lh.row(rowIndexes[0]).data( newData ).draw(false);
						} else {
							t_lh.row.add( [
								timestamp,
								mode,
								callsign,
								target,
								source,
								duration,
								loss,
								ber,
								addToQSO
							] ).draw(false);
						}
					}
					if (rowIndexes[0]) {
						var row = t_lh.row(rowIndexes[0]).node();
						var temp = t_lh.row(rowIndexes[0]).data();
						logIt("Temp: "+ temp);
						logIt("Duration: " + duration);
						temp[5] = duration;
						$('#lastHeard').dataTable().fnUpdate(temp,rowIndexes[0],undefined,false);
					}
				}
			}
		});
	});
}

function getLocalHeard(document, event) {
	
	$(document).ready(function() {
		lines = event.data.split("\n");
		lines.forEach(function(line, index, array) {
			if (!inDashboardBlacklist(line)) {
				if (getSource(line) == "RF") {
					if (getDuration(line) !== "") {
						t_localh.row.add( [
							getTimestamp(line),
							getMode(line),
							getCallsign(line),
							getTarget(line),
							getSource(line),
							getDuration(line),
							getBER(line)
						] ).draw(false);
					}
				}
			}
		});
	});
}

function getAllHeard(document, event) {
	$(document).ready(function() {
		lines = event.data.split("\n");
		lines.forEach(function(line, index, array) {
			if (!inDashboardBlacklist(line)) {
				if (line.indexOf("network watchdog") < 0 ) {
					if (getDuration(line) !== "") {
						t_allh.row.add( [
							getTimestamp(line),
							getMode(line),
							getCallsign(line),
							getTarget(line),
							getSource(line),
							getDuration(line),
							getLoss(line),
							getBER(line)
						] ).draw(false);
					}
				}
			}
		});
	});
}

function getDapnetMessages(document, event) {
	$(document).ready(function() {
		lines = event.data.split("\n");
		logIt("lines.length: " + lines.length);
		lines.forEach(function(line, index, array) {
			logIt(line);
			if (line.indexOf("Sending") > 0 ) {
				t_dapnet.row.add( [
					getTimestamp(line),
					getSlot(line),
					getRIC(line),
					getMessage(line)
				] ).draw(false);
				messagecount--;
				if (messagecount < 0 ) {
					messagecount = 0;
				}
				if (messagecount <= warnlevel) {
					document.getElementById('messagesinqueue').className = "badge badge-light";
				}
				if (messagecount > warnlevel) {
					document.getElementById('messagesinqueue').className = "badge badge-warning";
				}
				if (messagecount > emergencylevel) {
					document.getElementById('messagesinqueue').className = "badge badge-danger";
				}
				document.getElementById('messagesinqueue').innerHTML = "Messages in Queue: " + messagecount;
			}
			if (line.indexOf("Messages in Queue") > 0 ) {
				 getMessagesInQueue(line);
				if (messagecount <= warnlevel) {
					document.getElementById('messagesinqueue').className = "badge badge-light";
				}
				if (messagecount > warnlevel) {
					document.getElementById('messagesinqueue').className = "badge badge-warning";
				}
				if (messagecount > emergencylevel) {
					document.getElementById('messagesinqueue').className = "badge badge-danger";
				}
				document.getElementById('messagesinqueue').innerHTML = "Messages in Queue: " + messagecount;
			}
			if (line.indexOf("Rejecting") > 0 ) {
				 messagecount--;
				if (messagecount < 0 ) {
					messagecount = 0;
					if (messagecount <= warnlevel) {
						document.getElementById('messagesinqueue').className = "badge badge-light";
					}
					if (messagecount > warnlevel) {
						document.getElementById('messagesinqueue').className = "badge badge-warning";
					}
					if (messagecount > emergencylevel) {
						document.getElementById('messagesinqueue').className = "badge badge-danger";
					}
					document.getElementById('messagesinqueue').innerHTML = "Messages in Queue: " + messagecount;
				}
			}
		});
	});
}

function getSysInfo(document, event) {
	$(document).ready(function() {
		if (event.data.startsWith("HOSTINFO")) {
			logIt(event.data);
			data = event.data;
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("mmdvmhost_version").innerHTML = data.substring(data.indexOf("mmdvmhost_version:") + 18, data.indexOf(" mmdvmhost_ctime"));
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("built").innerHTML = data.substring(data.indexOf("mmdvmhost_ctime:") + 16, data.indexOf(" mmdvm_version"));
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("modem").innerHTML = data.substring(data.indexOf("mmdvm_version:") + 14, data.indexOf(" callsign"));
			data = data.substring(data.indexOf(" callsign") + 1);
			document.getElementById("callsign").innerHTML = data.substring(data.indexOf("callsign:") + 9, data.indexOf(" "));
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("dmrid").innerHTML = data.substring(data.indexOf("dmrid:") + 6, data.indexOf(" "));
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("txqrg").innerHTML = getMHZ(data.substring(data.indexOf("txqrg:") + 6, data.indexOf(" "))) + " MHz";
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("rxqrg").innerHTML = getMHZ(data.substring(data.indexOf("rxqrg:") + 6)) + " MHz";
		}
		if (event.data.startsWith("SYSINFO")) {
			logIt(event.data);
			data = event.data;
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("cputemp").innerHTML = parseFloat(data.substring(data.indexOf("cputemp:") + 8, data.indexOf(" "))).toFixed(1);
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("cpufrg").innerHTML = Math.round(data.substring(data.indexOf("cpufrg:") + 7, data.indexOf(" ")));
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("cpuusage").innerHTML = data.substring(data.indexOf("cpuusage:") + 9, data.indexOf(" "));
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("cpu_load1").innerHTML = data.substring(data.indexOf("cpu_load1:") + 10, data.indexOf(" "));
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("cpu_load5").innerHTML = data.substring(data.indexOf("cpu_load5:") + 10, data.indexOf(" "));
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("cpu_load15").innerHTML = data.substring(data.indexOf("cpu_load15:") + 11, data.indexOf(" "));
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("ram_total").innerHTML = Math.round(data.substring(data.indexOf("ram_total:") + 10, data.indexOf(" ")));
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("ram_used").innerHTML = Math.round(data.substring(data.indexOf("ram_used:") + 9, data.indexOf(" ")));
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("ram_free").innerHTML = Math.round(data.substring(data.indexOf("ram_free:") + 9, data.indexOf(" ")));
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("ram_percent_used").innerHTML = data.substring(data.indexOf("ram_percent_used:") + 17, data.indexOf(" "));
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("disk_total").innerHTML = parseFloat(data.substring(data.indexOf("disk_total:") + 11, data.indexOf(" "))).toFixed(3);
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("disk_used").innerHTML = parseFloat(data.substring(data.indexOf("disk_used:") + 10, data.indexOf(" "))).toFixed(3);
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("disk_free").innerHTML = parseFloat(data.substring(data.indexOf("disk_free:") + 10, data.indexOf(" "))).toFixed(3);
			data = data.substring(data.indexOf(" ") + 1);
			document.getElementById("disk_percent_used").innerHTML = data.substring(data.indexOf("disk_percent_used:") + 18);
		}
	});
}

function activateDefaultTab(name) {
	var element = document.getElementById(name + "-tab");
	element.classList.add("active");
	
	var element = document.getElementById(name);
	element.classList.add("show");
	element.classList.add("active");
}

$(document).ready(function() {
	defaultSet = false;
	for (i = 0; i < document.getElementById("myTab").children.length; ++i) {
		tabname = document.getElementById("myTab").children[i].getAttribute("name");
		if (eval(tabname) == 0) {
			document.getElementById("myTab").children[i].style.display="none";
			document.getElementById(tabname).style.display="none";
		}
		if (eval(tabname) == 2) {
			activateDefaultTab(tabname);
			defaultSet = true;
		}
		if (!defaultSet)
			activateDefaultTab("lastheard");
	}
});

$(document).ready(function() {
	$.ajax({
		type: "GET",
		url: window.location.protocol + '/data/TG_List.csv',
		dataType: "text",
		success: function(data) {processData(data);}
	});
});

function processData(data) {
	var allRows = data.split(/\r?\n|\r/);
	for (var singleRow = 1; singleRow < allRows.length; singleRow++) {
		var rowCells = allRows[singleRow].split(',');
		talkgroups.push([rowCells[0], rowCells[1], rowCells[2], rowCells[3]]);
	}
	logIt("Parsed TGs: " + talkgroups);
}