#!/usr/bin/python3 
# -*- coding: utf-8 -*-

import datetime
import os.path
import asyncio
import logging
import argparse
import websockets
import socketserver
import configparser
import os
from collections import deque
from urllib.parse import urlparse, parse_qs
from ansi2html import Ansi2HTMLConverter
from os import popen
import psutil
import functools
from http import HTTPStatus

MIME_TYPES = {
    "html": "text/html",
    "js": "text/javascript",
    "css": "text/css"
}

current_dir = os.getcwd()
config = configparser.ConfigParser()
config.read(current_dir + '/logtailer.ini')

dmrids = {}

# init
logging.basicConfig(format='%(asctime)s %(levelname)s %(message)s', level=logging.INFO)
conv = Ansi2HTMLConverter(inline=True)


async def process_request(sever_root, path, request_headers):
    """Serves a file when doing a GET request with a valid path."""
    logging.info(request_headers)
    if "Upgrade" in request_headers:
        return  # Probably a WebSocket connection

    if path == '/':
        path = '/index.html'

    response_headers = [
        ('Server', 'asyncio websocket server'),
        ('Connection', 'close'),
    ]

    # Derive full system path
    full_path = os.path.realpath(os.path.join(sever_root, "html/" + path[1:]))

    # Validate the path
    if os.path.commonpath((sever_root, full_path)) != sever_root or \
            not os.path.exists(full_path) or not os.path.isfile(full_path):
        logging.info("HTTP GET {} 404 NOT FOUND".format(path))
        return HTTPStatus.NOT_FOUND, [], b'404 NOT FOUND'

    # Guess file content type
    extension = full_path.split(".")[-1]
    mime_type = MIME_TYPES.get(extension, "application/octet-stream")
    response_headers.append(('Content-Type', mime_type))

    # Read the whole file into memory and send it out
    body = open(full_path, 'rb').read()
    response_headers.append('Content-Length', str(len(body)))
    logging.info("HTTP GET {} 200 OK".format(path))
    return HTTPStatus.OK, response_headers, body

async def view_log(websocket, path):
    global config
    global dmrids
    logging.info('Connected, remote={}, path={}'.format(websocket.remote_address, path))

    try:
        try:
            parse_result = urlparse(path)
        except Exception:
            raise ValueError('Fail to parse URL', format(path))

        path = os.path.abspath(parse_result.path)
        now = datetime.datetime.now(datetime.timezone.utc)
        year = str(now.year)
        month = str(now.month)
        if len(month) == 1:
            month = "0" + month
        day = str(now.day)
        if len(day) == 1:
            day = "0" + day
        
        file_path = ""
        if path == "/MMDVM":
            if config['DEFAULT']['Filerotate'] == "True":
                file_path = config['MMDVMHost']['Logdir']+config['MMDVMHost']['Prefix']+"-"+year+"-"+month+"-"+day+".log"
            else:
                file_path = config['MMDVMHost']['Logdir']+config['MMDVMHost']['Prefix']+".log"
        elif path == "/DAPNET":
            if config['DEFAULT']['Filerotate'] == "True":
                file_path = config['DAPNETGateway']['Logdir']+config['DAPNETGateway']['Prefix']+"-"+year+"-"+month+"-"+day+".log"
            else:
                file_path = config['DAPNETGateway']['Logdir']+config['DAPNETGateway']['Prefix']+".log"

        if path == "/MMDVM" or path == "/DAPNET":
            logging.info(file_path)
            if not os.path.isfile(file_path):
                raise ValueError('File not found', format(file_path))

            with open(file_path, newline = '\n', encoding="utf8", errors='ignore') as f:
                content = ''.join(deque(f, int(config['DEFAULT']['MaxLines'])))
                content = conv.convert(content, full=False)
                lines = content.split("\n")
                for line in lines:
                    if line.find("received") > 0 or line.find("network watchdog") > 0:
                        if line.find("from ") > 0 and line.find("to ") > 0:
                            source = line[line.index("from ") + 5:line.index("to ")].strip()
                            if source in dmrids:
                                line = line.replace(source, dmrids[source])
                        if line.find("to ") > 0:
                            if line.find("at ") > 0 and line.find("late entry") < 0:
                                target = line[line.index("to ") + 3:line.rindex("at ")]
                                if target in dmrids:
                                    line = line.replace(target, dmrids[target])
                            else:
                                target = line[line.index("to") + 3:]
                                if target.find(",") > 0:
                                    target = target[0:target.index(",")]
                                if target in dmrids:
                                    line = line.replace(target, dmrids[target])
                    await websocket.send(line)

                while True:
                    content = f.read()
                    if content:
                        content = conv.convert(content, full=False)
                        lines = content.split("\n")
                        for line in lines:
                            if line.find("received") > 0 or line.find("network watchdog") > 0:
                                if line.find("from ") > 0 and line.find("to ") > 0:
                                    source = line[line.index("from ") + 5:line.index("to ")].strip()
                                    if source in dmrids:
                                        line = line.replace(source, dmrids[source])
                                if line.find("to ") > 0:
                                    if line.find("at ") > 0 and line.find("late entry") < 0:
                                        target = line[line.index("to ") + 3:line.rindex("at ")]
                                        if target in dmrids:
                                            line = line.replace(target, dmrids[target])
                                    else:
                                        target = line[line.index("to") + 3:]
                                        if target.find(",") > 0:
                                            target = target[0:target.index(",")]
                                        if target in dmrids:
                                            line = line.replace(target, dmrids[target])
                            await websocket.send(line)
                    else:
                        await asyncio.sleep(0.2)
        elif path == "/SYSINFO":
            while True:
                cpu_temp = ""
                temps = psutil.sensors_temperatures()
                if not temps:
                    cpu_temp = "N/A"
                for name, entries in temps.items():
                    for entry in entries:
                        cpu_temp = str(entry.current)
                cpufrqs = psutil.cpu_freq()
                cpufrq = "N/A"
                if cpufrqs:
                    cpufrq = str(cpufrqs.current)
                cpu_usage = str(psutil.cpu_percent())
                cpu_load = os.getloadavg();
                cpu_load1 = str(cpu_load[0])
                cpu_load5 = str(cpu_load[1])
                cpu_load15 = str(cpu_load[2])
                
                ram = psutil.virtual_memory()
                ram_total = str(ram.total / 2**20)
                ram_used = str(ram.used / 2**20)
                ram_free = str(ram.free / 2**20)
                ram_percent_used = str(ram.percent)
                
                disk = psutil.disk_usage('/')
                disk_total = str(disk.total / 2**30)
                disk_used = str(disk.used / 2**30)
                disk_free = str(disk.free / 2**30)
                disk_percent_used = str(disk.percent)
                await websocket.send("SYSINFO: cputemp:" + cpu_temp + " cpufrg:" + cpufrq + " cpuusage:" + cpu_usage + " cpu_load1:" + cpu_load1 + " cpu_load5:" + cpu_load5 + " cpu_load15:" + cpu_load15 + " ram_total:" + ram_total + " ram_used:" + ram_used + " ram_free:" + ram_free + " ram_percent_used:" + ram_percent_used + " disk_total:" + disk_total + " disk_used:" + disk_used + " disk_free:" + disk_free + " disk_percent_used:" + disk_percent_used)
                await asyncio.sleep(10)

    except ValueError as e:
        try:
            await websocket.send('Logtailer-Errormessage: ValueError: {}'.format(e))
            await websocket.close()
        except Exception:
            pass

        log_close(websocket, path, e)

    except Exception as e:
        try:
            await websocket.send('Logtailer-Errormessage: Error: {}'.format(e))
            await websocket.close()
        except Exception:
            pass
        log_close(websocket, path, e)

    else:
        log_close(websocket, path)


def log_close(websocket, path, exception=None):
    message = 'Closed, remote={}, path={}'.format(websocket.remote_address, path)
    if exception is not None:
        message += ', exception={}'.format(exception)
    logging.info(message)


def websocketserver():
    start_server = websockets.serve(view_log, config['DEFAULT']['Host'], config['DEFAULT']['Port'])
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()



def main():
    dmr_id_lookup = config['MMDVMHost']['DMR_ID_Lookup']
    dmr_id_lookupfile = config['MMDVMHost']['DMR_ID_LookupFile']
    
    if dmr_id_lookup == "1":
        if not os.path.isfile(dmr_id_lookupfile):
            raise ValueError('File not found', format(dmr_id_lookupfile))
        
        f = open(dmr_id_lookupfile, 'r')
        lines = f.readlines()
        separator = "\t"
        for line in lines:
            if line.find(" "):
                separator = " "
            if line.find(";"):
                separator = ";"
            if line.find(","):
                separator = ","
            if line.find("\t"):
                separator = "\t"
            tokens = line.split(separator)
            dmrids[tokens[0]] = tokens[1] + "$" + tokens[2].replace("\r", "").replace("\n", "") + "$"
    
    logging.info("Starting Websocketserver")
    websocketserver()


if __name__ == '__main__':
    main()
