# Agent

- 채팅 모델은 사용자 입력을 기반으로 도구 호출을 할지 말지 결정
- 조건부 엣지를 사용하여 도구를 호출하거나 단순히 종료하는 노드로 라우팅

![image.png](https://cdn.prod.website-files.com/65b8cd72835ceeacd4449a53/66dbac0ba0bd34b541c448cc_agent1.png)

## 목표

- 일반적인 에이전트 아키텍처로 확장할 수 있음.
- 라우터에서 모델을 호출하고, 도구를 호출하기로 선택한 경우 사용자에게 `ToolMessage`를 반환했음.
- 하지만 만약 우리가 그 `ToolMessage`를 단순히 *모델로 다시 전달*한다면?
    - 모델이 (1) 다른 도구를 호출하거나 (2) 직접 응답하도록 할 수 있음.
    - 이것이 [ReAct](https://react-lm.github.io/), ReAct는 일반적인 에이전트 아키텍처임.
- `act` - 모델이 특정 도구를 호출
- `observe` - 도구 출력을 모델로 다시 전달
- `reason` - 모델이 도구 출력에 대해 추론하여 다음에 무엇을 할지 결정 (예: 다른 도구를 호출하거나 단순히 직접 응답)

![image.png](https://cdn.prod.website-files.com/65b8cd72835ceeacd4449a53/66dbac0b4a2c1e5e02f3e78b_agent2.png)

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
_set_env("LANGCHAIN_API_KEY")
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "langchain-academy"

```

```python
from langchain_openai import ChatOpenAI

def multiply(a: int, b: int) -> int:
    """a와 b를 곱합니다.

    인자:
        a: 첫 번째 정수
        b: 두 번째 정수
    """
    return a * b

# 이것은 도구가 될 것입니다
def add(a: int, b: int) -> int:
    """a와 b를 더합니다.

    인자:
        a: 첫 번째 정수
        b: 두 번째 정수
    """
    return a + b

def divide(a: int, b: int) -> float:
    """a를 b로 나눕니다.

    인자:
        a: 첫 번째 정수
        b: 두 번째 정수
    """
    return a / b

tools = [add, multiply, divide]
llm = ChatOpenAI(model="gpt-4o")
llm_with_tools = llm.bind_tools(tools)

```

```python
from langgraph.graph import MessagesState
from langchain_core.messages import HumanMessage, SystemMessage

# 시스템 메시지
sys_msg = SystemMessage(content="당신은 일련의 입력에 대해 산술 연산을 수행하는 도움이 되는 보조자입니다.")

# 노드
def assistant(state: MessagesState):
   return {"messages": [llm_with_tools.invoke([sys_msg] + state["messages"])]}

```

- 이전과 마찬가지로 `MessagesState`를 사용하고 도구 목록으로 `Tools` 노드를 정의
- `Assistant` 노드는 단순히 도구가 바인딩된 모델
- `Assistant`와 `Tools` 노드로 그래프를 생성
- `Assistant`가 도구를 호출하는지 여부에 따라 `End`나 `Tools`로 라우팅하는 `tools_condition` 엣지를 추가

- **✅ 포인트 :  한 가지 새로운 단계를 추가**
    - `Tools` 노드를 *다시* `Assistant`에 연결하여 루프를 형성(사이클)
    - `assistant` 노드가 실행된 후, `tools_condition`은 모델의 출력이 도구 호출인지 확인
    - 도구 호출인 경우, 흐름은 `tools` 노드로 출력
    - `tools` 노드는 다시 `assistant`로 연결
    - 이 루프는 모델이 도구를 호출하기로 결정하는 한 계속 (필요시 지속해서 루프하며 응답 생성 및 반환)
    - 모델 응답이 도구 호출이 아닌 경우, 흐름은 END로 향하고 프로세스가 종료

```python
from langgraph.graph import START, StateGraph
from langgraph.prebuilt import tools_condition
from langgraph.prebuilt import ToolNode
from IPython.display import Image, display

# 그래프
builder = StateGraph(MessagesState)

# 노드 
builder.add_node("assistant", assistant)
builder.add_node("tools", ToolNode(tools))

# 엣지(제어 흐름의 이동 방식을 결정)
builder.add_edge(START, "assistant")
builder.add_conditional_edges(
    "assistant",
  # assistant로부터의 최신 메시지(결과)가 도구 호출이면 -> tools_condition이 tools로 라우팅
  # assistant로부터의 최신 메시지(결과)가 도구 호출이 아니면 -> tools_condition이 END로 라우팅
    tools_condition,
)
builder.add_edge("tools", "assistant")
react_graph = builder.compile()

display(Image(react_graph.get_graph(xray=True).draw_mermaid_png()))

```

```python
messages = [HumanMessage(content="3과 4를 더하세요. 결과에 2를 곱하세요. 결과를 5로 나누세요")]
messages = react_graph.invoke({"messages": messages})

```

```python
for m in messages['messages']:
    m.pretty_print()

```