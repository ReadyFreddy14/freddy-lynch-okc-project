from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import argparse

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description='Serve Courtside locally.')
    parser.add_argument('--port',type=int,default=8767)
    args=parser.parse_args()
    root=Path(__file__).resolve().parent
    server=ThreadingHTTPServer(('127.0.0.1',args.port),partial(SimpleHTTPRequestHandler,directory=str(root)))
    print(f'Courtside: http://127.0.0.1:{args.port}/ (Ctrl+C to stop)',flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()
