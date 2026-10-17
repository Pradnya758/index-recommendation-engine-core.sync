
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# Create a separate workspace
workspace = client.post("/api/workspace").json()
session_id = workspace["session_id"]

# Insert a test product
sql = """
INSERT INTO products
(product_id, product_name, sku, category, unit_price, stock_quantity)
VALUES (9999, 'Test', 'TEST-9999', 'Testing', 1, 1)
"""

response = client.post(
    "/api/workspace/execute",
    json={"session_id": session_id, "sql": sql},
)

print("Insert status:", response.status_code)
print("Insert response:", response.text)

# Confirm the product exists in the workspace
check = client.post(
    "/api/workspace/execute",
    json={
        "session_id": session_id,
        "sql": "SELECT * FROM products WHERE product_id = 9999",
    },
)

print("Verification:", check.status_code)
print(check.text)
