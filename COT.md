# Chain of Thought (CoT) 프롬프트 튜토리얼

## 개요

이 튜토리얼은 복잡한 문제를 단계별 추론 과정으로 분해하도록 AI 모델을 유도하는 프롬프트 엔지니어링의 강력한 기술인 **체인 오브 소트(Chain of Thought, CoT) 프롬프트**에 대해 소개합니다. OpenAI의 GPT 모델과 LangChain 라이브러리를 사용하여 CoT 프롬프트를 **ITS(이슈 추적 시스템)** 기획 업무에 어떻게 적용할 수 있는지 탐구할 것입니다.

## 목표

서비스 기획자들은 JIRA나 ASANA와 같은 **이슈 추적 시스템(ITS)**을 기획할 때 복잡한 의사 결정과 문제 해결을 요구받습니다. CoT 프롬프트는 AI 모델이 이러한 복잡한 문제 해결 과정을 단계별로 보여주도록 권장하여, 보다 **투명하고 논리적이며 검증 가능한 출력**을 생성하도록 합니다. 이 기술은 AI 응답의 **정확도**를 향상시킬 뿐만 아니라 더 **해석 가능**하고 **신뢰할 수 있게** 만듭니다.

## 주요 구성 요소

1. **기본 CoT 프롬프트**: 개념 소개 및 간단한 구현.
2. **고급 CoT 기술**: 보다 정교한 CoT 접근 방식 탐구.
3. **비교 분석**: 표준 프롬프트와 CoT 프롬프트의 차이점 조사.
4. **문제 해결 응용**: CoT를 ITS 기획 업무의 다양한 복잡한 작업에 적용.

## 구현 방식

1. **환경 설정**: 필요한 라이브러리를 가져오고 OpenAI API를 설정합니다.
2. **기본 CoT 구현**: 간단한 CoT 프롬프트를 만들고 그 출력을 표준 프롬프트와 비교합니다.
3. **고급 CoT 기술**: 다단계 추론 및 자기 일관성 검사를 포함한 더 복잡한 CoT 전략을 탐구합니다.
4. **실용적 응용**: ITS 기획 업무에서 발생하는 다양한 문제 해결 시나리오에 CoT 프롬프트를 적용합니다.

## 결론

이 튜토리얼이 끝나면, 학습자들은 체인 오브 소트 프롬프트와 그 응용에 대한 탄탄한 이해를 갖게 될 것입니다. 다양한 시나리오에서 CoT 기술을 구현하여 AI 생성 응답의 **품질**과 **해석 가능성**을 향상시키는 실용적인 기술을 습득하게 됩니다. 이 지식은 ITS와 같은 도구를 기획하고 개발하는 **서비스 기획자**뿐만 아니라 AI 기반 인사이트에 의존하는 **프로젝트 관리자**와 **팀 리더**에게도 가치가 있을 것입니다.

---

## 설정

필요한 라이브러리를 가져오고 환경을 설정하는 것부터 시작하겠습니다.

```python
import os
from dotenv import load_dotenv
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate

# 환경 변수를 로드합니다
load_dotenv()

# OpenAI API 키를 설정합니다
os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

# 언어 모델을 초기화합니다
llm = ChatOpenAI(model_name="gpt-3.5-turbo")
```

---

## 기본 Chain of Thought (CoT) 프롬프트

표준 프롬프트와 CoT 프롬프트의 차이를 보여주는 간단한 예제로 시작해보겠습니다. 이번에는 **유저 스토리 작성**과 관련된 질문을 활용해보겠습니다.

```python
# 표준 프롬프트
standard_prompt = PromptTemplate(
    input_variables=["question"],
    template="다음 요청에 따라 유저 스토리를 작성하세요: {question}."
)

# 체인 오브 소트 프롬프트
cot_prompt = PromptTemplate(
    input_variables=["question"],
    template="다음 요청에 따라 단계별로 유저 스토리를 작성하세요: {question}"
)

# 체인 생성
standard_chain = standard_prompt | llm
cot_chain = cot_prompt | llm

# 예시 질문
question = "프로젝트 관리자가 태스크의 진행 상황을 실시간으로 확인할 수 있는 기능을 추가하고 싶습니다."

# 응답 받기
standard_response = standard_chain.invoke(question).content
cot_response = cot_chain.invoke(question).content

print("표준 응답:")
print(standard_response)
print("\n체인 오브 소트 응답:")
print(cot_response)
```

**출력 결과:**

```
표준 응답:
프로젝트 관리자로서, 나는 태스크의 진행 상황을 실시간으로 확인할 수 있다. 그래서 팀의 업무 현황을 효율적으로 파악할 수 있다.

체인 오브 소트 응답:
1단계: 사용자 역할을 정의합니다.
- 사용자: 프로젝트 관리자

2단계: 목표를 명시합니다.
- 태스크의 진행 상황을 실시간으로 확인하고 싶습니다.

3단계: 기대 효과를 기술합니다.
- 그래서 팀의 업무 현황을 효율적으로 파악하고 프로젝트를 원활하게 관리할 수 있습니다.

유저 스토리:
"프로젝트 관리자로서, 나는 태스크의 진행 상황을 실시간으로 확인할 수 있다. 그래서 팀의 업무 현황을 효율적으로 파악하고 프로젝트를 원활하게 관리할 수 있다."
```

---

## 고급 Chain of Thought (CoT) 프롬프트 기술

이제 **PRD(제품 요구사항 문서)** 작성을 돕기 위한 고급 CoT 기술을 활용해보겠습니다.

```python
advanced_cot_prompt = PromptTemplate(
    input_variables=["feature_request"],
    template="""다음 기능 요청에 따라 PRD의 주요 요소를 단계별로 작성하세요. 각 단계에 대해:
1. 기능의 목적을 설명하세요.
2. 사용자 시나리오를 작성하세요.
3. 기능 요구사항을 명확히 나열하세요.
4. 성공 기준을 정의하세요.

기능 요청: {feature_request}

PRD 작성:"""
)

advanced_cot_chain = advanced_cot_prompt | llm

feature_request = "사용자가 이슈에 파일을 드래그 앤 드롭하여 첨부할 수 있는 기능을 추가하고 싶습니다."

advanced_cot_response = advanced_cot_chain.invoke(feature_request).content
print(advanced_cot_response)
```

**출력 결과:**

```
1. **기능의 목적을 설명합니다.**
사용자들이 이슈에 관련된 파일을 손쉽게 첨부할 수 있도록 드래그 앤 드롭 기능을 제공합니다. 이를 통해 이슈 설명의 정확성과 효율성을 높입니다.

2. **사용자 시나리오를 작성합니다.**
- 사용자 A는 버그를 보고하려고 합니다. 데스크톱에 있는 스크린샷을 이슈에 첨부하기 위해 파일을 드래그하여 이슈 작성 창에 놓습니다.
- 사용자 B는 기능 개선 요청을 하며, 관련 문서를 첨부하기 위해 파일을 드래그 앤 드롭합니다.

3. **기능 요구사항을 명확히 나열합니다.**
- 사용자는 이슈 작성 및 편집 시 파일을 드래그 앤 드롭하여 첨부할 수 있어야 합니다.
- 지원되는 파일 형식: JPG, PNG, PDF, DOCX 등 일반적인 문서 및 이미지 파일.
- 여러 개의 파일을 동시에 첨부할 수 있어야 합니다.
- 드래그 앤 드롭 영역이 명확하게 표시되어야 합니다.
- 첨부된 파일의 미리보기 또는 리스트가 제공되어야 합니다.

4. **성공 기준을 정의합니다.**
- 사용자가 드래그 앤 드롭으로 파일을 첨부하여 이슈를 생성하거나 업데이트할 수 있다.
- 첨부된 파일이 서버에 정상적으로 업로드되고, 이슈 상세 페이지에서 확인할 수 있다.
- 사용자 테스트를 통해 95% 이상의 만족도를 얻는다.
```

---

## 비교 분석

표준 프롬프트와 CoT 프롬프트의 효과를 **ASCII ART를 활용한 와이어프레임 생성**에서 비교해보겠습니다.

```python
wireframe_request = """
새로운 대시보드 페이지의 레이아웃을 계획하고 있습니다. 상단에는 검색 바가 있고, 좌측에는 내비게이션 메뉴, 우측에는 주요 내용이 표시됩니다. 이를 ASCII ART로 와이어프레임을 그려주세요.
"""

standard_response = standard_chain.invoke(wireframe_request).content
cot_response = advanced_cot_chain.invoke(wireframe_request).content

print("표준 응답:")
print(standard_response)
print("\n체인 오브 소트 응답:")
print(cot_response)
```

**출력 결과:**

```
표준 응답:
+-----------------------------+
|           검색 바           |
+------------+----------------+
| 내비게이션 |    주요 내용    |
|    메뉴    |                |
+------------+----------------+

체인 오브 소트 응답:
1. **기능의 목적을 설명합니다.**
새로운 대시보드 페이지의 레이아웃을 ASCII ART로 시각화하여 팀과 공유합니다.

2. **구성 요소를 식별합니다.**
- 상단 검색 바
- 좌측 내비게이션 메뉴
- 우측 주요 내용 영역

3. **레이아웃 구조를 설계합니다.**
- 전체 페이지를 큰 사각형으로 표현
- 상단에 검색 바를 가로로 배치
- 그 아래 좌측에 내비게이션 메뉴, 우측에 주요 내용을 배치

4. **ASCII ART로 와이어프레임을 작성합니다.**


+------------------------------------------+
|                검색 바                    |
+----------------+-------------------------+
| 내비게이션 메뉴    |       주요 내용           |
|                |                         |
|                |                         |
+----------------+-------------------------+


```

---

## 문제 해결 응용

이제 CoT 프롬프트를 활용하여 **기능 명세서 작성**과 관련된 복잡한 작업을 수행해보겠습니다.

```python
llm = ChatOpenAI(model_name="gpt-4")

functional_spec_prompt = PromptTemplate(
    input_variables=["feature_description"],
    template="""다음 기능에 대한 기능 명세서를 작성하세요. 각 단계에 대해:

### 1. 기능 개요

기능의 목적과 배경을 설명하세요.

### 2. 기능 상세 설명

- 주요 기능과 서브 기능을 나열하세요.
- 각 기능에 대한 동작 방식을 상세히 설명하세요.

### 3. UI/UX 요구사항

- 인터페이스에 대한 요구사항을 기술하세요.
- 사용자 인터랙션 흐름을 설명하세요.

### 4. 비즈니스 로직

- 기능 구현을 위한 비즈니스 로직을 명확히 하세요.
- 데이터 처리 및 저장 방식에 대해 설명하세요.

### 5. 에러 처리 및 예외 상황

- 예상되는 에러 상황과 그에 대한 처리 방법을 나열하세요.

### 기능 설명:

{feature_description}

**기능 명세서:**"""
)

functional_spec_chain = functional_spec_prompt | llm

feature_description = """사용자가 자신의 작업 우선순위를 설정하고, 이에 따라 대시보드에 태스크가 정렬되는 기능을 추가하고 싶습니다."""

functional_spec_response = functional_spec_chain.invoke(feature_description).content
print(functional_spec_response)
```

**출력 결과:**

```
### 1. 기능 개요

사용자가 자신의 작업 우선순위를 설정할 수 있는 기능을 추가하여 개인화된 작업 관리 환경을 제공합니다. 이를 통해 사용자는 중요한 태스크를 쉽게 파악하고 효율적으로 업무를 처리할 수 있습니다.

### 2. 기능 상세 설명

- **우선순위 설정 기능**
  - 사용자는 각 태스크에 대해 우선순위를 '높음', '중간', '낮음' 등으로 지정할 수 있습니다.
- **대시보드 태스크 정렬**
  - 대시보드에서는 설정된 우선순위에 따라 태스크가 자동으로 정렬됩니다.
  - 기본 정렬 순서는 '높음' > '중간' > '낮음'입니다.
- **우선순위 필터링**
  - 사용자는 특정 우선순위의 태스크만 표시하도록 필터를 적용할 수 있습니다.

### 3. UI/UX 요구사항

- **우선순위 설정 인터페이스**
  - 태스크 생성 및 편집 화면에 우선순위 선택 드롭다운 메뉴를 추가합니다.
- **대시보드 표시**
  - 우선순위별로 구분된 섹션 또는 태스크 카드에 우선순위 라벨을 표시합니다.
- **사용자 인터랙션 흐름**
  - 사용자가 우선순위를 변경하면 대시보드가 실시간으로 업데이트됩니다.

### 4. 비즈니스 로직

- **데이터 모델 업데이트**
  - 태스크 객체에 우선순위 속성을 추가합니다.
- **정렬 알고리즘**
  - 대시보드 로딩 시 우선순위 값을 기준으로 태스크 리스트를 정렬합니다.
- **필터링 기능**
  - 사용자 선택에 따라 쿼리를 수정하여 해당 우선순위의 태스크만 불러옵니다.

### 5. 에러 처리 및 예외 상황

- **우선순위 미설정 태스크**
  - 우선순위가 설정되지 않은 태스크는 '낮음'으로 자동 지정합니다.
- **데이터베이스 연결 오류**
  - 우선순위 설정 또는 변경 시 오류가 발생하면 사용자에게 알림을 표시하고 재시도를 유도합니다.
- **동시성 문제**
  - 여러 사용자가 동일한 태스크의 우선순위를 동시에 변경하는 경우, 최신 변경 사항을 기준으로 업데이트하고 충돌을 방지합니다.
```

---

## 마무리

이상으로 체인 오브 소트(Chain of Thought) 프롬프트를 활용하여 ITS 기획 업무에 적용할 수 있는 다양한 예제와 그 응용 방법을 살펴보았습니다. CoT 프롬프트를 통해 AI 모델의 추론 과정을 명시적으로 표현하여 더 정확하고 신뢰할 수 있는 결과물을 얻을 수 있습니다. 이 튜토리얼이 여러분의 프롬프트 엔지니어링 능력을 향상시키고, 실제 업무에서 생산성을 높이는 데 도움이 되길 바랍니다.
