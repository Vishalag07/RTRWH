#!/usr/bin/env python3
"""
Simple test script for the chatbot API endpoints.
Run this after starting the backend service.
"""

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:8000"
API_PREFIX = "/api"

def test_non_streaming_chat():
    """Test the non-streaming chat endpoint"""
    print("Testing non-streaming chat endpoint...")
    
    url = f"{BASE_URL}{API_PREFIX}/chat"
    payload = {"message": "Hello, how are you?"}
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        print(f"✅ Non-streaming response: {data['response'][:100]}...")
        return True
    except Exception as e:
        print(f"❌ Non-streaming test failed: {e}")
        return False

def test_streaming_chat():
    """Test the streaming chat endpoint"""
    print("Testing streaming chat endpoint...")
    
    url = f"{BASE_URL}{API_PREFIX}/chat/stream"
    payload = {"message": "Tell me about rainwater harvesting"}
    
    try:
        response = requests.post(url, json=payload, stream=True, timeout=30)
        response.raise_for_status()
        
        print("✅ Streaming response:")
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    try:
                        data = json.loads(line_str[6:])
                        if 'chunk' in data and data['chunk'] != '[DONE]':
                            print(data['chunk'], end='', flush=True)
                        elif data.get('chunk') == '[DONE]':
                            print("\n✅ Streaming completed")
                            break
                    except json.JSONDecodeError:
                        continue
        return True
    except Exception as e:
        print(f"❌ Streaming test failed: {e}")
        return False

def test_health_endpoint():
    """Test the health check endpoint"""
    print("Testing health endpoint...")
    
    url = f"{BASE_URL}{API_PREFIX}/chat/health"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        print(f"✅ Health check: {data}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🤖 Chatbot API Test Suite")
    print("=" * 40)
    
    # Check if backend is running
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print("❌ Backend is not responding properly")
            return
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("Make sure to run: docker-compose up")
        return
    
    print()
    
    # Run tests
    tests = [
        test_health_endpoint,
        test_non_streaming_chat,
        test_streaming_chat
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 40)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! Chatbot is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the error messages above.")

if __name__ == "__main__":
    main()
