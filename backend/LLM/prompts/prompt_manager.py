import json
from string import Template

class PromptManager:
    def __init__(self, config_path: str = "LLM/prompts/config.json"):
        """
        Initializes the PromptManager with the given configuration file.

        Args:
            config_path (str): Path to the configuration JSON file.
        """
        self.config_path: str = config_path
        self.config: dict = self.load_config()
        self.prompts: dict = self._load_all_prompts()
        self.base_prompt: str = self.format_base_prompt()

    def load_config(self) -> dict:
        """
        Loads the configuration from the specified JSON file.

        Returns:
            dict: The configuration dictionary.
        """
        try:
            with open(self.config_path, 'r') as file:
                return json.load(file)
        except FileNotFoundError:
            print(f"Configuration file {self.config_path} not found.")
            return {}

    def _load_all_prompts(self) -> dict:
        """
        Loads all prompts specified in the configuration file.

        Returns:
            dict: A dictionary with prompt names as keys and their content as values.
        """
        prompts = {}
        for prompt_name, file_path in self.config.items():
            prompts[prompt_name] = self._load_file_content(file_path)
        return prompts

    def _load_file_content(self, file_path: str) -> str:
        """
        Reads the content of a file.

        Args:
            file_path (str): The path to the file to be read.

        Returns:
            str: The content of the file.
        """
        try:
            with open(file_path, 'r') as file:
                return file.read()
        except FileNotFoundError:
            print(f"Template file {file_path} not found.")
            return ""

    def format_base_prompt(self) -> str:
        """
        Formats the prompt skeleton with the other prompts.

        Returns:
            str: The formatted base prompt.
        """
        prompt_skeleton = self.prompts.get("prompt_skeleton", "")
        if not prompt_skeleton:
            raise ValueError("Prompt skeleton not found in the configuration.")
        template = Template(prompt_skeleton)
        base_prompt = template.safe_substitute(**self.prompts)
        return base_prompt
    
    def create_messages(self, user_input: str) -> list:
        """
        Creates the messages list for the OpenAI API call.

        Args:
            user_input (str): The input provided by the user.

        Returns:
            list: The list of messages for the OpenAI API call.
        """
        messages = [
            {"role": "system", "content": self.base_prompt},
            {"role": "user", "content": user_input}
        ]
        return messages