// 00000000001111111111222222222233333333334444444444555555555566666666667777777777888888888899999999990000000000111111111122222222223333333333
// 01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
// M: 2020-11-01 21:33:27.454 YSF, received network data from DG2MAS     to DG-ID 0 at DG2MAS
// M: 2020-11-01 21:33:35.025 YSF, received network end of transmission from DG2MAS     to DG-ID 0, 7.7 seconds, 0% packet loss, BER: 0.0%
function getTimestamp(logline) {
	return logline.substring(3,22);
}

function getMode(logline) {
	return logline.substring(27, logline.indexOf(","));
}

function getCallsign(logline) {
	return logline.substring(logline.indexOf("from") + 5, logline.indexOf("to"));
}

function getTarget(logline) {
	if(logline.indexOf("at") > 0) {
		return logline.substring(logline.indexOf("to") + 3, logline.lastIndexOf("at"));
	} else {
		return logline.substring(logline.indexOf("to") + 3, logline.substring(logline.indexOf("to") + 3).indexOf(",") + logline.indexOf("to") + 3);
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
	retval = '<div class="bd-clipboard"><button type="button" class="btn-cpQSO" title="Copy to QSO" id="' + getCallsign(logline) + '" onclick="copyToQSO(\'' + getCallsign(logline) + '\')">Copy</button></div>';
	return retval;
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
		var rowIndexes = [];
		t_lh.rows( function ( idx, data, node ) {
			if(data[2] === getCallsign(event.data)){
				rowIndexes.push(idx);
			}
			return false;
		});
		if (rowIndexes[0]) {
			newData = [
				getTimestamp(event.data),
				getMode(event.data),
				getCallsign(event.data),
				getTarget(event.data),
				getSource(event.data),
				getDuration(event.data),
				getLoss(event.data),
				getBER(event.data),
				getAddToQSO(event.data)
			]
			t_lh.row(rowIndexes[0]).data( newData ).draw();
		} else {
			t_lh.row.add( [
				getTimestamp(event.data),
				getMode(event.data),
				getCallsign(event.data),
				getTarget(event.data),
				getSource(event.data),
				getDuration(event.data),
				getLoss(event.data),
				getBER(event.data),
				getAddToQSO(event.data)
			] ).draw();
		}
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
