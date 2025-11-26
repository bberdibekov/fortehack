import time
import json
from typing import List, Dict, Type, TypeVar, Optional, Any
from pydantic import BaseModel
from groq import AsyncGroq, APIConnectionError, RateLimitError, InternalServerError
from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception_type

from app.config.settings import AppConfig
from app.core.llm.interface import ILLMClient
from app.core.llm.types import LLMResponse, ToolCallRequest
from app.core.llm.exceptions import LLMRefusalError
from app.utils.logger import setup_logger

logger = setup_logger("LLM_Client")

T = TypeVar('T', bound=BaseModel)

class GroqClient(ILLMClient):
    def __init__(self):
        self.client = AsyncGroq(api_key=AppConfig.GROQ_API_KEY)
        self.default_model = 'openai/gpt-oss-120b' 

    def _build_params(self, model: Optional[str], temperature: Optional[float] = None) -> Dict[str, Any]:
        params = {"model": model or self.default_model}
        if temperature is not None:
            params["temperature"] = temperature
        return params

    @retry(
        retry=retry_if_exception_type((RateLimitError, APIConnectionError, InternalServerError)),
        wait=wait_random_exponential(min=1, max=60),
        stop=stop_after_attempt(6)
    )
    async def chat_with_tools(
        self, 
        messages: List[Dict[str, str]], 
        tools_schema: List[Dict[str, Any]],
        temperature: float = 0.0
    ) -> LLMResponse:
        """
        Implementation of Tool Calling for Groq.
        """
        params = self._build_params(self.default_model, temperature)
        
        try:
            logger.info(f"🚀 Calling Groq Chat with Tools [{params['model']}]")
            
            # Groq uses standard OpenAI-compatible tool definitions
            response = await self.client.chat.completions.create(
                messages=messages,
                tools=tools_schema,
                tool_choice="auto", # Let model decide
                **params
            )
            
            message = response.choices[0].message
            
            # Map Groq response to our architecture's generic LLMResponse
            llm_response = LLMResponse(
                content=message.content,
                role=message.role
            )

            # Extract Tool Calls if present
            if message.tool_calls:
                for tc in message.tool_calls:
                    llm_response.tool_calls.append(ToolCallRequest(
                        call_id=tc.id,
                        function_name=tc.function.name,
                        arguments=tc.function.arguments # Groq returns this as a JSON string
                    ))

            return llm_response

        except Exception as e:
            logger.error(f"❌ Groq Tool Call Error: {str(e)}")
            raise e

    async def get_structured_completion(
        self,
        messages: List[Dict[str, str]],
        response_model: Type[T],
        temperature: Optional[float] = None,
        model: Optional[str] = None
    ) -> T:
        params = self._build_params(model, temperature)
        start_time = time.time()

        # Groq JSON Mode requires explicit schema in response_format
        response_format = {
            "type": "json_object" # Groq standard JSON mode
        }
        
        # We append a system instruction to ensure JSON compliance
        schema_json = json.dumps(response_model.model_json_schema())
        messages_with_schema = [
            *messages, 
            {"role": "system", "content": f"Return the answer as valid JSON matching this schema: {schema_json}"}
        ]

        try:
            response = await self.client.chat.completions.create(
                messages=messages_with_schema,
                response_format=response_format,
                **params
            )

            duration = time.time() - start_time
            logger.info(f"✅ Success ({duration:.2f}s)")

            raw = response.choices[0].message.content
            data = json.loads(raw)

            return response_model.model_validate(data)

        except Exception as e:
            logger.error(f"❌ LLM Error: {str(e)}")
            raise e

    async def get_text_completion(
        self, 
        messages: List[Dict[str, str]], 
        temperature: Optional[float] = None,
        model: Optional[str] = None
    ) -> str:
        
        params = self._build_params(model, temperature)
        start_time = time.time()

        try:
            logger.info(f"🚀 Calling Chat API [{params['model']}]")
            
            completion = await self.client.chat.completions.create(
                messages=messages,
                **params
            )
            
            duration = time.time() - start_time
            logger.info(f"✅ Success ({duration:.2f}s)")
            
            return completion.choices[0].message.content
        except Exception as e:
            logger.error(f"❌ LLM Error: {str(e)}")
            raise e