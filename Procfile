azurite: cd mcp-tools && azurite --silent --location .azurite --debug .azurite/debug.log
mcp: cd mcp-tools && func start
backend: cd backend && until curl -s -o /dev/null http://localhost:7071/runtime/webhooks/mcp; do sleep 1; done && PORT=8000 poetry run python main.py
frontend: cd frontend && npm run build && PORT=3000 npm start
