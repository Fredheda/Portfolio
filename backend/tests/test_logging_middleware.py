from unittest.mock import MagicMock

from langchain.messages import AIMessage, HumanMessage

from agent.logging_middleware import LoggingMiddleware


def test_after_agent_logs_last_human_and_ai_message():
    fake_db = MagicMock()
    middleware = LoggingMiddleware(db=fake_db)
    state = {
        "messages": [
            HumanMessage("What projects have you built?"),
            AIMessage("Here are a few..."),
        ]
    }
    result = middleware.after_agent(state, runtime=None)

    assert result is None
    fake_db.log_chatbot_interaction.assert_any_call(
        "What projects have you built?", "user_input", 0
    )
    fake_db.log_chatbot_interaction.assert_any_call("Here are a few...", "chatbot_response", 0)


def test_after_agent_handles_empty_messages():
    fake_db = MagicMock()
    middleware = LoggingMiddleware(db=fake_db)
    result = middleware.after_agent({"messages": []}, runtime=None)
    assert result is None
    fake_db.log_chatbot_interaction.assert_not_called()
