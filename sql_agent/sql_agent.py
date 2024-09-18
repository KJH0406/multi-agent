from dotenv import load_dotenv
from langchain_community.utilities import SQLDatabase
from langchain_openai import ChatOpenAI
from langchain_community.agent_toolkits import create_sql_agent

load_dotenv()
db_name = "korean_game_dev_project"
db = SQLDatabase.from_uri(f"sqlite:///{db_name}.db")
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
# llm = ChatOpenAI(model="gpt-4o", temperature=0)

agent_executor = create_sql_agent(llm, db=db, agent_type="openai-tools", verbose=True)
agent_executor.invoke({"input": "현재 진행 중인 프로젝트는 몇개이며, 각 프로젝트 이름을 함께 알려주세요"})


