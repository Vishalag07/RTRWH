#!/usr/bin/env python3

import sys
sys.path.append('.')

from app.schemas import UserCreate
from app.models import User
from app.security import hash_password
from app.db import get_db

# Test data
test_data = {
    "name": "Debug User",
    "email": "debug@example.com", 
    "password": "testpassword123",
    "location": "Debug City"
}

print("=== Testing Registration Flow ===")
print(f"Input data: {test_data}")

try:
    # Test 1: UserCreate schema parsing
    print("\n1. Testing UserCreate schema...")
    user_create = UserCreate(**test_data)
    print(f"✅ UserCreate parsed successfully")
    print(f"   - email: {user_create.email}")
    print(f"   - name: {user_create.name}")
    print(f"   - location: {user_create.location}")
    print(f"   - password: [HIDDEN]")
    
    # Test 2: User model creation
    print("\n2. Testing User model creation...")
    user = User(
        email=user_create.email,
        name=user_create.name,
        location=user_create.location,
        password_hash=hash_password(user_create.password)
    )
    print(f"✅ User model created successfully")
    print(f"   - email: {user.email}")
    print(f"   - name: {user.name}")
    print(f"   - location: {user.location}")
    print(f"   - password_hash: [HIDDEN]")
    
    # Test 3: Database save
    print("\n3. Testing database save...")
    db = next(get_db())
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == user_create.email).first()
        if existing_user:
            print(f"⚠️  User already exists, deleting first...")
            db.delete(existing_user)
            db.commit()
        
        # Add new user
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✅ User saved to database successfully")
        print(f"   - id: {user.id}")
        print(f"   - email: {user.email}")
        print(f"   - name: {user.name}")
        print(f"   - location: {user.location}")
        
        # Test 4: Retrieve from database
        print("\n4. Testing database retrieval...")
        saved_user = db.query(User).filter(User.email == user_create.email).first()
        if saved_user:
            print(f"✅ User retrieved from database successfully")
            print(f"   - id: {saved_user.id}")
            print(f"   - email: {saved_user.email}")
            print(f"   - name: {saved_user.name}")
            print(f"   - location: {saved_user.location}")
        else:
            print(f"❌ User not found in database")
            
    except Exception as e:
        print(f"❌ Database error: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Test Complete ===")
