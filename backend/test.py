users = [
    {"name": "홍길동", "age": 20},
    {"name": "김철수", "age": 30}
]

result = [
    {
        "이름": user["name"],
        "나이": user["age"]
    }
    for user in users
]
print(result)

numbers = [1, 2, 3, 4, 5]

result = [
    x
    for x in numbers
    if x % 2 == 0
    ]

print(result)