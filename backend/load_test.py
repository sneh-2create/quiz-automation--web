import asyncio
import httpx
import time
import random

BASE_URL = "http://localhost:8000/api"
NUM_USERS = 100

async def simulate_user(user_id):
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Register
        email = f"student_load_test_{user_id}@example.com"
        password = "Password123"
        reg_id = f"LOAD{user_id:05d}"
        reg_data = {
            "email": email,
            "full_name": f"Load Test User {user_id}",
            "password": password,
            "role": "student",
            "registration_id": reg_id,
            "father_name": "Parent",
            "college_area": "Test City",
            "stream": "CSE",
            "mobile_no": f"90000{user_id % 100000:05d}",
        }
        try:
            r = await client.post("/auth/register", json=reg_data)
        except Exception:
            pass # ignore if already exists

        # 2. Login
        start_time = time.time()
        try:
            r = await client.post(
                "/auth/login",
                data={"username": email, "password": password, "portal": "student"},
            )
            if r.status_code != 200:
                return False, 0
            
            token = r.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # 3. Get Quizzes
            r = await client.get("/quizzes", headers=headers)
            quizzes = r.json()
            if not quizzes:
                return False, time.time() - start_time
            
            quiz_id = quizzes[0]["id"]

            # 4. Start Attempt
            r = await client.post(f"/attempts/start?quiz_id={quiz_id}", headers=headers)
            if r.status_code not in (200, 400): # 400 is max attempts reached, we can ignore
                return False, time.time() - start_time
            
            attempt_data = r.json()
            attempt_id = attempt_data.get("attempt_id")
            if not attempt_id:
                # find existing active attempt or return False
                return True, time.time() - start_time

            # 5. Get Questions
            r = await client.get(f"/attempts/{attempt_id}/questions", headers=headers)
            questions = r.json()

            # 6. Answer Questions
            for q in questions:
                # Simulate thinking time
                await asyncio.sleep(random.uniform(0.1, 0.5))
                option = random.choice(["a", "b", "c", "d"])
                ans_data = {
                    "attempt_id": attempt_id,
                    "question_id": q["id"],
                    "selected_option": option,
                    "time_taken_seconds": 1
                }
                await client.post("/attempts/save-answer", json=ans_data, headers=headers)

            # 7. Submit
            await client.post("/attempts/submit", json={"attempt_id": attempt_id}, headers=headers)
            
            total_time = time.time() - start_time
            return True, total_time

        except Exception as e:
            print(f"User {user_id} error: {e}")
            return False, 0

async def main():
    print(f"Starting load test with {NUM_USERS} concurrent users...")
    start_total = time.time()
    
    tasks = [simulate_user(i) for i in range(NUM_USERS)]
    results = await asyncio.gather(*tasks)
    
    successes = sum(1 for r, _ in results if r)
    failures = NUM_USERS - successes
    times = [t for r, t in results if r]
    avg_time = sum(times) / len(times) if times else 0
    total_time = time.time() - start_total
    
    print("-" * 30)
    print("Load Test Results:")
    print(f"Total simulated users: {NUM_USERS}")
    print(f"Successful complete runs: {successes}")
    print(f"Failed runs: {failures}")
    print(f"Average time per user flow: {avg_time:.2f}s")
    print(f"Total script execution time: {total_time:.2f}s")
    print("-" * 30)

if __name__ == "__main__":
    asyncio.run(main())
