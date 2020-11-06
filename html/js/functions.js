var messagecount = 0;

// 00000000001111111111222222222233333333334444444444555555555566666666667777777777888888888899999999990000000000111111111122222222223333333333
// 01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
// M: 2020-11-01 21:33:27.454 YSF, received network data from DG2MAS     to DG-ID 0 at DG2MAS
// M: 2020-11-01 21:33:35.025 YSF, received network end of transmission from DG2MAS     to DG-ID 0, 7.7 seconds, 0% packet loss, BER: 0.0%

function logIt(message) {
	if (debug == 1) {
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

function getTarget(logline) {
	if(logline.indexOf("at") > 0) {
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
		val = logline.substring(logline.lastIndexOf("seconds") + 9, logline.indexOf("%"));
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
		message = message + "<br> Decoded: " + JSON.stringify(parseMETAR(message));
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

function getLastHeard(document, event) {
// 00000000001111111111222222222233333333334444444444555555555566666666667777777777888888888899999999990000000000111111111122222222223333333333
// 01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
// M: 2020-11-01 21:33:27.454 YSF, received network data from DG2MAS     to DG-ID 0 at DG2MAS
// M: 2020-11-01 21:33:35.025 YSF, received network end of transmission from DG2MAS     to DG-ID 0, 7.7 seconds, 0% packet loss, BER: 0.0%
	$(document).ready(function() {
		lines = event.data.split("\n");
		lines.forEach(function(line, index, array) {
			logIt(line);
			if (line.indexOf("Talker Alias") < 0 && line.indexOf("Downlink Activate") < 0 && line.indexOf("network watchdog") < 0 && line.indexOf("Preamble CSBK") < 0 && line.indexOf("data header") < 0 && line.indexOf("0000:") < 0 && line.length > 0 && line.indexOf("received") > 0 ) {
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
					if(data[2] === callsign){
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
					t_lh.row(rowIndexes[0]).data( newData ).draw();
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
		});
	});
}

function getLocalHeard(document, event) {
// 00000000001111111111222222222233333333334444444444555555555566666666667777777777888888888899999999990000000000111111111122222222223333333333
// 01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
// M: 2020-11-01 21:33:27.454 YSF, received network data from DG2MAS     to DG-ID 0 at DG2MAS
// M: 2020-11-01 21:33:35.025 YSF, received network end of transmission from DG2MAS     to DG-ID 0, 7.7 seconds, 0% packet loss, BER: 0.0%
	$(document).ready(function() {
		if (getSource(event.data) == "RF") {
			if (getDuration(event.data) !== "") {
				t_localh.row.add( [
					getTimestamp(event.data),
					getMode(event.data),
					getCallsign(event.data),
					getTarget(event.data),
					getSource(event.data),
					getDuration(event.data),
					getBER(event.data)
				] ).draw();
			}
		}
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
