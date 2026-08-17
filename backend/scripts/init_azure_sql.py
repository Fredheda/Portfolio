import os
import mssql_python
from dotenv import load_dotenv

load_dotenv()

_client_id = os.getenv("AZURE_CLIENT_ID")
_auth = f"Authentication=ActiveDirectoryMSI;Uid={_client_id};" if _client_id else "Authentication=ActiveDirectoryDefault;"

_schema_path = os.path.join(os.path.dirname(__file__), "..", "sql", "schema.sql")
with open(_schema_path) as f:
    _schema_sql = f.read()

conn = mssql_python.connect(
    f"Server={os.environ['AZURE_SQL_SERVER']};"
    f"Database={os.environ['AZURE_SQL_DATABASE']};"
    f"{_auth}"
    "Encrypt=yes;"
)
cursor = conn.cursor()
cursor.execute(_schema_sql)
conn.commit()
cursor.close()
conn.close()
print("chatbot_logs table ready.")
