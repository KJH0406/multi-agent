## 복습

- `act` - 모델이 특정 도구를 호출하도록 함
- `observe` - 도구 출력을 모델로 다시 전달함
- `reason` - 모델이 도구 출력에 대해 추론하여 다음에 무엇을 할지 결정하도록 함 (예: 다른 도구를 호출하거나 단순히 직접 응답)

### 메모리를 도입하여 에이전트를 확장

```python
from langchain_openai import ChatOpenAI

def multiply(a: int, b: int) -> int:
    """a와 b를 곱함.

    인자:
        a: 첫 번째 정수
        b: 두 번째 정수
    """
    return a * b

# 이것은 도구가 될 것임
def add(a: int, b: int) -> int:
    """a와 b를 더함.

    인자:
        a: 첫 번째 정수
        b: 두 번째 정수
    """
    return a + b

def divide(a: int, b: int) -> float:
    """a를 b로 나눔.

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
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

# 시스템 메시지
sys_msg = SystemMessage(content="당신은 일련의 입력에 대해 산술 연산을 수행하는 도움이 되는 보조자임.")

# 노드
def assistant(state: MessagesState):
   return {"messages": [llm_with_tools.invoke([sys_msg] + state["messages"])]}

```

```python
from langgraph.graph import START, StateGraph
from langgraph.prebuilt import tools_condition, ToolNode
from IPython.display import Image, display

# 그래프
builder = StateGraph(MessagesState)

# 노드 정의
builder.add_node("assistant", assistant)
builder.add_node("tools", ToolNode(tools))

# 엣지
builder.add_edge(START, "assistant")
builder.add_conditional_edges(
    "assistant",
    tools_condition,
)
builder.add_edge("tools", "assistant")
react_graph = builder.compile()

display(Image(react_graph.get_graph(xray=True).draw_mermaid_png()))

```

## 메모리

```python
messages = [HumanMessage(content="3과 4를 더하세요.")]
messages = react_graph.invoke({"messages": messages})
for m in messages['messages']:
    m.pretty_print()

```

- 메모리 도입 전 테스트

```python
messages = [HumanMessage(content="그것에 2를 곱하세요.")]
messages = react_graph.invoke({"messages": messages})
for m in messages['messages']:
    m.pretty_print()

```

- 초기 채팅에서 7이라는 메모리를 유지하지 않음
    - 이는 [상태가 단일 그래프 실행에 일시적](https://github.com/langchain-ai/langgraph/discussions/352#discussioncomment-9291220)이기 때문임.
    - 이는 중단이 있는 다중 턴 대화를 할 수 있는 능력을 제한
- 이를 해결하기 위해 [지속성](https://langchain-ai.github.io/langgraph/how-tos/persistence/)을 사용할 수 있음
- LangGraph는 체크포인터를 사용하여 각 단계 후 그래프 상태를 자동으로 저장할 수 있음.
- 이 내장된 지속성 계층은 메모리를 제공하여 LangGraph가 마지막 상태 업데이트에서 계속할 수 있도록 함.
- 사용하기 가장 쉬운 체크포인터 중 하나는 `MemorySaver`로, 그래프 상태를 위한 인메모리 키-값 저장소임.
- 체크포인터로 그래프를 컴파일하기만 하면 그래프에 메모리가 생김

```python
from langgraph.checkpoint.memory import MemorySaver
memory = MemorySaver()
react_graph_memory = builder.compile(checkpointer=memory)

```

- 매우 중요 : 메모리를 사용할 때는 `thread_id`를 지정해야 함.
    - `thread_id`는 그래프 상태 컬렉션을 저장
- 체크포인터는 그래프의 모든 단계에서 상태를 기록함
- 이러한 체크포인트는 스레드에 저장됨
- 향후 `thread_id`를 사용하여 해당 스레드에 접근할 수 있음

![image.png](https://cdn.prod.website-files.com/65b8cd72835ceeacd4449a53/66e0e9f526b41a4ed9e2d28b_agent-memory2.png)

```python
# 스레드 지정
config = {"configurable": {"thread_id": "1"}}

# 입력 지정
messages = [HumanMessage(content="3과 4를 더하세요.")]

# 실행
messages = react_graph_memory.invoke({"messages": messages},config)
for m in messages['messages']:
    m.pretty_print()

```

- **같은 `thread_id`를 전달하면 이전에 기록된 상태 체크포인트에서 계속 진행할 수 있음!**
- 우리가 전달한 `HumanMessage` ("그것에 2를 곱하세요.")는 위의 대화에 추가됨.
- 따라서 모델은 이제 `그것`이 `3과 4의 합은 7입니다.`를 참조한다는 것을 알고 있음.

```python
messages = [HumanMessage(content="그것에 2를 곱하세요.")]
messages = react_graph_memory.invoke({"messages": messages}, config)
for m in messages['messages']:
    m.pretty_print()

```