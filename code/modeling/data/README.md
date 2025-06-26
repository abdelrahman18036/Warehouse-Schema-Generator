# Data Directory

This directory contains training datasets and processed schemas for the BERT domain detection model.

## Structure

```
data/
├── raw/                    # Raw SQL files (copied from back-end)
├── processed/              # Processed JSON schemas
│   ├── e-commerce_schemas.json
│   ├── healthcare_schemas.json
│   ├── education_schemas.json
│   └── dataset_statistics.json
├── embeddings/             # Pre-computed embeddings
└── training/               # Training-specific datasets
```

## Dataset Statistics

The dataset contains schemas from multiple domains:

- **E-commerce**: Customer, product, order management systems
- **Healthcare**: Patient, doctor, appointment systems
- **Education**: Student, course, enrollment systems
- **Finance**: Account, transaction, investment systems
- **And more...**

## Processing Pipeline

1. **SQL Parsing**: Raw SQL files → JSON schemas
2. **Domain Labeling**: Automatic domain detection from filenames
3. **BERT Preparation**: Convert to text format for BERT training
4. **Similarity Indexing**: Create vector embeddings for similarity search

## Usage

```python
from src.data_processing import batch_process_sql_files

# Process SQL files
schemas = batch_process_sql_files("../back-end/media/schemas")

# Create training dataset
create_training_dataset(schemas, "./processed")
```
