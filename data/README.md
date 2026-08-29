# Data Processing Scripts

This directory contains scripts for processing documents and populating the Azure search index with embeddings.

## Setup

These scripts require additional dependencies (including heavy ML libraries) that are **NOT needed for the backend API runtime**.

```bash
# Install data processing dependencies
cd data
poetry install
```

## Scripts

- **DocumentProcessor.py** - Converts documents to embeddings using MarkItDown
- **IndexCreator.py** - Creates Azure search indices
- **populate_index.py** - Populates the search index with processed documents

## Important Note

These dependencies are intentionally kept in their own Poetry project, separate from `/backend/pyproject.toml`, so they never end up in the production container image.
