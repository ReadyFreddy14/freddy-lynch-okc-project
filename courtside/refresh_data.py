"""Refresh the independent app's NBA snapshot; validate every shot total before writing."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import csv,io,json,urllib.request,hashlib
ROOT=Path(__file__).resolve().parent
BASE='https://raw.githubusercontent.com/fuku8/nba-data/main/data/'
def download(path):
    with urllib.request.urlopen(BASE+path,timeout=35) as response:return response.read()
def refresh():
    totals_bytes=download('player_totals.csv');profiles_bytes=download('player_profiles.csv')
    totals=list(csv.DictReader(io.StringIO(totals_bytes.decode('utf-8-sig'))))
    profiles={int(r['PLAYER_ID']):r for r in csv.DictReader(io.StringIO(profiles_bytes.decode('utf-8-sig')))}
    def player(r):
        pid=int(r['PLAYER_ID']);p=profiles.get(pid,{})
        shots=json.loads(download(f'shots/{pid}.json'))['rs']
        assert len(shots)==int(r['FGA']) and sum(s[2] for s in shots)==int(r['FGM']),f'Shot totals differ for {pid}; source may be mid-update.'
        try: ft,inch=map(int,p.get('HEIGHT','6-6').split('-'));height=round((12*ft+inch)*.0254,3)
        except ValueError:height=1.98
        return dict(id=pid,name=r['PLAYER_NAME'],team=r['TEAM_ABBREVIATION'],position=p.get('POSITION','Player'),height=height,jersey=p.get('JERSEY',''),games=int(r['GP']),minutes=round(float(r['MIN']),1),fgm=int(r['FGM']),fga=int(r['FGA']),threeMade=int(r['FG3M']),threeAttempts=int(r['FG3A']),blocks=int(r['BLK']),steals=int(r['STL']),shots=shots)
    with ThreadPoolExecutor(max_workers=8) as pool:players=list(pool.map(player,totals))
    players.sort(key=lambda p:p['name']);season=download('season.txt').decode().strip()
    data=dict(season=season,retrieved=datetime.now(timezone.utc).date().isoformat(),source='https://github.com/fuku8/nba-data',coverage='All players in the source regular-season totals; not an all-time roster or live feed.',players=players,totalShots=sum(len(p['shots']) for p in players))
    temp=ROOT/'data.json.tmp';temp.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8');temp.replace(ROOT/'data.json')
    (ROOT/'source_manifest.json').write_text(json.dumps(dict(retrieved=data['retrieved'],season=season,source=data['source'],inputs=['player_totals.csv','player_profiles.csv','season.txt','shots/{PLAYER_ID}.json:rs'],players=len(players),shots=data['totalShots'],totals_sha256=hashlib.sha256(totals_bytes).hexdigest(),profiles_sha256=hashlib.sha256(profiles_bytes).hexdigest(),data_sha256=hashlib.sha256((ROOT/'data.json').read_bytes()).hexdigest(),validation='All per-player shot counts and makes match season totals'),indent=2),encoding='utf-8')
    print(f'Refreshed {len(players)} players, {data["totalShots"]:,} shots ({season}).')
if __name__=='__main__':refresh()
