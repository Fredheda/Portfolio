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

- **DocumentProcessor.py** - Converts documents to embeddings using Docling
- **IndexCreator.py** - Creates Azure search indices
- **populate_index.py** - Populates the search index with processed documents

## Important Note

The dependencies in this folder (especially `docling`) include large ML frameworks with CUDA support (~2-4GB). They are intentionally kept in their own Poetry project, separate from `/backend/pyproject.toml`, to keep the production container image small.
