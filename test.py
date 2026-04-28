import requests

with open("formula.png", "rb") as f:
    files = {"image": f}
    data = {
        "model_id": 1,
        "task_name": "test_task"
    }
    response = requests.post(
        url="http://localhost/predict/1",
        files=files,
        data=data
    )
    print(response.json())