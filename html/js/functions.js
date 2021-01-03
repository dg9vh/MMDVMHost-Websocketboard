var messagecount = 0;
var ts1TXing = null;
var ts2TXing = null;
var ts1timestamp = "";
var ts2timestamp = "";

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
function getLocaltimeFromTimestamp(timestamp) {
	logIt(timestamp);
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

function getRawTarget(logline) {
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

function getTarget(logline) {
	target = getRawTarget(logline);
	if (showBMTGLink && getMode(logline).startsWith("DMR")) {
		bmlink = "https://brandmeister.network/?page=lh&DestinationID=";
		linkTarget = target.substring(3);
		link = '<a href="' + bmlink + linkTarget + '" target="_new">' + target + '</a>';
		return link;
	} else {
		return target;
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
		var date = new Date().toISOString().split('T')
		t_qso.row.add( [
			callsign,
			getLocaltimeFromTimestamp(date[0] + " " + date[1].substring(0, date[1].indexOf("."))),
			""
		] ).draw(false);
	});
	alert("" + callsign + " added to in QSO-Tab");
	
}

function getCurrentTXing() {
	ts1 = null;
	ts2 = null;
	if (ts1TXing != null) {
		ts1 = ts1TXing.split(";");
		ts1[4] = Math.round((Date.now() - Date.parse(ts1timestamp.replace(" ","T")+".000Z"))/1000);
		t_qso.rows( function ( idx, data, node ) {
			if(data[0] == ts1[1]){
				data[2] = ts1timestamp;
				$('#inQSO').dataTable().fnUpdate(data,idx,undefined,false);
			}
		}).draw(false);
	}
	if (ts2TXing != null) {
		ts2 = ts2TXing.split(";");
		ts2[4] = Math.round((Date.now() - Date.parse(ts2timestamp.replace(" ","T")+".000Z"))/1000);
		t_qso.rows( function ( idx, data, node ) {
			if(data[0] == ts2[1]){
				data[2] = ts2timestamp;
				$('#inQSO').dataTable().fnUpdate(data,idx,undefined,false);
			}
		}).draw(false);
	}
	t_ct.clear().draw(false);
	if (ts1 != null) {
		t_ct.row.add( [
			ts1[0],
			ts1[1],
			ts1[2],
			ts1[3],
			ts1[4]
		] ).draw(false);
	}
	if (ts2 != null) {
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
// 00000000001111111111222222222233333333334444444444555555555566666666667777777777888888888899999999990000000000111111111122222222223333333333
// 01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
// M: 2020-11-01 21:33:27.454 YSF, received network data from DG2MAS     to DG-ID 0 at DG2MAS
// M: 2020-11-01 21:33:35.025 YSF, received network end of transmission from DG2MAS     to DG-ID 0, 7.7 seconds, 0% packet loss, BER: 0.0%
// M: 2020-12-03 05:16:12.492 MMDVMHost-20201031 is starting
// M: 2020-12-03 05:16:12.492 Built 19:36:25 Nov 12 2020 (GitID #c800a4d)
// I: 2020-12-03 20:07:45.951 MMDVM protocol version: 1, description: MMDVM_HS_Dual_Hat-v1.5.2 20201108 14.7456MHz dual ADF7021 FW by CA6JAU GitID #89daa20
// I: 2020-12-03 20:07:45.973     Callsign: DG9VH
// I: 2020-12-03 20:07:43.940     Id: 262509403
// I: 2020-12-03 20:07:45.973     RX Frequency: 430412500Hz
// I: 2020-12-03 20:07:45.973     TX Frequency: 439812500Hz
	$(document).ready(function() {
		lines = event.data.split("\n");
		var duration = 0;
		lines.forEach(function(line, index, array) {
			logIt(line);
			
			if (line.indexOf("MMDVMHost") > 0 ) {
				mmdvmhost_version = line.substring(line.indexOf("MMDVMHost"));
				mmdvmhost_version = mmdvmhost_version.substring(0, mmdvmhost_version.indexOf(" "));
				document.getElementById("mmdvmhost_version").innerHTML = mmdvmhost_version;
			}
			
			if (line.indexOf("Built") > 0 ) {
				built = line.substring(line.indexOf("Built") + 6);
				document.getElementById("built").innerHTML = built;
			}
			
			if (line.indexOf("description:") > 0 ) {
				modem = line.substring(line.indexOf("description:") + 12);
				document.getElementById("modem").innerHTML = modem;
			}
			
			if (line.indexOf("Callsign:") > 0 ) {
				callsign = line.substring(line.indexOf("Callsign:") + 10);
				document.getElementById("callsign").innerHTML = callsign;
			}
			
			
			if (line.indexOf("Id:") > 0 ) {
				dmrid = line.substring(line.indexOf("Id:") + 4);
				document.getElementById("dmrid").innerHTML = dmrid;
			}
			
			if (line.indexOf("RX Frequency:") > 0 ) {
				rxqrg = line.substring(line.indexOf("RX Frequency:") + 14, 54);
				document.getElementById("rxqrg").innerHTML = getMHZ(rxqrg) + " MHz";
			}
			
			if (line.indexOf("TX Frequency:") > 0 ) {
				txqrg = line.substring(line.indexOf("TX Frequency:") + 14, 54);
				document.getElementById("txqrg").innerHTML = getMHZ(txqrg) + " MHz";
			}
			
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
						if (getMode(line) == "DMR Slot 1" ) {
							duration = Math.round(Date.parse(getRawTimestamp(line).replace(" ","T")+".000Z")/1000 - Date.parse(ts1timestamp.replace(" ","T")+".000Z")/1000);
						} else {
							duration = Math.round(Date.parse(getRawTimestamp(line).replace(" ","T")+".000Z")/1000 - Date.parse(ts2timestamp.replace(" ","T")+".000Z")/1000);
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
								$('#lastHeard').dataTable().fnUpdate(newData,t_lh.data().rowIndexes[0],undefined,false);
							} else {
								logIt("Problem replacing watchdog! Indices: " + rowIndexes);
								t_lh.row(rowIndexes[0]).remove().draw(false);
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
					if (txing) {
						$(row).addClass('red');
					} else {
						$(row).removeClass('red');
					}
					var temp = t_lh.row(rowIndexes[0]).data();
					temp[5] = duration;
					$('#lastHeard').dataTable().fnUpdate(temp,rowIndexes[0],undefined,false);
				}
			}
		});
	});
}

function getLocalHeard(document, event) {
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
					] ).draw(false);
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
			
			var element = document.getElementById("currtx");
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
			
			var element = document.getElementById("currtx");
			element.classList.add("show");
			element.classList.add("active");
			break;
	}
});
