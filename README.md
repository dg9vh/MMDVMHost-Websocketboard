# MMDVMHost-Websocketboard

## Introduction
This is a very first development version of my new MMDVMDash using websockets-technology to get rid of high load on Raspberry Pi and others and keep those temperature down.

Also this should improve user experience.

## Installation
You'll need to install several python3 modules. A concrete list will follow here later.

### Installation steps
* clone this repository to your home-directory
* create directory with `sudo mkdir /opt/MMDVMDash`
* change ownership to your user for example with `sudo chown -R pi /opt/MMDVMDash`
* copy all files from repository into this folder
* modify *logtailer.ini* to fit your needs
* copy files in */opt/MMDVMDash/systemd* to */etc/systemd/system* or similar corresponding to your system
* modify both scripts to fit your needs
* enable services with following commmands, this results in starting both automatically after reboot:
  * `sudo systemctl enable http.server.service`
  * `sudo systemctl enable logtailer.service`
* start services with following commmands:
  * `sudo systemctl enable http.server.service`
  * `sudo systemctl enable logtailer.service`

Finally you should be able to get the new Dashboard calling the hostname of your hotspot

## Screenshots
![Screenshot of MMDVMDash Websocketboard](img/Screenshot.png "Screenshot of MMDVMDash Websocketboard")