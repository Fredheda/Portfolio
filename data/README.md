# Data Processing Scripts

This directory contains scripts for processing documents and populating the Azure search index with embeddings.

## Setup

These scripts require additional dependencies (including heavy ML libraries) that are **NOT needed for the backend API runtime**.

```bash
# Install data processing dependencies
cd data
pip install -r requirements.txt
```

## Scripts

- **DocumentProcessor.py** - Converts documents to embeddings using Docling
- **IndexCreator.py** - Creates Azure search indices
- **populate_index.py** - Populates the search index with processed documents

## Important Note

The dependencies in this folder (especially `docling`) include large ML frameworks with CUDA support (~2-4GB). They are intentionally separated from `/backend/requirements.txt` to keep the production deployment size manageable on Heroku.
