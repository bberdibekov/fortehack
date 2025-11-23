# src/core/utils.py
import asyncio
from typing import Coroutine, Any

def run_async(coro: Coroutine[Any, Any, Any]) -> Any:
    """
    Safely runs an async coroutine in a synchronous context (Streamlit).
    Handles existing event loops (e.g. inside Jupyter or specific server setups).
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        # If we are already in an event loop, use a task (rare in standard Streamlit)
        return asyncio.create_task(coro)
    else:
        # Standard Streamlit execution
        return asyncio.run(coro)