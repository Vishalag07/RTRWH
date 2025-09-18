from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, Response
from fastapi import Request
from openai import OpenAI
import json
import os
from typing import AsyncGenerator

from app.schemas import ChatMessage, ChatResponse, ChatStreamResponse
from app.settings import get_settings

router = APIRouter()
settings = get_settings()

# Initialize OpenAI client conditionally
def get_openai_client():
    """Get OpenAI client if API key is available, otherwise return None"""
    api_key = settings.openai_api_key
    if not api_key:
        return None
    try:
        return OpenAI(api_key=api_key)
    except Exception:
        return None

openai_client = get_openai_client()


@router.options("/chat")
async def chat_options():
    """Handle CORS preflight requests for chat endpoint"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
        }
    )

@router.post("/chat", response_model=ChatResponse)
async def chat_non_streaming(message: ChatMessage):
    """
    Non-streaming chat endpoint for simple requests.
    Returns the complete response at once.
    """
    try:
        # Check if OpenAI client is available
        if not openai_client:
            return ChatResponse(response="Chat service is currently unavailable. Please configure OPENAI_API_KEY in your environment variables.")
        
        response = openai_client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a helpful chatbot for rainwater harvesting and groundwater management."},
                {"role": "user", "content": message.message}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        return ChatResponse(response=response.choices[0].message.content)
    
    except Exception as e:
        # Fallback response when API quota is exceeded
        if "quota" in str(e).lower() or "429" in str(e):
            return ChatResponse(response="I'm currently experiencing high demand and my API quota has been exceeded. Please try again later or contact support to add more credits to your OpenAI account.")
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")


@router.options("/chat/stream")
async def chat_streaming_options():
    """Handle CORS preflight requests for streaming endpoint"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
        }
    )

@router.post("/chat/stream")
async def chat_streaming(message: ChatMessage):
    """
    Streaming chat endpoint using Server-Sent Events (SSE).
    Streams the response word-by-word for real-time chat experience.
    """
    try:
        def generate_response() -> AsyncGenerator[str, None]:
            try:
                # Check if OpenAI client is available
                if not openai_client:
                    fallback_message = "Chat service is currently unavailable. Please configure OPENAI_API_KEY in your environment variables."
                    yield f"data: {json.dumps({'chunk': fallback_message})}\n\n"
                    yield f"data: {json.dumps({'chunk': '[DONE]'})}\n\n"
                    return
                
                stream = openai_client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[
                        {"role": "system", "content": "You are a helpful chatbot for rainwater harvesting and groundwater management."},
                        {"role": "user", "content": message.message}
                    ],
                    max_tokens=1000,
                    temperature=0.7,
                    stream=True
                )
                
                for chunk in stream:
                    if chunk.choices[0].delta.content is not None:
                        content = chunk.choices[0].delta.content
                        # Format as SSE
                        yield f"data: {json.dumps({'chunk': content})}\n\n"
                
                # Send end signal
                yield f"data: {json.dumps({'chunk': '[DONE]'})}\n\n"
                
            except Exception as e:
                # Fallback response when API quota is exceeded
                if "quota" in str(e).lower() or "429" in str(e):
                    fallback_message = "I'm currently experiencing high demand and my API quota has been exceeded. Please try again later or contact support to add more credits to your OpenAI account."
                    yield f"data: {json.dumps({'chunk': fallback_message})}\n\n"
                else:
                    error_response = {"error": f"Error generating response: {str(e)}"}
                    yield f"data: {json.dumps(error_response)}\n\n"
        
        return StreamingResponse(
            generate_response(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error setting up streaming: {str(e)}")


@router.get("/chat/health")
async def chat_health():
    """
    Health check endpoint for the chat service.
    """
    return {
        "status": "healthy", 
        "service": "chat",
        "openai_available": openai_client is not None,
        "openai_model": settings.openai_model if openai_client else None
    }
