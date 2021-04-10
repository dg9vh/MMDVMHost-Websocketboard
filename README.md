# MMDVMHost-Websocketboard

## Introduction
This is a very first development version of my new MMDVMDash using websockets-technology to get rid of high load on Raspberry Pi and others and keep those temperature down.

Also this should improve user experience.

## Key Features
* Websockets for reducing load on the hotspot/repeater
* Currently TXing on all timeslots
* Last-Heard-List
* QSO-net-management
* Local Heard-List
* DAPNET messages with decoding of Skyper-messages, -rubrics and METAR-messages
* System-Info-panel for visualize system health
* Automatically detecting clients timezone for displaying timestamps in local behavior
* Easier to customize the html-page because client-part persists in html and javascript-files

## Technical Details
The Dashboard persists in detail in 3 components: two on the server (Hotspot/Repeater) side and on on the browser.

The two server sided components are the logtailer.py (which communicates via websocket with your browser and streams the logs to it for processing) and the webserver-component from python3 (which is serving the needed html and javascript infrastructure to your browser).

The client based component is the javascript processing the streamed log lines and filling the tables.

## Used Ports

By default following Ports are used for running the Dashboard:
* 8000 TCP: webservice
* 5678 TCP: Websocket

## Installation
You'll need to install several python3 modules. A concrete list will follow here later.
Actually known:
* websockets: `sudo apt install python3-websockets`
* ansi2html: `sudo pip3 install ansi2html`
* gpiozero: `sudo apt install python3-gpiozero`
* psutil: `sudo apt install python3-psutil`
* pyserial: `sudo apt-get install python3-serial`

### Recommendations
* take care to set Loglevel for FileLevel = 2 in your MMDVM.ini
* also set debug = 0 on each section to avoid irritating output on the Dashboard
* Python3.7 at least must be instaled

### Installation steps
* first of all (if not already done by installation of MMDVMHost): create a syetemuser with `sudo adduser --system --no-create-home --group mmdvm`
* also add the new user to the group "dialout" with `usermod -a -G dialout mmdvm`
* add following line to /etc/sudoers with `sudo visudo` for getting the logtailer access to MMDVMHost: `www-data ALL=(ALL) NOPASSWD: /usr/local/bin/MMDVMHost`
* clone this repository to your home-directory with `git clone --recurse-submodules -j8 https://github.com/dg9vh/MMDVMHost-Websocketboard` to clone the repository with it's submodules
* create directory with `sudo mkdir /opt/MMDVMDash`
* copy all files from repository into this folder
* change ownership to user mmdvm for example with `sudo chown -R mmdvm:mmdvm /opt/MMDVMDash`
* modify *logtailer.ini* to fit your needs
* modify */html/js/config.js* to fit your needs, here you can switch on/off tabs showing or enable debug for getting some output in javascript console. You should take a look into this file - here are different options you can configure.
* copy files in */opt/MMDVMDash/systemd* to */etc/systemd/system* or similar corresponding to your system
* modify both scripts to fit your needs
* enable services with following commmands, this results in starting both automatically after reboot:
  * `sudo systemctl enable http.server.service`
  * `sudo systemctl enable logtailer.service`
* start services with following commmands:
  * `sudo systemctl start http.server.service`
  * `sudo systemctl start logtailer.service`

Finally you should be able to get the new Dashboard calling the hostname of your hotspot and port 8000 (default) in your broser

### Troubleshoting
If you have any trouble running the software most things depend on the logtailer-component. So it is a good idea to try starting the software on the console with
`python3 ./logtailer.py` to see the output of the program. A common error are missing python-libraries you should install with the commands mentioned above.

If you found any further missing library let me know! Just open an issue!

If there are problems with paths for logfiles you also could get some impressions with the output of the program.

### If using DMRHost by BrandMeister-Team
If you are using the DMRHost as replacement for MMDVMHost you should enable DMR-ID-Lookup within logtailer.ini by setting the corresponding option = 1
Also take care to configure the filepath to the correct location of your DMRIds.dat.

For updating the DMRIds.dat you can use the script you find in scripts-folder.

### Configuration of Talkgroup-Textes in "Target"-column
You will find a file in /html/data called "TG_List.csv" that is a comma-separated file of following format:
```
MODE,TS,TG,LABEL,URL
DMR,1,263,DL Multimode BM,
DMR,2,8021,Pegasus DMR-DL,
DMR,2,2625,RLP/SL BM,
YSF,0,1,Local Parrot,
YSF,0,2,DEV Reflector,
YSF,0,10,YSF2DMR TG26250,
YSF,0,40,DL Multimode 263,https://c4fm.ysfreflector.de/Germany/
```
First row leave untouched for orientation. The other lines contains on first column the DMR-timeslot the TG is used, second column contains the talkgroup-number and third column contains the label you want to be shown in the target-column of the dashboard.

Please edit this file to your needs. It may change on developer-side from time by time so when updating keep a copy of your personal list to modify/edit it.

If you do not want to have this Talkgroup-textes in your dashboard, simply remove all but the first line in this file.
## Best Practise Installation
For getting the best user experience it is recommended to configure your MMDVMHost and other G4KLX-software with the following parameter:

`FileRotate=0`

This results in having only one logfile for each program and having it rotated by your linux-system with logrotate if configured.

You should also configure your logtailer.ini with

`FileRotate=False`

to have the logtailer in correct behaviour for reading this file.

To configure log rotation in Linux take a look at https://www.tecmint.com/install-logrotate-to-manage-log-rotation-in-linux/.

## Credits

*logtailer.py* is based on the work of http://shzhangji.com/blog/2017/07/15/log-tailer-with-websocket-and-python/

## Screenshots
![Screenshot of MMDVMDash Websocketboard](img/Screenshot.png "Screenshot of MMDVMDash Websocketboard")



