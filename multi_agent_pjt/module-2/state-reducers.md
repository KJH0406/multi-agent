# LangGraph State Reducers 학습

## 리듀서 개념

리듀서는 상태 스키마의 특정 키/채널에서 상태 업데이트를 수행하는 방법을 지정

## 기본 덮어쓰기 상태

상태 스키마로 `TypedDict`를 사용

```python
from typing_extensions import TypedDict
from IPython.display import Image, display
from langgraph.graph import StateGraph, START, END

class State(TypedDict):
    foo: int

def node_1(state):
    print("---Node 1---")
    return {"foo": state['foo'] + 1}

# 그래프 구축
builder = StateGraph(State)
builder.add_node("node_1", node_1)

# 로직
builder.add_edge(START, "node_1")
builder.add_edge("node_1", END)

# 추가
graph = builder.compile()

# 보기
display(Image(graph.get_graph().draw_mermaid_png()))

```

```python
graph.invoke({"foo" : 1})

```

`return {"foo": state['foo'] + 1}` 상태 업데이트를 보면

기본적으로 LangGraph는 상태를 업데이트하는 선호되는 방법을 모름.

따라서 `node_1`에서 `foo`의 값을 단순히 덮어씀:

```
return {"foo": state['foo'] + 1}

```

입력으로 `{'foo': 1}`을 전달하면 그래프에서 반환된 상태는 `{'foo': 2}`임.

## 분기

노드가 분기하는 경우를 살펴보면

```python
class State(TypedDict):
    foo: int

def node_1(state):
    print("---Node 1---")
    return {"foo": state['foo'] + 1}

def node_2(state):
    print("---Node 2---")
    return {"foo": state['foo'] + 1}

def node_3(state):
    print("---Node 3---")
    return {"foo": state['foo'] + 1}

# 그래프 구축
builder = StateGraph(State)
builder.add_node("node_1", node_1)
builder.add_node("node_2", node_2)
builder.add_node("node_3", node_3)

# 로직
builder.add_edge(START, "node_1")
builder.add_edge("node_1", "node_2")
builder.add_edge("node_1", "node_3")
builder.add_edge("node_2", END)
builder.add_edge("node_3", END)

# 추가
graph = builder.compile()

# 보기
display(Image(graph.get_graph().draw_mermaid_png()))

```

노드 2와 3이 동시에 실행되므로 그래프의 동일한 단계에서 실행됨을 볼 수 있음.

```python
from langgraph.errors import InvalidUpdateError
try:
    graph.invoke({"foo" : 1})
except InvalidUpdateError as e:
    print(f"InvalidUpdateError occurred: {e}")

```

문제가 있음을 확인할 수 있음!

노드 1은 노드 2와 3으로 분기됨.

노드 2와 3은 병렬로 실행되므로 그래프의 동일한 단계에서 실행됨.

둘 다 *동일한 단계 내에서* 상태를 덮어쓰려고 시도함.

이는 그래프에 모호함! 어떤 상태를 유지해야 할까?

## 리듀서

[리듀서](https://langchain-ai.github.io/langgraph/concepts/low_level/#reducers)는 이 문제를 해결하기 위한 일반적인 방법을 제공함.

업데이트를 수행하는 방법을 지정함.

`Annotated` 타입을 사용하여 리듀서 함수를 지정할 수 있음.

예를 들어, 이 경우 각 노드에서 반환된 값을 덮어쓰는 대신 추가하도록 구현

이를 수행하는 리듀서만 있으면 됨: `operator.add`는 Python의 내장 operator 모듈의 함수임.

리스트에 `operator.add`를 적용하면 리스트 연결을 수행함.

```python
from operator import add
from typing import Annotated

class State(TypedDict):
    foo: Annotated[list[int], add]

def node_1(state):
    print("---Node 1---")
    return {"foo": [state['foo'][0] + 1]}

# 그래프 구축
builder = StateGraph(State)
builder.add_node("node_1", node_1)

# 로직
builder.add_edge(START, "node_1")
builder.add_edge("node_1", END)

# 추가
graph = builder.compile()

# 보기
display(Image(graph.get_graph().draw_mermaid_png()))

```

```python
graph.invoke({"foo" : [1]})

```

이제 상태 키 `foo`는 리스트임.

이 `operator.add` 리듀서 함수는 각 노드의 업데이트를 이 리스트에 추가함.

```python
def node_1(state):
    print("---Node 1---")
    return {"foo": [state['foo'][-1] + 1]}

def node_2(state):
    print("---Node 2---")
    return {"foo": [state['foo'][-1] + 1]}

def node_3(state):
    print("---Node 3---")
    return {"foo": [state['foo'][-1] + 1]}

# 그래프 구축
builder = StateGraph(State)
builder.add_node("node_1", node_1)
builder.add_node("node_2", node_2)
builder.add_node("node_3", node_3)

# 로직
builder.add_edge(START, "node_1")
builder.add_edge("node_1", "node_2")
builder.add_edge("node_1", "node_3")
builder.add_edge("node_2", END)
builder.add_edge("node_3", END)

# 추가
graph = builder.compile()

# 보기
display(Image(graph.get_graph().draw_mermaid_png()))

```

노드 2와 3의 업데이트가 동시에 수행되는 것을 볼 수 있음. 이는 동일한 단계에 있기 때문임.

```python
graph.invoke({"foo" : [1]})

```

이제 `foo`에 `None`을 전달하면, 우리의 리듀서 `operator.add`가 `node_1`에서 리스트에 `NoneType` 입력을 연결하려고 시도하기 때문에 오류가 발생함

```python
try:
    graph.invoke({"foo" : None})
except TypeError as e:
    print(f"TypeError occurred: {e}")

```

## 사용자 정의 리듀서

이러한 경우를 처리하기 위해 [사용자 정의 리듀서를 정의할 수도 있음](https://langchain-ai.github.io/langgraph/how-tos/subgraph/#custom-reducer-functions-to-manage-state).

예를 들어, 리스트를 결합하고 입력 중 하나 또는 둘 다 `None`일 수 있는 경우를 처리하는 사용자 정의 리듀서 로직을 정의

```python
def reduce_list(left: list | None, right: list | None) -> list:
    """두 리스트를 안전하게 결합하며, 입력 중 하나 또는 둘 다 None일 수 있는 경우를 처리함.

    인자:
        left (list | None): 결합할 첫 번째 리스트 또는 None.
        right (list | None): 결합할 두 번째 리스트 또는 None.

    반환:
        list: 두 입력 리스트의 모든 요소를 포함하는 새 리스트.
               입력이 None인 경우 빈 리스트로 처리됨.
    """
    if not left:
        left = []
    if not right:
        right = []
    return left + right

class DefaultState(TypedDict):
    foo: Annotated[list[int], add]

class CustomReducerState(TypedDict):
    foo: Annotated[list[int], reduce_list]

```

`node_1`에서 값 2를 추가함.

```python
def node_1(state):
    print("---Node 1---")
    return {"foo": [2]}

# 그래프 구축
builder = StateGraph(DefaultState)
builder.add_node("node_1", node_1)

# 로직
builder.add_edge(START, "node_1")
builder.add_edge("node_1", END)

# 추가
graph = builder.compile()

# 보기
display(Image(graph.get_graph().draw_mermaid_png()))

try:
    print(graph.invoke({"foo" : None}))
except TypeError as e:
    print(f"TypeError occurred: {e}")

```

사용자 정의 리듀서로 시도하면 오류가 발생하지 않음을 확인할 수 있음.

```python
# 그래프 구축
builder = StateGraph(CustomReducerState)
builder.add_node("node_1", node_1)

# 로직
builder.add_edge(START, "node_1")
builder.add_edge("node_1", END)

# 추가
graph = builder.compile()

# 보기
display(Image(graph.get_graph().draw_mermaid_png()))

try:
    print(graph.invoke({"foo" : None}))
except TypeError as e:
    print(f"TypeError occurred: {e}")

```

## 메시지

[`MessagesState`가 메시지로 작업하려는 경우 유용한 단축키임](https://langchain-ai.github.io/langgraph/concepts/low_level/#messagesstate)

- `MessagesState`에는 내장된 `messages` 키가 있음
- 이 키에 대한 내장 `add_messages` 리듀서도 있음

이 둘은 동등함.

간결성을 위해 `from langgraph.graph import MessagesState`를 통해 `MessagesState` 클래스를 사용

```python
from typing import Annotated
from langgraph.graph import MessagesState
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages

# add_messages 리듀서를 사용하여 메시지 리스트를 포함하는 사용자 정의 TypedDict 정의
class CustomMessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    added_key_1: str
    added_key_2: str
    # 기타

# add_messages 리듀서와 함께 messages 키를 포함하는 MessagesState 사용
class ExtendedMessagesState(MessagesState):
    # 미리 구축된 messages 외에 필요한 키 추가
    added_key_1: str
    added_key_2: str
    # 기타

```

```python
from langgraph.graph.message import add_messages
from langchain_core.messages import AIMessage, HumanMessage

# 초기 상태
initial_messages = [AIMessage(content="안녕하세요! 어떻게 도와드릴까요?", name="Model"),
                    HumanMessage(content="해양 생물학에 대한 정보를 찾고 있어요.", name="Lance")
                   ]

# 추가할 새 메시지
new_message = AIMessage(content="물론이죠, 도와드리겠습니다. 구체적으로 어떤 부분에 관심이 있으신가요?", name="Model")

# 테스트
add_messages(initial_messages , new_message)

```

이를 통해 `add_messages`가 상태의 `messages` 키에 메시지를 추가할 수 있음을 알 수 있음.

### 다시 쓰기

`add_messages` 리듀서 작업 시 유용한 몇 가지 트릭

`messages` 리스트에 이미 존재하는 것과 동일한 ID를 가진 메시지를 전달하면 덮어쓰기가 됨!

```python
# 초기 상태
initial_messages = [AIMessage(content="안녕하세요! 어떻게 도와드릴까요?", name="Model", id="1"),
                    HumanMessage(content="해양 생물학에 대한 정보를 찾고 있어요.", name="Lance", id="2")
                   ]

# 추가할 새 메시지
new_message = HumanMessage(content="구체적으로 고래에 대한 정보를 찾고 있어요.", name="Lance", id="2")

# 테스트
add_messages(initial_messages , new_message)

```

### 제거

`add_messages`는 또한 [메시지 제거를 가능하게 함](https://langchain-ai.github.io/langgraph/how-tos/memory/delete-messages/).

이를 위해 `langchain_core`의 [RemoveMessage](https://api.python.langchain.com/en/latest/messages/langchain_core.messages.modifier.RemoveMessage.html)를 사용하면 됨.

```python
from langchain_core.messages import RemoveMessage

# 메시지 리스트
messages = [AIMessage("안녕하세요.", name="Bot", id="1")]
messages.append(HumanMessage("안녕하세요.", name="Lance", id="2"))
messages.append(AIMessage("해양 포유류에 대해 연구하고 계시다고 하셨나요?", name="Bot", id="3"))
messages.append(HumanMessage("네, 고래에 대해서는 알고 있어요. 그 외에 어떤 것들을 배워야 할까요?", name="Lance", id="4"))

# 삭제할 메시지 분리
delete_messages = [RemoveMessage(id=m.id) for m in messages[:-2]]
print(delete_messages)

```

```python
add_messages(messages , delete_messages)

```

`delete_messages`에 명시된 대로 메시지 ID 1과 2가 리듀서에 의해 제거되는 것을 볼 수 있음.