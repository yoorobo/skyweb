gpt_messages = [
    {
        "role": "system",
        "content": "기본응답"
    }
]

history = [
    {
        "role": "user",
        "content": "안녕하세요"
    },
    {
        "role": "assistant",
        "content": "안녕하세요! 무엇을 도와드릴까요?"
    }
]

gpt_messages.extend(
    [
        {
            "role": msg["role"],
            "content": msg["content"]
        }
        for msg in history
    ]
)
print(gpt_messages)