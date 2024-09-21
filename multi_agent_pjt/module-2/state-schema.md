# LangGraph State Schema 학습

## 복습

- `persist state` - 인메모리 체크포인터를 사용하여 중단이 있는 장기 실행 대화를 지원

## 스키마

- LangGraph `StateGraph`를 정의할 때 [상태 스키마](https://langchain-ai.github.io/langgraph/concepts/low_level/#state)를 사용함.
- 상태 스키마는 우리의 그래프가 사용할 데이터의 구조와 유형을 나타냄.
- 모든 노드는 해당 스키마와 통신
- LangGraph는 다양한 Python [타입](https://docs.python.org/3/library/stdtypes.html#type-objects)과 검증 접근 방식을 수용하여 상태 스키마를 정의하는 데 있어 유연성을 제공함!

## TypedDict

- Python의 `typing` 모듈에서 `TypedDict` 클래스를 사용할 수 있음.
- 이를 통해 키와 해당 값 유형을 지정할 수 있음.
    - 하지만 이들은 타입 힌트일 뿐임을 주의해야 함. → 강제되지 않음.(! 매우 중요)

```python
from typing_extensions import TypedDict

class TypedDictState(TypedDict):
    foo: str
    bar: str

```

- 더 구체적인 값 제약을 위해 `Literal` 타입 힌트와 같은 것을 사용할 수 있음.
- 여기서 `mood`는 "happy" 또는 "sad"만 가능함.

```python
from typing import Literal

class TypedDictState(TypedDict):
    name: str
    mood: Literal["happy","sad"]

```

- 정의된 상태 클래스(예: 여기서는 `TypedDictState`)를 `StateGraph`에 단순히 전달하여 LangGraph에서 사용할 수 있음.
- 그리고 각 상태 키를 그래프의 "채널"로 생각할 수 있음.
- 각 노드에서 지정된 키 또는 "채널"의 값을 덮어씀.

```python
import random
from IPython.display import Image, display
from langgraph.graph import StateGraph, START, END

def node_1(state):
    print("---Node 1---")
    return {"name": state['name'] + " is ... "}

def node_2(state):
    print("---Node 2---")
    return {"mood": "happy"}

def node_3(state):
    print("---Node 3---")
    return {"mood": "sad"}

def decide_mood(state) -> Literal["node_2", "node_3"]:

    # 여기서는 노드 2와 3 사이에 50/50 분할을 수행함
    if random.random() < 0.5:

        # 50%의 확률로 Node 2를 반환함
        return "node_2"

    # 50%의 확률로 Node 3을 반환함
    return "node_3"

# 그래프 구축
builder = StateGraph(TypedDictState)
builder.add_node("node_1", node_1)
builder.add_node("node_2", node_2)
builder.add_node("node_3", node_3)

# 로직
builder.add_edge(START, "node_1")
builder.add_conditional_edges("node_1", decide_mood)
builder.add_edge("node_2", END)
builder.add_edge("node_3", END)

# 추가
graph = builder.compile()

display(Image(graph.get_graph().draw_mermaid_png()))

```

```python
graph.invoke({"name":"Lance"})
```

## Dataclass

- Dataclasses는 주로 데이터를 저장하는 데 사용되는 클래스를 생성하기 위한 간결한 구문을 제공함.

```python
from dataclasses import dataclass

@dataclass
class DataclassState:
    name: str
    mood: Literal["happy","sad"]

```

- `TypedDict`에서의 `state["name"]` 대신 `dataclass` 상태에는 `state.name`을 사용함
- `dataclass`는 `name` 키를 가지고 있으므로 상태가 `TypedDict`일 때와 마찬가지로 노드에서 딕셔너리를 전달하여 업데이트할 수 있음.

```python
def node_1(state):
    print("---Node 1---")
    return {"name": state.name + " is ... "}

# 그래프 구축
builder = StateGraph(DataclassState)
builder.add_node("node_1", node_1)
builder.add_node("node_2", node_2)
builder.add_node("node_3", node_3)

# 로직
builder.add_edge(START, "node_1")
builder.add_conditional_edges("node_1", decide_mood)
builder.add_edge("node_2", END)
builder.add_edge("node_3", END)

# 추가
graph = builder.compile()

display(Image(graph.get_graph().draw_mermaid_png()))

```

```python
graph.invoke(DataclassState(name="Lance",mood="sad"))
```

## Pydantic

- **`TypedDict`와 `dataclasses`는 타입 힌트를 제공하지만 런타임에 타입을 강제하지 않음.**
- 이는 오류를 발생시키지 않고 잘못된 값을 할당할 수 있다는 것을 의미함!
    - 예를 들어, 타입 힌트에서 `mood: list[Literal["happy","sad"]]`를 지정했음에도 불구하고 `mood`를 `mad`로 설정할 수 있음.

```python
dataclass_instance = DataclassState(name="Lance", mood="mad")

```

- Pydantic은 검증 기능 때문에 [LangGraph에서 상태 스키마를 정의하는 데 특히 적합](https://langchain-ai.github.io/langgraph/how-tos/state-model/)함.
- Pydantic은 런타임에 **데이터가 지정된 타입과 제약 조건을 준수하는지 검증을 수행**할 수 있음.

```python
from pydantic import BaseModel, field_validator, ValidationError

class PydanticState(BaseModel):
    name: str
    mood: Literal["happy", "sad"]

    @field_validator('mood')
    @classmethod
    def validate_mood(cls, value):
        # mood가 "happy" 또는 "sad"인지 확인함
        if value not in ["happy", "sad"]:
            raise ValueError("각 mood는 'happy' 또는 'sad'여야 함")
        return value

try:
    state = PydanticState(name="John Doe", mood="mad")
except ValidationError as e:
    print("유효성 검사 오류:", e)

```

```python
# 그래프 구축
builder = StateGraph(PydanticState)
builder.add_node("node_1", node_1)
builder.add_node("node_2", node_2)
builder.add_node("node_3", node_3)

# 로직
builder.add_edge(START, "node_1")
builder.add_conditional_edges("node_1", decide_mood)
builder.add_edge("node_2", END)
builder.add_edge("node_3", END)

# 추가
graph = builder.compile()

display(Image(graph.get_graph().draw_mermaid_png()))

```

```python
graph.invoke(PydanticState(name="Lance",mood="sad"))
```