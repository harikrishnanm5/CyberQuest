import os
import time
import json
import requests

# Benchmark configuration
RUNS = 5
PROMPT = "Provide a high-level security audit checklist for a Kubernetes cluster."
AGENT = "axiom"

# Load environment variables
# Note: In a real scenario, you'd use python-dotenv, but we'll stick to requests as requested.
API_KEY = os.getenv("VITE_AMD_API_KEY", "your_api_key_here")
ENDPOINT = os.getenv("VITE_AMD_ENDPOINT", "")
MODEL = os.getenv("VITE_AMD_MODEL", "llama3-8b")

if not ENDPOINT:
    print("Error: VITE_AMD_ENDPOINT is not set.")
    exit(1)

URL = f"{ENDPOINT}/v1/chat/completions"

def run_benchmark():
    latencies = []
    tokens_per_sec = []

    print(f"Starting AMD Cloud Benchmark ({RUNS} runs)...")
    print(f"Endpoint: {ENDPOINT}")
    print(f"Model: {MODEL}\n")

    for i in range(RUNS):
        print(f"Run {i+1}/{RUNS}...", end="", flush=True)
        
        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": "You are AXIOM, a senior SOC analyst for CipherOS."},
                {"role": "user", "content": PROMPT}
            ],
            "temperature": 0.7
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}"
        }

        start_time = time.time()
        try:
            response = requests.post(URL, headers=headers, json=payload, timeout=60)
            response.raise_for_status()
            end_time = time.time()

            latency = end_time - start_time
            data = response.json()
            
            completion_tokens = data.get("usage", {}).get("completion_tokens", 0)
            tps = completion_tokens / latency if latency > 0 else 0

            latencies.append(latency)
            tokens_per_sec.append(tps)

            print(f" Success ({latency:.2f}s, {tps:.2f} t/s)")
        except Exception as e:
            print(f" Failed: {e}")

    if latencies:
        avg_latency = sum(latencies) / len(latencies)
        avg_tps = sum(tokens_per_sec) / len(tokens_per_sec)

        print("\n" + "="*40)
        print("BENCHMARK RESULTS")
        print("="*40)
        print(f"Average Latency:    {avg_latency:.2f} seconds")
        print(f"Average Tokens/sec: {avg_tps:.2f} t/s")
        print("="*40)
    else:
        print("\nBenchmark failed to collect data.")

if __name__ == "__main__":
    run_benchmark()
