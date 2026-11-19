#!/usr/bin/env python3
"""Pull who is serving at the next Rochester Campus service from Planning Center
Services and write it to data/pco.js for the Production Hub's PCO tab.

Runs every morning from .github/workflows/refresh-pco.yml. To run it by hand:
  PCO_APP_ID=... PCO_SECRET=... python3 scripts/refresh_pco.py

Privacy: the site is public, so only first name + last initial ("Alex K.") is
written. No emails, phone numbers or Planning Center person IDs leave PCO.
"""
import base64, datetime, json, os, re, sys, urllib.error, urllib.request

ST = '34139'  # Rochester Campus service type (same as the PCO-Updates script)
BASE = os.environ.get('PCO_BASE', 'https://api.planningcenteronline.com/services/v2')
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'pco.js')

# Which PCO teams go in which category on the page. A team goes in the first
# category whose keywords appear in its name (case doesn't matter). Teams that
# match nothing are left off the page and listed in the run log.
CATEGORIES = [
    ('Choir', ['choir']),
    ('Audio', ['audio', 'sound', 'foh', 'monitor mix']),
    ('Production', ['production', 'video', 'camera', 'lighting', 'lights', 'graphics',
                    'propresenter', 'broadcast', 'stream', 'switch', 'director', 'tech', 'stage']),
    ('Music', ['band', 'vocal', 'music', 'worship', 'instrument']),
]

AUTH = 'Basic ' + base64.b64encode(
    f"{os.environ['PCO_APP_ID']}:{os.environ['PCO_SECRET']}".encode()).decode()


def req(path):
    url = path if path.startswith('http') else BASE + path
    r = urllib.request.Request(url, headers={'Authorization': AUTH})
    try:
        with urllib.request.urlopen(r, timeout=30) as f:
            return json.loads(f.read())
    except urllib.error.HTTPError as e:
        sys.exit(f'PCO GET {url} -> {e.code}: {e.read().decode()[:300]}')


def short_name(full):
    """'Alex Kingston' -> 'Alex K.'; 'Robert (Bob) Smith' -> 'Bob S.'"""
    nick = re.findall(r'\((.*?)\)', full or '')
    parts = re.sub(r'\s*\(.*?\)\s*', ' ', full or '').split()
    if not parts:
        return ''
    first = nick[0].strip() if nick and nick[0].strip() else parts[0]
    return f'{first} {parts[-1][0]}.' if len(parts) > 1 else first


def category(team_name):
    t = (team_name or '').lower()
    for name, words in CATEGORIES:
        if any(w in t for w in words):
            return name
    return None


def natural(s):
    return [int(x) if x.isdigit() else x.lower() for x in re.split(r'(\d+)', s or '')]


def parse_time(s):
    return datetime.datetime.fromisoformat(s.replace('Z', '+00:00'))


def service_times(plan_id):
    times = req(f'/service_types/{ST}/plans/{plan_id}/plan_times?per_page=50')['data']
    out = [t['attributes'] for t in times if t['attributes'].get('time_type') == 'service']
    return sorted(out, key=lambda a: a['starts_at'])


def next_plan():
    """The plan holding the next service that hasn't ended yet. A Rochester plan can
    cover Thursday and Sunday, so last week's plan is checked too: on a Friday its
    Sunday service is still upcoming."""
    now = datetime.datetime.now(datetime.timezone.utc)
    past = req(f'/service_types/{ST}/plans?filter=past&order=-sort_date&per_page=1')['data']
    future = req(f'/service_types/{ST}/plans?filter=future&order=sort_date&per_page=3')['data']
    for plan in past + future:
        times = service_times(plan['id'])
        # a service counts as upcoming until 2 hours after it starts
        if any(parse_time(t['starts_at']) + datetime.timedelta(hours=2) >= now for t in times):
            return plan, times
    return None, []


def main():
    plan, times = next_plan()
    data = {'updated': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
            'plan': None, 'groups': [], 'unmatchedTeams': []}
    if plan:
        a = plan['attributes']
        pid = plan['id']
        members = req(f'/service_types/{ST}/plans/{pid}/team_members?per_page=100&include=team')
        teams = {t['id']: t['attributes']['name'].strip()
                 for t in members.get('included', []) if t['type'] == 'Team'}
        needed = req(f'/service_types/{ST}/plans/{pid}/needed_positions?per_page=100&include=team')
        teams.update({t['id']: t['attributes']['name'].strip()
                      for t in needed.get('included', []) if t['type'] == 'Team'})

        groups, unmatched = {}, set()

        def add(team_id, row):
            team = teams.get(team_id, '')
            cat = category(team)
            if not cat:
                unmatched.add(team or '(no team)')
                return
            groups.setdefault(cat, []).append(dict(row, team=team))

        for m in members['data']:
            ma = m['attributes']
            if ma.get('status') == 'D':  # declined
                continue
            tid = ((m['relationships'].get('team') or {}).get('data') or {}).get('id')
            add(tid, {'position': (ma.get('team_position_name') or '').strip(),
                      'name': short_name(ma.get('name')),
                      'status': 'confirmed' if ma.get('status') == 'C' else 'pending'})
        for n in needed['data']:
            na = n['attributes']
            tid = ((n['relationships'].get('team') or {}).get('data') or {}).get('id')
            for _ in range(int(na.get('quantity') or 1)):
                add(tid, {'position': (na.get('team_position_name') or '').strip(), 'name': '', 'status': 'open'})

        order = [c for c, _ in CATEGORIES if c != 'Choir'] + ['Choir']  # Audio, Production, Music, then Choir
        for cat in order:
            rows = groups.get(cat)
            if rows:
                rows.sort(key=lambda r: (natural(r['position']), r['status'] == 'open', r['name'].lower()))
                data['groups'].append({'name': cat, 'members': rows})
        data['unmatchedTeams'] = sorted(unmatched)
        data['plan'] = {
            'id': pid,
            'dates': a.get('dates'),
            'title': a.get('title'),
            'series': a.get('series_title'),
            'times': [{'startsAt': t['starts_at'], 'name': t.get('name')} for t in times],
            'url': f'https://services.planningcenteronline.com/plans/{pid}',
        }

    body = ('/* Generated every morning by scripts/refresh_pco.py. Do not edit by hand:\n'
            '   changes here are overwritten at the next refresh. */\n'
            'window.ROC = window.ROC || {};\n\n'
            'ROC.pco = ' + json.dumps(data, indent=2, ensure_ascii=False) + ';\n')
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(body)

    if plan:
        n = sum(len(g['members']) for g in data['groups'])
        print(f"Next service: {plan['attributes'].get('dates')} (plan {plan['id']}), {n} rows in "
              + ', '.join(f"{g['name']} {len(g['members'])}" for g in data['groups']))
    else:
        print('No upcoming Rochester service found.')
    if data['unmatchedTeams']:
        print('Teams not shown (no category matched):', ', '.join(data['unmatchedTeams']))


if __name__ == '__main__':
    main()
