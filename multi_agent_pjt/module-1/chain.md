# LangGraph Chain 구축 기초

## 요약

4가지 개념을 결합한 간단한 체인

1. 그래프 상태로 채팅 메시지 사용
    - 이전의 단순 문자열 대신 구조화된 채팅 메시지 형식 사용
    - 대화 맥락을 더 잘 유지하고 관리 가능
2. 그래프 노드에서 채팅 모델 사용
    - 각 노드에서 ChatGPT와 같은 대화형 AI 모델 활용
    - 더 지능적이고 맥락에 맞는 응답 생성 가능
3. 채팅 모델에 도구 바인딩
    - AI 모델에 특정 기능 수행 가능한 '도구' 연결
    - 예: 웹 검색, 계산, 데이터베이스 쿼리 등 → 해당 예제에서는 곱셈 계산 활용
4. 그래프 노드에서 도구 호출 실행
    - AI 모델이 필요시 도구들 실제 사용하도록 구현
    - AI가 외부 정보 가져오거나 특정 작업 수행 가능

## 메시지

- LangChain은 `HumanMessage`, `AIMessage`, `SystemMessage`, `ToolMessage` 등 다양한 메시지 유형 지원
- 각 메시지에는 `content`(내용), `name`(작성자, 선택적), `response_metadata`(메타데이터, 선택적) 제공 가능

```python
from pprint import pprint # 복잡한 데이터를 보기 좋게 출력하는 데 사용
from langchain_core.messages import AIMessage, HumanMessage

# messages 리스트를 생성 및 첫 번째 AI 메시지 추가
messages = [AIMessage(content=f"So you said you were researching ocean mammals?", name="Model")]

# 사람과 AI 대화 메시지들을 messages 리스트에 추가
messages.append(HumanMessage(content=f"Yes, that's right.",name="Jay"))
messages.append(AIMessage(content=f"Great, what would you like to learn about.", name="Model"))
messages.append(HumanMessage(content=f"I want to learn about the best place to see Orcas in the US.", name="Jay"))

# messages 리스트의 각 메시지를 순회하면서 출력
for m in messages:
    m.pretty_print()

<output>
================================== Ai Message ==================================
Name: Model

So you said you were researching ocean mammals?
================================ Human Message =================================
Name: Jay

Yes, that's right.
================================== Ai Message ==================================
Name: Model

Great, what would you like to learn about.
================================ Human Message =================================
Name: Jay

I want to learn about the best place to see Orcas in the US.
```

## 채팅 모델

- 채팅 모델은 메시지 시퀀스를 입력으로 사용 가능
- **OpenAI API 키 설정 필요**
- LLM 응답은 AIMessage 유형으로, content(실제 응답), additional_kwargs, response_metadata, usage_metadata 등 포함

```python
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4o")
result = llm.invoke(messages) # 위에서 대화 나눈 것을 LLM에게 입력값으로 제공

<output>
**AIMessage**(**content**='One of the best places ...~~', **additional_kwargs**={'refusal': None}, **response_metadata**={'token_usage': {'completion_tokens': 399, 'prompt_tokens': 67, 'total_tokens': 466, 'completion_tokens_details': {'reasoning_tokens': 0}}, 'model_name': 'gpt-4o-2024-05-13', 'system_fingerprint': 'fp_a5d11b2ef2', 'finish_reason': 'stop', 'logprobs': None}, id='run-d08b7087-946b-4a5d-8c44-7eb798a0ab7b-0', **usage_metadata**={'input_tokens': 67, 'output_tokens': 399, 'total_tokens': 466})

result.response_metadata

{'token_usage': {'completion_tokens': 399,
  'prompt_tokens': 67,
  'total_tokens': 466,
  'completion_tokens_details': {'reasoning_tokens': 0}},
 'model_name': 'gpt-4o-2024-05-13',
 'system_fingerprint': 'fp_a5d11b2ef2',
 'finish_reason': 'stop',
 'logprobs': None}
```

## 도구

!https://cdn.prod.website-files.com/65b8cd72835ceeacd4449a53/66dbab08dc1c17a7a57f9960_chain2.png

- 모델이 외부 시스템과 상호작용할 때 유용
- API를 도구로 바인딩하여 모델에 필요한 입력 스키마 인식 제공
- `ChatModel.bind_tools(function)`으로 Python 함수를 도구로 추가 가능
- 모델은 사용자 입력 기반으로 도구 호출 여부 결정

```python
# 곱하기 도구 함수 정의
def multiply(a: int, b: int) -> int:
    """Multiply a and b.

    Args:
        a: first int
        b: second int
    """
    return a * b

llm_with_tools = llm.bind_tools([multiply]) # 바인딩 메소드를 사용하여 LLM 모델에 연결
```

- 모델은 사용자의 자연어 입력을 기반으로 도구를 호출할지 선택
- 단순 llm.invoke가 아닌 llm_with_tools 함수를 통해서 실행해서 도구를 호출할지 물어봐야함.

```python
tool_call = llm_with_tools.invoke([HumanMessage(content=f"What is 2 multiplied by 3", name="Jay")])
tool_call
```

- 그리고 도구의 스키마를 준수하는 출력을 반환
- **!만약, 도구가 필요 없는 쿼리라면 그냥 일단 AIMessage 출력(content)**

```python
# 여기서 주의할 점은 이전과 같은 자연어 응답이 아닌 tool에 대한 호출을 반환한다는 것을 유의해야함!
AIMessage(content='', **additional_kwargs**={'**tool_calls**': [{'id': 'call_5UqOSV2ZxylDzHKcACeBsZ9V', 'function': {'arguments': '{"a":2,"b":3}', 'name': 'multiply'}, 'type': 'function'}], 'refusal': None}, response_metadata={'token_usage': {'completion_tokens': 17, 'prompt_tokens': 62, 'total_tokens': 79, 'completion_tokens_details': {'reasoning_tokens': 0}}, 'model_name': 'gpt-4o-2024-05-13', 'system_fingerprint': 'fp_25624ae3a5', 'finish_reason': 'tool_calls', 'logprobs': None}, id='run-dbb73251-3ffb-4453-a63d-ed35c1dbc833-0', tool_calls=[{'name': 'multiply', 'args': {'a': 2, 'b': 3}, 'id': 'call_5UqOSV2ZxylDzHKcACeBsZ9V', 'type': 'tool_call'}], usage_metadata={'input_tokens': 62, 'output_tokens': 17, 'total_tokens': 79})

tool_call.additional_kwargs['tool_calls']
[{'id': 'call_5UqOSV2ZxylDzHKcACeBsZ9V',
  'function': {'arguments': '{"a":2,"b":3}', 'name': 'multiply'},
  'type': 'function'}]
```

## 상태로 메시지 사용

- `MessagesState`를 `TypedDict`로 정의, `messages` 키는 메시지 리스트 포함

```python
from typing_extensions import TypedDict
from langchain_core.messages import AnyMessage

class MessagesState(TypedDict):
    messages: list[AnyMessage]
```

- 우리의 상태 `MessagesState`를 단일 키 `messages`를 가진 `TypedDict`로 정의
- `messages`는 단순히 위에서 정의한 메시지 리스트(예: `HumanMessage` 등).

### 리듀서

- **각 노드는 상태 키 `messages`에 대한 새 값을 반환하지만, 이 새 값은 이전 `messages` 값을 덮어씀(매우 중요!).**
- 그래프가 실행되면서 `messages` 상태 키에 메시지를 추가하는 방식을 사용해야함.
- 이를 해결하기 위해 리듀서 함수를 사용할 수 있음. 리듀서는 상태 업데이트 방식을 지정할 수 있게 해줌.
- 메시지를 추가하기 위해 미리 만들어진 `add_messages` 리듀서를 사용

```python
from typing import Annotated
from langgraph.graph.message import **add_messages**

class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], **add_messages**]
```

```python
# 초기 메시지 리스트
initial_messages = [AIMessage(content="Hello! How can I assist you?", name="Model"),
                    HumanMessage(content="I'm looking for information on marine biology.", name="Jay")
                   ]

# 새로운 메시지 추가
new_message = AIMessage(content="Sure, I can help with that. What specifically are you interested in?", name="Model")

# add_messages 함수 사용
**#** 초기 메시지 **리스트**에 새로운 메시지 추가
**add_messages(initial_messages , new_message) # -> add_messages(기존 대화 리스트, 추가할 메시지)

<output>
[AIMessage(content='Hello! How can I assist you?', additional_kwargs={}, response_metadata={}, name='Model', id='4ca33116-92d8-422e-92aa-c408c2e493a9'),
 HumanMessage(content="I'm looking for information on marine biology.", additional_kwargs={}, response_metadata={}, name='Jay', id='265bd8af-f604-4c8c-b502-d749a1e07044'),
 AIMessage(content='Sure, I can help with that. What specifically are you interested in?', additional_kwargs={}, response_metadata={}, name='Model', id='3093d4f4-de7f-4e80-9575-a67283d4b346')]**
```

## 그래프 구축

- `MessagesState`를 그래프와 함께 사용
- 노드, 엣지 정의하고 그래프 컴파일

```python
from IPython.display import Image, display
from langgraph.graph import StateGraph, START, END
from langgraph.graph import MessagesState

# 메시지 상태
class MessagesState(MessagesState):

    pass
    
# 노드
def tool_calling_llm(state: MessagesState):
    return {"messages": [llm_with_tools.invoke(state["messages"])]}

# 그래프 구조 생성
builder = StateGraph(MessagesState)
builder.add_node("tool_calling_llm", tool_calling_llm)
builder.add_edge(START, "tool_calling_llm")
builder.add_edge("tool_calling_llm", END)
graph = builder.compile()

display(Image(graph.get_graph().draw_mermaid_png()))
```

- 일반 대화(”hello”)에서는 LLM이 도구 호출 없이 응답

```python
messages = graph.invoke({"messages": HumanMessage(content="Hello!")})
for m in messages['messages']:
    m.pretty_print()
    
<output>
================================ Human Message =================================

Hello!
================================== Ai Message ==================================

Hi there! How can I assist you today?
```

- 특정 작업(예: 곱셈)에서는 LLM이 도구 사용 선택

```python
messages = graph.invoke({"messages": HumanMessage(content="Multiply 2 and 3!")})
for m in messages['messages']:
    m.pretty_print()
    
<output>
================================ Human Message =================================

Multiply 2 and 3!
================================== Ai Message ==================================
Tool Calls:
  multiply (call_Xfgoyjm0f5UIddn3gtwV02i6)
 Call ID: call_Xfgoyjm0f5UIddn3gtwV02i6
  Args:
    a: 2
    b: 3

```