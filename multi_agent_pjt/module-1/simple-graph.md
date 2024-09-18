# LangGraph 기본 구조 및 간단한 그래프 구현 학습

![Screenshot 2024-08-20 at 3.11.22 PM.png](https://cdn.prod.website-files.com/65b8cd72835ceeacd4449a53/66dba5f465f6e9a2482ad935_simple-graph1.png)

## 요약

3개의 노드와 하나의 조건부 엣지를 가진 간단한 그래프로 실습

## 상태

```python
from typing_extensions import TypedDict

class State(TypedDict):
    graph_state: str
```

- 그래프의 [State](https://langchain-ai.github.io/langgraph/concepts/low_level/#state)를 정의
- State 스키마는 그래프의 모든 노드와 엣지에 대한 입력 스키마 역할을 함.
- 파이썬의 `typing` 모듈에서 `TypedDict` 클래스를 사용하여 키에 대한 타입 힌트를 제공하는 스키마를 만들어서 에러를 방지 할 수 있음.

## 노드

```python
def node_1(state):
    print("---Node 1---")
    return {"graph_state": state['graph_state'] +" I am"}

def node_2(state):
    print("---Node 2---")
    return {"graph_state": state['graph_state'] +" happy!"}

def node_3(state):
    print("---Node 3---")
    return {"graph_state": state['graph_state'] +" sad!"}
```

- [노드](https://langchain-ai.github.io/langgraph/concepts/low_level/#nodes)는 단순히 파이썬 함수임.(우리가 작업하고 싶은 것)
- 첫 번째 위치 인자는 위에서 정의한 상태 → (state)
- 상태가 위에서 정의한 스키마를 가진 `TypedDict`이기 때문에(딕셔너리 형태), 각 노드는 `state['graph_state']`로 `graph_state` 키에 접근할 수 있음.
- 각 노드는 상태 키 `graph_state`의 새로운 값을 반환 → + “I am” ,  + “happy!” or + “sad!”
- **기본적으로, 각 노드가 반환한 새 값은 [이전 상태 값을 덮어씀](https://langchain-ai.github.io/langgraph/concepts/low_level/#reducers). ! 매우 중요**
    - 예를 들어서 1번(”I am”)에서 2번(”happy!”)으로 갔다 end가 아닌 다시 1번으로 돌아가면 “I am happy! I am”이 됨.

## 엣지

- [엣지](https://langchain-ai.github.io/langgraph/concepts/low_level/#edges)는 노드를 연결
- 예를 들어 `node_1`에서 `node_2`로 가고 싶을 때 사용
- [조건부 엣지](https://langchain-ai.github.io/langgraph/reference/graphs/?h=conditional+edge#langgraph.graph.StateGraph.add_conditional_edges)는 노드 간 선택적 라우팅을 원할 때 사용
    - 조건부 엣지는 어떤 로직에 기반하여 다음에 방문할 노드를 반환하는 함수로 구현
- **Literal의 역할**
    - `Literal`은 특정 값만을 허용하는 타입을 정의할 때 사용
    - 이를 통해 함수나 변수가 특정한 값들만 가질 수 있음을 명시적으로 나타낼 수 있음
        - `Literal["node_2", "node_3"]`는 `decide_mood` 함수가 오직 "node_2" 또는 "node_3" 문자열만을 반환할 수 있음을 나타냄

```python
import random
from typing import Literal

# 기분 결정(decide_mood) 조건부 함수 생성
def decide_mood(state) -> Literal["node_2", "node_3"]:
    # 보통 상태를 사용하여 다음에 방문할 노드를 결정
    user_input = state['graph_state']

    # 여기서는 단순히 노드 2와 3 사이에서 50/50으로 선택
    if random.random() < 0.5:
        # 50% 확률로 노드 2를 반환
        return "node_2"

    # 50% 확률로 노드 3을 반환
    return "node_3"

```

## 그래프 구성

- 이제 위에서 정의한 [구성 요소](https://langchain-ai.github.io/langgraph/concepts/low_level/)를 사용하여 그래프를 구축
- [StateGraph 클래스](https://langchain-ai.github.io/langgraph/concepts/low_level/#stategraph)를 사용하여 그래프를 만들 수 있음.
    1. 먼저, 위에서 정의한 `State` 클래스로 StateGraph를 초기화
    2. 노드와 엣지를 추가
        1. [`START` 노드](https://langchain-ai.github.io/langgraph/concepts/low_level/#start-node)는 사용자 입력을 그래프로 보내는 노드로, 그래프의 시작점을 나타냄
        2. [`END` 노드](https://langchain-ai.github.io/langgraph/concepts/low_level/#end-node)는 종료 노드
    3. 마지막으로, [그래프를 컴파일](https://langchain-ai.github.io/langgraph/concepts/low_level/#compiling-your-graph)하여 그래프 구조에 대한 기본적인 검사를 수행
- 그래프를 [Mermaid 다이어그램](https://github.com/mermaid-js/mermaid)으로 시각화할 수도 있음.
    

```python
from IPython.display import Image, display
from langgraph.graph import StateGraph, START, END

# 그래프 구축
builder = StateGraph(State) #위에서 정의한 상태로 그래프 상태 설정
builder.add_node("node_1", node_1) # "node_1"이라는 이름으로 node_1()함수 추가
builder.add_node("node_2", node_2)
builder.add_node("node_3", node_3)

# 로직(간선 설계)
builder.add_edge(START, "node_1") # 노드 1을 시작 간선으로 생성
builder.add_conditional_edges("node_1", decide_mood) # 노드1 간선을 조건부 간선으로 생성(기분 결정 함수)
builder.add_edge("node_2", END) # 노드 2를 종료 간선으로 생성
builder.add_edge("node_3", END) # 노드 3을 종료 간선으로 생성

# -> 이렇게 생성하면 노드 1에서 시작하여 조건부 간선 결과에 따라서 노드2 or 노드3으로 가는 그래프가 생성됨.

# 추가
graph = builder.compile() # 그래프 컴파일

# 보기
display(Image(graph.get_graph().draw_mermaid_png()))

```

## 그래프 실행

- 컴파일된 그래프는 [runnable](https://python.langchain.com/v0.1/docs/expression_language/interface/) 프로토콜을 구현 = LangChain 구성 요소를 실행하는 표준 방식을 제공(invoke)
- 입력은 `{"graph_state": "Hi, this is lance."}`와 같은 딕셔너리로, 그래프 상태 딕셔너리의 초기 값을 설정
- `invoke`가 호출되면, 그래프는 `START` 노드에서 실행을 시작
- 정의된 노드(`node_1`, `node_2` or `node_3`)를 순서대로 진행
    - 조건부 엣지는 50대50으로 기분을 결정하는 함수(decide_mood)를 사용하여 노드 `1`에서 노드 `2` 또는 `3`으로 이동
    - 각 노드 함수는 현재 상태를 받아 새 값을 반환하며, 이는 그래프 상태를 덮어씀
    - 실행은 `END` 노드에 도달할 때까지 계속됨.

```python
graph.invoke({"graph_state" : "Hi, this is Jangho."})

<output>
---Node 1---
---Node 3---
{'graph_state': 'Hi, this is Jangho. I am sad!'}

---Node 1---
---Node 2---
{'graph_state': 'Hi, this is Jangho. I am happy!'}

<custom output>
---Node 1--- # 노드 1에서는 전역 상태로 유저 인풋이 들어갔고, 이에 I am이 추가됨.
current_state :  Hi, this is Jangho.
---Node 2--- # 노드 2에서는 전역 상태로 노드 1에서 추가된 I am이 보이고, 이에 happy가 추가됨.
current_state :  Hi, this is Jangho. I am

{'graph_state': 'Hi, this is Jangho. I am happy!'} # 최종적인 전역 상태 결과로 I am happy가 추가되었음.
```