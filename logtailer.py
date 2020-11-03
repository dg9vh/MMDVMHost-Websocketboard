#!/usr/bin/python3 
# -*- coding: utf-8 -*-

#import time
import datetime
import os.path
import asyncio
import logging
import argparse
import websockets
import http.server
import socketserver
import configparser
import os
from collections import deque
from urllib.parse import urlparse, parse_qs
from ansi2html import Ansi2HTMLConverter
from threading import Thread

current_dir = os.getcwd()
config = configparser.ConfigParser()
config.read(current_dir + '/logtailer.ini')

NUM_LINES = int(config['MMDVMHost']['Num_Lines'])

# init
logging.basicConfig(format='%(asctime)s %(levelname)s %(message)s', level=logging.INFO)
conv = Ansi2HTMLConverter(inline=True)

@asyncio.coroutine
def view_log(websocket, path):
    global config
    logging.info('Connected, remote={}, path={}'.format(websocket.remote_address, path))

    try:
        now = datetime.datetime.now()
        year = str(now.year)
        month = str(now.month)
        if len(month) == 1:
            month = "0" + month
        day = str(now.day)
        if len(day) == 1:
            day = "0" + day

        file_path = config['MMDVMHost']['Logdir']+config['MMDVMHost']['Prefix']+"-"+year+"-"+month+"-"+day+".log"

        if not os.path.isfile(file_path):
            raise ValueError('Not found')

        path = file_path
        with open(file_path) as f:

            content = ''.join(deque(f, NUM_LINES))
            content = conv.convert(content, full=False)
            lines = content.split("\n")
            for line in lines:
                if line.find('received') >0 and not line.find('network watchdog') > 0:
                    yield from websocket.send(line)

            while True:
                content = f.read()
                if content:
                    content = conv.convert(content, full=False)
                    yield from websocket.send(content)
                else:
                    yield from asyncio.sleep(1)

    except ValueError as e:
        try:
            yield from websocket.send('<font color="red"><strong>{}</strong></font>'.format(e))
            yield from websocket.close()
        except Exception:
            pass

        log_close(websocket, path, e)

    except Exception as e:
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
    websocketserver()


if __name__ == '__main__':
    main()
