import os
import requests

ARK_API_KEY = os.getenv("ARK_API_KEY")
job_id = input("Enter Ark job_id to test status: ")

ark_status_url = f"https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{job_id}"
headers = {
    "Authorization": f"Bearer {ARK_API_KEY}",
    "Content-Type": "application/json"
}

response = requests.get(ark_status_url, headers=headers)
print(f"Status code: {response.status_code}")
print(f"Response: {response.text}")
