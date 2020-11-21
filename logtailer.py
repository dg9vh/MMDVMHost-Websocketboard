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
from gpiozero import CPUTemperature
from os import popen
import psutil

current_dir = os.getcwd()
config = configparser.ConfigParser()
config.read(current_dir + '/logtailer.ini')

dmrids = {}

# init
logging.basicConfig(format='%(asctime)s %(levelname)s %(message)s', level=logging.INFO)
conv = Ansi2HTMLConverter(inline=True)

@asyncio.coroutine
def view_log(websocket, path):
    global config
    global dmrids
    logging.info('Connected, remote={}, path={}'.format(websocket.remote_address, path))

    try:
        try:
            parse_result = urlparse(path)
        except Exception:
            raise ValueError('Fail to parse URL', format(path))

        NUM_LINES = int(config['MMDVMHost']['Num_Lines'])
        path = os.path.abspath(parse_result.path)
        now = datetime.datetime.now()
        year = str(now.year)
        month = str(now.month)
        if len(month) == 1:
            month = "0" + month
        day = str(now.day)
        if len(day) == 1:
            day = "0" + day
        
        file_path = ""
        if path == "/MMDVM":
            file_path = config['MMDVMHost']['Logdir']+config['MMDVMHost']['Prefix']+"-"+year+"-"+month+"-"+day+".log"
        elif path == "/DAPNET":
            file_path = config['DAPNETGateway']['Logdir']+config['DAPNETGateway']['Prefix']+"-"+year+"-"+month+"-"+day+".log"
            NUM_LINES = 0
        if path == "/MMDVM" or path == "/DAPNET":
            logging.info(file_path)
            if not os.path.isfile(file_path):
                raise ValueError('File not found', format(file_path))

            with open(file_path, newline = '\n', encoding="utf8", errors='ignore') as f:

                content = ''.join(deque(f, NUM_LINES))
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
                    yield from websocket.send(line)

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
                            yield from websocket.send(line)
                    else:
                        yield from asyncio.sleep(0.2)
        elif path == "/SYSINFO":
            while True:
                cpu = CPUTemperature()
                f = open("/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq")
                cpufrq = str((int(f.read()) / 1000))
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
                yield from websocket.send("SYSINFO: cputemp:" + str(cpu.temperature) + " cpufrg:" + cpufrq + " cpuusage:" + cpu_usage + " cpu_load1:" + cpu_load1 + " cpu_load5:" + cpu_load5 + " cpu_load15:" + cpu_load15 + " ram_total:" + ram_total + " ram_used:" + ram_used + " ram_free:" + ram_free + " ram_percent_used:" + ram_percent_used + " disk_total:" + disk_total + " disk_used:" + disk_used + " disk_free:" + disk_free + " disk_percent_used:" + disk_percent_used)
                yield from asyncio.sleep(10)

    except ValueError as e:
        try:
            yield from websocket.send('Logtailer-Errormessage: ValueError: {}'.format(e))
            yield from websocket.close()
        except Exception:
            pass

        log_close(websocket, path, e)

    except Exception as e:
        try:
            yield from websocket.send('Logtailer-Errormessage: Error: {}'.format(e))
            yield from websocket.close()
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
        for line in lines:
            tokens = line.split("\t")
            dmrids[tokens[0]] = tokens[1]
    
    logging.info("Starting Websocketserver")
    websocketserver()


if __name__ == '__main__':
    main()
