# MMDVMHost-Websocketboard

## Introduction
This is a very first development version of my new MMDVMDash using websockets-technology to get rid of high load on Raspberry Pi and others and keep those temperature down.

Also this should improve user experience.

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

### Recommendations
* take care to set Loglevel for FileLevel = 2 in your MMDVM.ini
* also set debug = 0 on each section to avoid irritating output on the Dashboard
* Python3.7 at least must be instaled

### Installation steps
* clone this repository to your home-directory with `git clone --recurse-submodules -j8 https://github.com/dg9vh/MMDVMHost-Websocketboard` to clone the repository with it's submodules
* create directory with `sudo mkdir /opt/MMDVMDash`
* change ownership to your user for example with `sudo chown -R pi /opt/MMDVMDash`
* copy all files from repository into this folder
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

### If using DMRHost by BrandMeister-Team
If you are using the DMRHost as replacement for MMDVMHost you should enable DMR-ID-Lookup within logtailer.ini by setting the corresponding option = 1
Also take care to configure the filepath to the correct location of your DMRIds.dat.

For updating the DMRIds.dat you can use the script you find in scripts-folder.

## Credits

*logtailer.py* is based on the work of http://shzhangji.com/blog/2017/07/15/log-tailer-with-websocket-and-python/

## Screenshots
![Screenshot of MMDVMDash Websocketboard](img/Screenshot.png "Screenshot of MMDVMDash Websocketboard")



