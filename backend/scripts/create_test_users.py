#!/usr/bin/env python3
"""
创建测试用户
运行：docker exec -it heuraideas-proto-v1-backend-1 python scripts/create_test_users.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session # pyright: ignore[reportMissingImports]
from app.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash


def create_test_users():
    """创建三个测试用户：Alice, Bob, Charlie"""
    db = SessionLocal()
    
    test_users = [
        {"email": "alice@test.com", "username": "Alice", "password": "123456"},
        {"email": "bob@test.com", "username": "Bob", "password": "123456"},
        {"email": "charlie@test.com", "username": "Charlie", "password": "123456"},
    ]
    
    created_users = []
    
    for user_data in test_users:
        existing = db.query(User).filter(
            User.email == user_data["email"]
        ).first()
        
        if not existing:
            user = User(
                email=user_data["email"],
                username=user_data["username"],
                hashed_password=get_password_hash(user_data["password"]),
            )
            db.add(user)
            created_users.append(user)
            print(f"创建用户：{user_data['email']}")
        else:
            print(f"用户已存在：{user_data['email']}")
            created_users.append(existing)
    
    db.commit()
    db.close()
    
    print("测试用户创建完成！")
    print("登录信息：")
    print("   Alice: alice@test.com / 123456")
    print("   Bob: bob@test.com / 123456")
    print("   Charlie: charlie@test.com / 123456")
    
    return created_users


if __name__ == "__main__":
    create_test_users()
