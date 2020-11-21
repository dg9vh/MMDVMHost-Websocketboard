var messagecount = 0;
var ts1TXing = null;
var ts2TXing = null;
var ts1timestamp = null;
var ts2timestamp = null;

setInterval(getCurrentTXing, 1000);
// 00000000001111111111222222222233333333334444444444555555555566666666667777777777888888888899999999990000000000111111111122222222223333333333
// 01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
// M: 2020-11-01 21:33:27.454 YSF, received network data from DG2MAS     to DG-ID 0 at DG2MAS
// M: 2020-11-01 21:33:35.025 YSF, received network end of transmission from DG2MAS     to DG-ID 0, 7.7 seconds, 0% packet loss, BER: 0.0%
// M: 2020-11-07 15:41:22.601 DMR Slot 1, received network late entry from DO5DC to TG 262810

function logIt(message) {
	if (debug == 1 || message.startsWith("Logtailer-Errormessage:")) {
		console.log(message);
	}
}

function getTimestamp(logline) {
	return logline.substring(3,22);
}

function getMode(logline) {
	return logline.substring(27, logline.indexOf(","));
}

function getCallsign(logline) {
	callsign = logline.substring(logline.indexOf("from") + 5, logline.indexOf("to")).trim();
	if (qrz == 1) {
		return '<a target="_new" href="https://qrz.com/db/' + callsign + '">' + callsign + '</a>';
	} else {
		return callsign;
	}
}

// 00000000001111111111222222222233333333334444444444555555555566666666667777777777888888888899999999990000000000111111111122222222223333333333
// 01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
// M: 2020-11-07 15:41:22.601 DMR Slot 1, received network late entry from DO5DC to TG 262810

function getTarget(logline) {
	if(logline.indexOf("at") > 0 && logline.indexOf("late entry") < 0 ) {
		return logline.substring(logline.indexOf("to") + 3, logline.lastIndexOf("at"));
	} else {
		val = logline.substring(logline.indexOf("to") + 3);
		if (val.indexOf(",") > 0) {
			val = val.substring(0, val.indexOf(","));
		}
		return val;
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

function getBER(logline) {
	if(logline.lastIndexOf("BER") > 0) {
		return logline.substring(logline.lastIndexOf("BER") + 4);
	} else {
		return "";
	}
}


function getAddToQSO(logline) {
	callsign = logline.substring(logline.indexOf("from") + 5, logline.indexOf("to")).trim();
	retval = '<div class="bd-clipboard"><button type="button" class="btn-cpQSO" title="Copy to QSO" id="' + callsign + '" onclick="copyToQSO(\'' + callsign + '\')">Copy</button></div>';
	return retval;
}
// 00000000001111111111222222222233333333334444444444555555555566666666667777777777888888888899999999990000000000111111111122222222223333333333
// 01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
// M: 2020-11-03 19:33:26.411 Sending message in slot 5 to 0000224, type 6, func Alphanumeric: "YYYYMMDDHHMMSS201103203300"
// M: 2020-11-03 19:36:00.124 Sending message in slot 13 to 0002504, type 5, func Numeric: "193600   031120"
// M: 2020-11-03 19:36:00.165 Sending message in slot 13 to 0000200, type 6, func Alphanumeric: "XTIME=1936031120XTIME=1936031120"
// M: 2020-11-03 19:36:00.216 Sending message in slot 13 to 0000216, type 6, func Alphanumeric: "YYYYMMDDHHMMSS201103193600"
// D: 2020-11-06 18:35:00.343 Messages in Queue 0001
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
		message = '<a href="#" class="tooltip-test" title="' + JSON.stringify(parseMETAR(message)).replace(/\"/g, '').replace(/,/g, ',\n') + '">' + message + '</a>';
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

function clocktime() {
	var now = new Date(),
		h = now.getHours(),
		m = now.getMinutes(),
		s = now.getSeconds();
	m = leadingZero(m);
	s = leadingZero(s);
    return h + ':' + m + ':' + s;

}
  
function leadingZero(zahl) {
    zahl = (zahl < 10 ? '0' : '' )+ zahl;  
    return zahl;
}

function copyToQSO(callsign) {
	$(document).ready(function() {
		t_qso.row.add( [
					callsign,
					new Date().toUTCString()
				] ).draw();
	});
	alert("" + callsign + " added to in QSO-Tab");
	
}

function getCurrentTXing() {
	ts1 = null;
	ts2 = null;
	if (ts1TXing != null) {
		ts1 = ts1TXing.split(";");
		ts1[4] = Math.round((Date.now() - Date.parse(ts1timestamp.replace(" ","T")+".000Z"))/1000);
	}
	if (ts2TXing != null) {
		ts2 = ts2TXing.split(";");
		ts2[4] = Math.round((Date.now() - Date.parse(ts2timestamp.replace(" ","T")+".000Z"))/1000);
	}
	t_ct.clear().draw();
	if (ts1 != null) {
		t_ct.row.add( [
			ts1[0],
			ts1[1],
			ts1[2],
			ts1[3],
			ts1[4]
		] ).draw();
	}
	if (ts2 != null) {
		t_ct.row.add( [
			ts2[0],
			ts2[1],
			ts2[2],
			ts2[3],
			ts2[4]
		] ).draw();
	}
}

function getLastHeard(document, event) {
// 00000000001111111111222222222233333333334444444444555555555566666666667777777777888888888899999999990000000000111111111122222222223333333333
// 01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
// M: 2020-11-01 21:33:27.454 YSF, received network data from DG2MAS     to DG-ID 0 at DG2MAS
// M: 2020-11-01 21:33:35.025 YSF, received network end of transmission from DG2MAS     to DG-ID 0, 7.7 seconds, 0% packet loss, BER: 0.0%
// && line.indexOf("network watchdog") < 0
	$(document).ready(function() {
		lines = event.data.split("\n");
		lines.forEach(function(line, index, array) {
			logIt(line);
			txing = false;
			if (line.indexOf("Talker Alias") < 0 && line.indexOf("Downlink Activate") < 0 && line.indexOf("Preamble CSBK") < 0 && line.indexOf("data header") < 0 && line.indexOf("0000:") < 0 && line.length > 0 && (line.indexOf("received") > 0 || line.indexOf("network watchdog") > 0)) {
				if (line.indexOf("received network data") > 0 || line.indexOf("late entry") > 0 || line.indexOf("voice header") > 0 || line.indexOf("received RF header") > 0) {
					txing = true;
					if (getMode(line) == "DMR Slot 1" ) {
						ts1TXing = getMode(line) + ";" + line.substring(line.indexOf("from") + 5, line.indexOf("to")).trim() + ";" + getTarget(line)  + ";" + getSource(line);
						ts1timestamp = getTimestamp(line);
					} else {
						ts2TXing = getMode(line) + ";" + line.substring(line.indexOf("from") + 5, line.indexOf("to")).trim() + ";" + getTarget(line)  + ";" + getSource(line);
						ts2timestamp = getTimestamp(line);
					}
				}
				if (line.indexOf("network watchdog") > 0 || line.indexOf("end of voice transmission") > 0 || line.indexOf("end of transmission") > 0) {
					if (getMode(line) == "DMR Slot 1" ) {
						ts1TXing = null;
					} else {
						ts2TXing = null;
					}
					if (line.indexOf("network watchdog") > 0) {
						logIt("Network Watchdog!");
						var rowIndexes = [];
						t_lh.rows( function ( idx, data, node ) {
							if (getMode(line) == "DMR Slot 1" ) {
								if(data[0] == ts1timestamp){
									rowIndexes.push(idx);
								}
								return false;
							} else {
								if(data[0] == ts2timestamp){
									rowIndexes.push(idx);
								}
							}
						});
						var duration = 0;
						if (getMode(line) == "DMR Slot 1" ) {
							duration = Math.round((Date.now() - Date.parse(ts1timestamp.replace(" ","T")+".000Z"))/1000);
						} else {
							duration = Math.round((Date.now() - Date.parse(ts2timestamp.replace(" ","T")+".000Z"))/1000);
						}
						if (rowIndexes[0]) {
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
								t_lh.row(rowIndexes[0]).data( newData ).draw(false);
							} else {
								logIt("Problem replacing watchdog! Indices: " + rowIndexes);
								t_lh.row(rowIndexes[0]).remove().draw( false );
							}
						}
					}
				}
				logIt("TS1: " + ts1TXing + "|" + ts1timestamp);
				logIt("TS2: " + ts2TXing + "|" + ts2timestamp);
				getCurrentTXing();
				
				if (line.indexOf("network watchdog") < 0) {
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
						] ).draw();
					}
				}
			}
		});
	});
}

function getLocalHeard(document, event) {
// 00000000001111111111222222222233333333334444444444555555555566666666667777777777888888888899999999990000000000111111111122222222223333333333
// 01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
// M: 2020-11-01 21:33:27.454 YSF, received network data from DG2MAS     to DG-ID 0 at DG2MAS
// M: 2020-11-01 21:33:35.025 YSF, received network end of transmission from DG2MAS     to DG-ID 0, 7.7 seconds, 0% packet loss, BER: 0.0%
	$(document).ready(function() {
		lines = event.data.split("\n");
		lines.forEach(function(line, index, array) {
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
					] ).draw();
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
				] ).draw();
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
		logIt(event.data);
		data = event.data;
		data = data.substring(data.indexOf(" ") + 1);
		document.getElementById("cputemp").innerHTML = parseFloat(data.substring(data.indexOf("cputemp:") + 8, data.indexOf(" "))).toFixed(1);
		data = data.substring(data.indexOf(" ") + 1);
		document.getElementById("cpufrg").innerHTML = data.substring(data.indexOf("cpufrg:") + 7, data.indexOf(" "));
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
	});
}

$(document).ready(function() {
	if(showCurrTXTab == 0){
		document.getElementById("myTab").children[0].style.display="none";
		document.getElementById("currtx").style.display="none";
	}
	if(showLastHeardTab == 0){
		document.getElementById("myTab").children[1].style.display="none";
		document.getElementById("lastheard").style.display="none";
	}
	if(showLocalHeadTab == 0){
		document.getElementById("myTab").children[2].style.display="none";
		document.getElementById("localheard").style.display="none";
	}
	if(showInQSOTab == 0){
		document.getElementById("myTab").children[3].style.display="none";
		document.getElementById("qso").style.display="none";
	}
	if(showDAPNETMessagesTab == 0){
		document.getElementById("myTab").children[4].style.display="none";
		document.getElementById("dapnet").style.display="none";
	}
	if(showSysInfoTab == 0){
		document.getElementById("myTab").children[5].style.display="none";
		document.getElementById("sysinfo").style.display="none";
	}
	if(showAboutTab == 0){
		document.getElementById("myTab").children[6].style.display="none";
		document.getElementById("about").style.display="none";
	}
	
	switch (defaultTab) {
		case "CurrTXTab":
			var element = document.getElementById("currtx-tab");
			element.classList.add("active");
			element = document.getElementById("currtx");
			element.classList.add("show");
			element.classList.add("active");
			break;
		case "LastHeardTab":
			var element = document.getElementById("lastheard-tab");
			element.classList.add("active");
			
			var element = document.getElementById("lastheard");
			element.classList.add("show");
			element.classList.add("active");
			break;
		case "LocalHeadTab":
			var element = document.getElementById("localheard-tab");
			element.classList.add("active");
			
			var element = document.getElementById("localheard");
			element.classList.add("show");
			element.classList.add("active");
			break;
		case "InQSOTab":
			var element = document.getElementById("qso-tab");
			element.classList.add("active");
			
			var element = document.getElementById("qso");
			element.classList.add("show");
			element.classList.add("active");
			break;
		case "DAPNETMessagesTab":
			var element = document.getElementById("dapnet-tab");
			element.classList.add("active");
			
			var element = document.getElementById("dapnet");
			element.classList.add("show");
			element.classList.add("active");
			break;
		case "SysInfoTab":
			var element = document.getElementById("sysinfo-tab");
			element.classList.add("active");
			
			var element = document.getElementById("sysinfo");
			element.classList.add("show");
			element.classList.add("active");
			break;
		case "AboutTab":
			var element = document.getElementById("about-tab");
			element.classList.add("active");
			
			var element = document.getElementById("about");
			element.classList.add("show");
			element.classList.add("active");
			break;
		default:
			var element = document.getElementById("currtx-tab");
			element.classList.add("active");
			element = document.getElementById("currtx");
			element.classList.add("show");
			element.classList.add("active");
			break;
	}
});
