from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.core.config import settings

def get_llm():
    return ChatOllama(
        model=settings.OLLAMA_MODEL, 
        temperature=settings.OLLAMA_TEMPERATURE, 
        num_ctx=settings.OLLAMA_CTX_SIZE, 
        repeat_penalty=settings.OLLAMA_REPEAT_PENALTY
    )

class PersonajeChain:
    def __init__(self, system_prompt_base: str):
        self.llm = get_llm()
        self.chat_history = []  
        self.system_prompt_base = system_prompt_base
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "{prompt_completo}"), 
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{user_input}")
        ])
        
        self.chain = self.prompt | self.llm

    def deshacer_ultimo_turno(self):
        """[NUEVO] Retrocede el tiempo en la RAM para poder regenerar sin duplicar ni causar amnesia."""
        if len(self.chat_history) >= 2:
            self.chat_history.pop() # Borra la mala respuesta de la IA
            self.chat_history.pop() # Borra tu prompt

    def predict(self, user_input: str, memoria_rol_actual: str = "") -> str:
        prompt_final = self.system_prompt_base
        if memoria_rol_actual:
            prompt_final += f"\n\n[ESTADO DEL MUNDO ACTUALIZADO]\n{memoria_rol_actual}"

        respuesta = self.chain.invoke({
            "prompt_completo": prompt_final,
            "chat_history": self.chat_history,
            "user_input": user_input
        })
        
        self.chat_history.append(HumanMessage(content=user_input))
        self.chat_history.append(AIMessage(content=respuesta.content))
        
        if len(self.chat_history) > 10:
            self.chat_history = self.chat_history[-10:]
            
        return respuesta.content

def crear_cadena_personaje(system_prompt_base: str):
    return PersonajeChain(system_prompt_base)