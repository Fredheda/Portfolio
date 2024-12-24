import json

class ToolOrchestrator:
    def __init__(self):
        pass
    
    def get_tool(self, tool_name: str):
        """
        Returns a tool based on the tool_name attribute.
        """
        with open(f"{tool_name}.json") as file:
            tool = json.load(file)
        return tool
    
    def get_tools(self, tool_list: list):
        """
        Returns a list of tools based on the tool_list attribute.
        """
        tools = [self.get_tool(tool_name) for tool_name in tool_list]
        return tools