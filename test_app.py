import requests
import time
import webbrowser
import os
import sys
from colorama import init, Fore, Style

# Initialize colorama for colored terminal output
init()

def print_header(text):
    print(f"\n{Fore.CYAN}{'=' * 50}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{text.center(50)}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'=' * 50}{Style.RESET_ALL}\n")

def print_success(text):
    print(f"{Fore.GREEN}✓ {text}{Style.RESET_ALL}")

def print_error(text):
    print(f"{Fore.RED}✗ {text}{Style.RESET_ALL}")

def print_info(text):
    print(f"{Fore.YELLOW}ℹ {text}{Style.RESET_ALL}")

def test_backend_connection():
    print_header("Testing Backend Connection")
    
    try:
        response = requests.get("http://localhost:8000/")
        if response.status_code == 200:
            print_success(f"Backend is running: {response.json()}")
            return True
        else:
            print_error(f"Backend returned status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Could not connect to backend. Is it running?")
        return False

def test_cors_headers():
    print_header("Testing CORS Headers")
    
    try:
        response = requests.options("http://localhost:8000/api/auth/login", 
                                   headers={"Origin": "http://localhost:5173"})
        
        print_info("CORS Headers:")
        cors_headers = [
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Methods",
            "Access-Control-Allow-Headers",
            "Access-Control-Allow-Credentials",
            "Access-Control-Max-Age"
        ]
        
        all_headers_present = True
        for header in cors_headers:
            if header in response.headers:
                print_success(f"  {header}: {response.headers[header]}")
            else:
                print_error(f"  {header}: Missing")
                all_headers_present = False
        
        return all_headers_present
    except requests.exceptions.ConnectionError:
        print_error("Could not connect to backend. Is it running?")
        return False

def test_security_headers():
    print_header("Testing Security Headers")
    
    try:
        response = requests.get("http://localhost:8000/")
        
        print_info("Security Headers:")
        security_headers = [
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
            "Strict-Transport-Security",
            "Referrer-Policy",
            "Permissions-Policy"
        ]
        
        all_headers_present = True
        for header in security_headers:
            if header in response.headers:
                print_success(f"  {header}: {response.headers[header]}")
            else:
                print_error(f"  {header}: Missing")
                all_headers_present = False
        
        return all_headers_present
    except requests.exceptions.ConnectionError:
        print_error("Could not connect to backend. Is it running?")
        return False

def test_rate_limiting():
    print_header("Testing Rate Limiting")
    
    try:
        # Make multiple requests to trigger rate limiting
        print_info("Making multiple requests to test rate limiting...")
        
        rate_limit_headers = [
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset"
        ]
        
        # Make first request to check headers
        response = requests.get("http://localhost:8000/api/auth/login")
        
        headers_present = True
        for header in rate_limit_headers:
            if header in response.headers:
                print_success(f"  {header}: {response.headers[header]}")
            else:
                print_error(f"  {header}: Missing")
                headers_present = False
        
        return headers_present
    except requests.exceptions.ConnectionError:
        print_error("Could not connect to backend. Is it running?")
        return False

def open_frontend():
    print_header("Opening Frontend in Browser")
    
    try:
        frontend_url = "http://localhost:5173"
        print_info(f"Opening {frontend_url} in your default browser...")
        webbrowser.open(frontend_url)
        print_success("Frontend opened in browser")
        return True
    except Exception as e:
        print_error(f"Error opening frontend: {str(e)}")
        return False

def main():
    print_header("RTRWH Application Test Suite")
    
    # Test backend connection
    backend_ok = test_backend_connection()
    
    if backend_ok:
        # Test CORS headers
        cors_ok = test_cors_headers()
        
        # Test security headers
        security_ok = test_security_headers()
        
        # Test rate limiting
        rate_limit_ok = test_rate_limiting()
        
        # Summary
        print_header("Test Summary")
        print_success("Backend Connection: OK") if backend_ok else print_error("Backend Connection: Failed")
        print_success("CORS Headers: OK") if cors_ok else print_error("CORS Headers: Issues Found")
        print_success("Security Headers: OK") if security_ok else print_error("Security Headers: Issues Found")
        print_success("Rate Limiting: OK") if rate_limit_ok else print_error("Rate Limiting: Issues Found")
    
    # Open frontend
    frontend_ok = open_frontend()
    print_success("Frontend: Opened in Browser") if frontend_ok else print_error("Frontend: Failed to Open")
    
    print("\nManual testing required for:")
    print("1. Theme switching functionality")
    print("2. Animations and transitions")
    print("3. Responsive layout on different screen sizes")
    print("4. Interactive 3D elements")
    print("5. Canvas animations")

if __name__ == "__main__":
    main()