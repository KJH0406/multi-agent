import requests
from base64 import b64encode
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import csv
from flatten_json import flatten

load_dotenv()

# Mixpanel API 인증 정보
API_SECRET = os.environ['API_SECRET']
PROJECT_ID = os.environ['PROJECT_ID']

# API 엔드포인트
BASE_URL = "https://data.mixpanel.com/api/2.0/export"

# 인증 헤더 생성
def get_auth_header():
    credentials = f"{API_SECRET}:"
    encoded_credentials = b64encode(credentials.encode("utf-8")).decode("ascii")
    return {"Authorization": f"Basic {encoded_credentials}"}

# raw 데이터 가져오기
def get_raw_data(from_date, to_date):
    params = {
        "from_date": from_date.strftime("%Y-%m-%d"),
        "to_date": to_date.strftime("%Y-%m-%d")
    }
    
    try:
        print(f"Requesting data from {from_date.strftime('%Y-%m-%d')} to {to_date.strftime('%Y-%m-%d')}")
        response = requests.get(BASE_URL, headers=get_auth_header(), params=params, stream=True)
        response.raise_for_status()
        
        event_count = 0
        
        for line in response.iter_lines():
            if line:
                event = json.loads(line)
                event_count += 1
                yield event
        
        print(f"Total events: {event_count}")
        
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        if response.text:
            print(f"Response content: {response.text}")
        yield None

def process_mixpanel_event(event):
    flat_event = flatten(event)
    processed_event = {
        'event_name': event['event'],
    }
    
    # 모든 properties를 동적으로 처리
    for key, value in flat_event.items():
        if key.startswith('properties_'):
            new_key = key.replace('properties_', '')
            processed_event[new_key] = value
    
    return processed_event

def write_to_csv(events, csv_file):
    if events:
        # 모든 이벤트에서 나타나는 모든 고유한 키를 수집
        all_keys = set()
        for event in events:
            all_keys.update(event.keys())
        
        fieldnames = sorted(list(all_keys))  # 필드 이름을 정렬하여 일관성 유지

        with open(csv_file, 'w', newline='', encoding='utf-8') as cfile:
            writer = csv.DictWriter(cfile, fieldnames=fieldnames)
            writer.writeheader()
            for event in events:
                writer.writerow(event)
        
        print(f"Conversion complete. CSV file saved as {csv_file}")
    else:
        print("No data to write to CSV.")

# 메인 함수
def main():
    from_date = datetime.now() - timedelta(days=30)  # 30일 전부터
    to_date = datetime.now()  # 오늘까지
    
    raw_events = list(get_raw_data(from_date, to_date))
    
    if raw_events:
        print(f"Retrieved {len(raw_events)} events")
        processed_events = [process_mixpanel_event(event) for event in raw_events]
        write_to_csv(processed_events, 'mixpanel_events.csv')
    else:
        print("데이터를 가져오는데 실패했거나 데이터가 없습니다.")

if __name__ == "__main__":
    main()