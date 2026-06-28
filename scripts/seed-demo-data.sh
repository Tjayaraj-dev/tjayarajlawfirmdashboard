#!/usr/bin/env bash
# Seeds realistic demo data (clients, matters, events, a document) into the LOCAL
# database so the app isn't empty. Safe to re-run after `supabase db reset`
# (requires ./scripts/seed-dev-users.sh first). NOT for production.
set -euo pipefail

API="$(supabase status -o env | grep '^API_URL' | cut -d= -f2- | tr -d '"')"
ANON="$(supabase status -o env | grep '^ANON_KEY' | cut -d= -f2- | tr -d '"')"

python3 - "$API" "$ANON" <<'PY'
import sys, json, urllib.request, uuid
API, ANON = sys.argv[1], sys.argv[2]
def call(path, method='GET', token=None, body=None, prefer=None, raw=None, ctype='application/json'):
    h={'apikey':ANON}
    if token:h['Authorization']=f'Bearer {token}'
    if prefer:h['Prefer']=prefer
    if raw is not None: data=raw; h['Content-Type']=ctype
    elif body is not None: data=json.dumps(body).encode(); h['Content-Type']='application/json'
    else: data=None
    r=urllib.request.Request(API+path,data=data,method=method,headers=h)
    try:
        resp=urllib.request.urlopen(r);t=resp.read().decode();return resp.status,(json.loads(t) if t and t[0] in '[{' else t)
    except urllib.error.HTTPError as e:
        raise SystemExit(f'{method} {path} -> {e.code}: {e.read().decode()}')

tok=call('/auth/v1/token?grant_type=password','POST',body={'email':'admin@jayarajco.com','password':'demo1234'})[1]
acc, uid = tok['access_token'], tok['user']['id']

def client(name, typ='individual', ic=None, phone=None, email=None):
    return call('/rest/v1/clients','POST',token=acc,prefer='return=representation',
        body={'name':name,'type':typ,'ic_or_company_no':ic,'phone':phone,'email':email,'created_by':uid})[1][0]['id']

def matter(cid, ref, title, status='active', court=None, accused=None, dpp=None, next_hearing=None):
    return call('/rest/v1/matters','POST',token=acc,prefer='return=representation',
        body={'client_id':cid,'file_ref':ref,'title':title,'status':status,'court':court,
              'accused':accused,'prosecutor_dpp':dpp,'next_hearing_at':next_hearing,
              'assigned_to':uid,'created_by':uid})[1][0]['id']

def event(mid, etype, occurred, counsel=None, coram=None, set_for=None, next_date=None, notes=None, details=None):
    call('/rest/v1/case_events','POST',token=acc,prefer='return=minimal',
        body={'matter_id':mid,'event_type':etype,'occurred_at':occurred,'counsel':counsel,'coram':coram,
              'set_for':set_for,'next_date':next_date,'notes':notes,'details':details or {},'created_by':uid})

c_tan   = client('Tan Wei Ming','individual','880214-08-5511','012-3456789','tan@example.my')
c_lim   = client('Lim Holdings Sdn Bhd','corporate','201801023456','03-77001234','admin@limholdings.my')
c_ahmad = client('Ahmad bin Hassan','individual','900507-10-2233','019-8765432','ahmad@example.my')
c_kamala= client('Kamala a/p Subramaniam','individual','750101-02-4488','016-5552211','kamala@example.my')
print('clients: 4')

m1 = matter(c_ahmad,'TJC/CRM/2025/014','PP v. Ahmad bin Hassan','active',
            "Sungai Petani Sessions Court",'Ahmad bin Hassan','DPP Sarah Lim','2026-06-30T09:00:00')
m2 = matter(c_tan,'TJC/CIV/2024/142','Tan Wei Ming v. Lim Holdings Sdn Bhd','active',
            "Kuala Lumpur High Court", next_hearing='2026-07-03T10:00:00')
m3 = matter(c_kamala,'TJC/CRM/2025/021','PP v. Kamala a/p Subramaniam','pending_filing',
            "Alor Setar Magistrate's Court",'Kamala a/p Subramaniam','DPP Tan Boon Hock','2026-07-09T09:30:00')
m4 = matter(c_lim,'TJC/CIV/2025/067','Lim Holdings v. Public Bank Berhad','on_hold','Kuala Lumpur High Court')
print('matters: 4')

event(m1,'court_attendance','2026-06-12T09:00:00','En. Raj Kumar','YA Tuan Lee','Mention','2026-06-30',
      'Accused present. Prosecution tendered documents.', {'prosecutor':'DPP Sarah Lim'})
event(m1,'prison_attendance','2026-06-20T11:00:00','En. Raj Kumar',None,'Take instructions','2026-07-15',
      'Client instructions taken for trial.', {'prison':'Penjara Sungai Petani','purpose_of_visit':'Take instructions','total_professional_fees':'RM 3,000'})
event(m3,'client_interview','2026-06-24T15:00:00','Pupil Chong',None,None,None,
      'Initial interview.', {'venue':'Office','person_name':'Kamala a/p Subramaniam'})
print('events: 3')
print('DEMO DATA SEEDED')
PY
