# app/core/llm/openai_client.py
import time
from typing import List, Dict, Type, TypeVar, Optional, Any
from pydantic import BaseModel
from openai import AsyncOpenAI, APIError, RateLimitError, APIConnectionError, InternalServerError
from tenacity import retry, stop_after_attempt, wait_random_exponential, retry_if_exception_type

from app.config.settings import AppConfig
from app.core.llm.interface import ILLMClient
from app.core.llm.exceptions import LLMRefusalError
from app.core.llm.types import LLMResponse, ToolCallRequest
from app.utils.logger import setup_logger

logger = setup_logger("LLM_Client")

T = TypeVar('T', bound=BaseModel)

class OpenAIClient(ILLMClient):
    def __init__(self):
        self.client = AsyncOpenAI(api_key=AppConfig.OPENAI_API_KEY)
        self.default_model = AppConfig.LLM.SMART_MODEL

    def _build_params(self, model: Optional[str], temperature: Optional[float]) -> Dict[str, Any]:
        params = {"model": model or self.default_model}
        if temperature is not None:
            params["temperature"] = temperature
        return params

    @retry(
        retry=retry_if_exception_type((RateLimitError, APIConnectionError, InternalServerError)),
        wait=wait_random_exponential(min=1, max=60),
        stop=stop_after_attempt(6)
    )
    async def get_structured_completion(
        self, 
        messages: List[Dict[str, str]], 
        response_model: Type[T],
        temperature: Optional[float] = None,
        model: Optional[str] = None
    ) -> T:
        
        params = self._build_params(model, temperature)
        start_time = time.time()
        
        try:
            logger.info(f"🚀 Calling Structured API [{params['model']}]")
            
            response = await self.client.responses.parse(
                input=messages, 
                text_format=response_model,
                **params
            )
            
            duration = time.time() - start_time
            logger.info(f"✅ Success ({duration:.2f}s)")
            
            result = response.output_parsed
            if result is None:
                logger.warning("⚠️ Model Refusal detected")
                raise LLMRefusalError("The model returned no parsed output.")
            return result
            
        except Exception as e:
            logger.error(f"❌ LLM Error: {str(e)}")
            raise e

    @retry(
        retry=retry_if_exception_type((RateLimitError, APIConnectionError, InternalServerError)),
        wait=wait_random_exponential(min=1, max=60),
        stop=stop_after_attempt(6)
    )
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
        
    
    async def chat_with_tools(
        self, 
        messages: List[Dict[str, str]], 
        tools_schema: List[Dict[str, Any]],
    ) -> LLMResponse:
        """
        Implementation of the generic chat_with_tools interface for OpenAI.
        """
        params = {
            "model": self.default_model,
            "messages": messages,
            "tools": tools_schema,
            "tool_choice": "auto",
        }

        try:
            logger.info(f"🚀 Calling Chat API with Tools [{params['model']}]")
            
            completion = await self.client.chat.completions.create(**params)
            
            message = completion.choices[0].message
            
            # --- Convert OpenAI Object to Generic LLMResponse ---
            response = LLMResponse(
                content=message.content,
                role=message.role
            )

            if message.tool_calls:
                for tc in message.tool_calls:
                    response.tool_calls.append(ToolCallRequest(
                        call_id=tc.id,
                        function_name=tc.function.name,
                        arguments=tc.function.arguments
                    ))

            return response

        except Exception as e:
            logger.error(f"❌ OpenAI Tool Call Error: {str(e)}")
            raise e