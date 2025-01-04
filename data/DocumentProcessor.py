from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from docling.document_converter import DocumentConverter
import re
import os
import tiktoken

class DocumentProcessor:
    def __init__(self):
        self.converter = DocumentConverter()

    def open_document(self, path):
        with open(path, "r", encoding="utf-8") as file:
            content = file.read()
        return content
    
    def split_markdown_document_by_headers(self, filename, content):

        headers_to_split_on = [
            ("#", "Header 1"),
            ("##", "Header 2"),
            ("###", "Header 3"),
            ("####", "Header 4")
            ]
        
        splitter = MarkdownHeaderTextSplitter(headers_to_split_on)
        splits = splitter.split_text(content)

        processed_splits = [
            {
                "header": self.process_headers(filename ,str(split.metadata)),
                "content": self.remove_whitespace(split.page_content)
            }
            for split in splits
        ]

        return processed_splits
    
    def split_text_by_recursively(self, filename, content):

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=5000,
            chunk_overlap=500,
            length_function=len,
            is_separator_regex=False,
        )
        splits = text_splitter.split_text(content)

        processed_splits = [
            {
                "header": self.process_headers(filename ,f"Part_{i}"),
                "content": self.remove_whitespace(splits[i])
            }
            for i in range(len(splits))
        ]

        return processed_splits
        
    
    def process_headers(self, filename, header):
        header = f"{filename}_{header}"
        header = header.replace(" ", "_")
        header = re.sub(r'[^a-zA-Z0-9_\-=]', '', header)
        return header
    
    def remove_whitespace(self, text):
        text = re.sub(r'\s{5,}', ' ', text)
        return text.strip()
    
    def process_document(self, path):
        if path.endswith(".txt"):
            content = self.open_document(path)
        elif path.endswith(".docx") or path.endswith(".pdf"):
            content = self.extract_text_from_document(path)
            self.save_text_to_file(path, content)
        else:
            raise ValueError(f"Unsupported file type for document: {path}")
        filename = path.split("/")[-1].split(".")[0]
        splits = self.split_markdown_document_by_headers(filename, content)
        if len(splits) == 1 or any(self.count_tokens(split['content']) > 7500 for split in splits):
            splits = self.split_text_by_recursively(filename, content)
        return splits
    
    def process_documents(self, dir):
        documents = []
        paths = self.get_paths(dir)

        for path in paths:
            try:
                document = self.process_document(path)
                documents.extend(document)
            except Exception as e:
                print(f"Error processing document: {path}. Error: {e}")
        return documents
    
    def get_paths(self, dir):
        paths = []
        for root, dirs, files in os.walk(dir):
            for file in files:
                paths.append(os.path.join(root, file))
        return paths
    
    def extract_text_from_document(self, path):
        processed_file = self.converter.convert(path)
        markdown_content = processed_file.document.export_to_markdown()

        return markdown_content
    
    def save_text_to_file(self, filename, content):
        txt_filename = filename.replace(".pdf", ".txt").replace(".docx", ".txt")
        with open(txt_filename, "w") as file:
            file.write(content)
    
    def count_tokens(self,text):
        # Initialize the tokenizer
        tokenizer = tiktoken.get_encoding("gpt2")
        
        # Encode the text to get the tokens
        tokens = tokenizer.encode(text)
        
        # Return the number of tokens
        return len(tokens)
    