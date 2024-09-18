# LangGraph Router 구축 학습

## 개요

Chain 기초 개념 학습을 통해서 `messages`를 상태(State)로 사용하고 바인딩된 도구를 가진 채팅 모델을 이용하여 그래프를 구축할 수 있었음.

이를 통해서 그래프 구조로 쿼리에 따라서 도구(Tools) 호출을 반환하거나 바로 자연어 응답을 반환하는 것을 알 수 있었음. 

→ 이것을 라우터로 생각한다면, 채팅 모델은 사용자 입력에 따라 직접 응답하거나 도구 호출을 하는 것 사이를 라우팅하는 원리와 같음.

![image.png](https://cdn.prod.website-files.com/65b8cd72835ceeacd4449a53/66dbac6543c3d4df239a4ed1_router1.png)

즉 아래 두가지 흐름을 추가하여 그래프 구조를 구축할 수 있음.

(1) 도구를 호출할 노드를 추가

(2) 채팅 모델 출력을 확인하고 **도구 호출 노드로 라우팅**하거나 **도구 호출이 수행되지 않으면 단순히 종료**하는 **조건부 엣지를 추가**

```python
%%capture --no-stderr
%pip install --quiet -U langchain_openai langchain_core langgraph

```

```python
import os, getpass

def _set_env(var: str):
    if not os.environ.get(var):
        os.environ[var] = getpass.getpass(f"{var}: ")

_set_env("OPENAI_API_KEY")

```

```python
from langchain_openai import ChatOpenAI

def multiply(a: int, b: int) -> int:
    """a와 b를 곱합니다.

    Args:
        a: 첫 번째 정수
        b: 두 번째 정수
    """
    return a * b

llm = ChatOpenAI(model="gpt-4o")
llm_with_tools = llm.bind_tools([multiply])

```

```python
from IPython.display import Image, display  # 이미지 표시를 위한 IPython 기능
from langgraph.graph import StateGraph, START, END  # 그래프 구조를 만들기 위한 langgraph 컴포넌트
from langgraph.graph import MessagesState  # 메시지 상태를 관리하기 위한 클래스
from langgraph.prebuilt import ToolNode  # 도구 노드를 생성하기 위한 클래스
from langgraph.prebuilt import tools_condition  # 도구 호출 조건을 확인하는 함수

# 도구 호출 노드
def tool_calling_llm(state: MessagesState):
    # LLM을 호출하여 현재 상태의 메시지에 대한 응답을 생성
    return {"messages": [llm_with_tools.invoke(state["messages"])]}

# MessagesState를 사용하여 StateGraph를 초기화
builder = StateGraph(MessagesState)  

# 노드들을 그래프에 추가
builder.add_node("tool_calling_llm", tool_calling_llm)  # LLM 노드 추가
builder.add_node("tools", ToolNode([multiply]))  # 도구 노드 추가 (여기서는 multiply 함수만 포함)

# 엣지 추가
builder.add_edge(START, "tool_calling_llm")  # 시작 노드에서 LLM 노드로 연결

# 조건부 엣지 추가
builder.add_conditional_edges(
    "tool_calling_llm",
    tools_condition,  # 이 조건 함수에 따라 다음 노드가 결정
    # 만약 LLM의 응답이 도구 호출이면 -> 'tools' 노드로 이동
    # 그렇지 않으면 -> END 노드로 이동
)

builder.add_edge("tools", END)  # 도구 노드에서 종료 노드로 연결

# 그래프를 컴파일
graph = builder.compile()

# 그래프를 시각화하여 표시
display(Image(graph.get_graph().draw_mermaid_png()))
```

![image.png](https://file.notion.so/f/f/6e9b6a9d-4017-4436-9d1c-b2c91964d4d9/7ba6fac0-44fd-49be-af4f-d784423dfc91/image.png?table=block&id=1058f684-2b4d-8013-9739-edc4d79cbc76&spaceId=6e9b6a9d-4017-4436-9d1c-b2c91964d4d9&expirationTimestamp=1726754400000&signature=_qE-qbyf5PNjOhr58SNYTwNrfNSlYIQ2bXFZh7OJKsA&downloadName=image.png)

- 내장된 `ToolNode`를 사용하고 초기화할 때 도구 목록을 간단히 전달
- 조건부 엣지로 내장된 `tools_condition`을 사용

`ToolMessage`로 응답
```python
from langchain_core.messages import HumanMessage
messages = [HumanMessage(content="Hello world.")]
messages = graph.invoke({"messages": messages})
for m in messages['messages']:
    m.pretty_print()

<output>
================================ Human Message =================================

Hello world.
================================== Ai Message ==================================

Hello! How can I assist you today?

```

```python
from langchain_core.messages import HumanMessage
# messages = [HumanMessage(content="Hello world.")]
messages = [HumanMessage(content="multiply 143 and 126")]
messages = graph.invoke({"messages": messages})
for m in messages['messages']:
    m.pretty_print()

<output>
================================ Human Message =================================

multiply 143 and 126
================================== Ai Message ==================================
Tool Calls:
  multiply (call_TCSqm1F8R8DRb2nNO3Vv8ngx)
 Call ID: call_TCSqm1F8R8DRb2nNO3Vv8ngx
  Args:
    a: 143
    b: 126
================================= Tool Message =================================
Name: multiply

18018
```