# Models Directory

This directory contains trained models and their artifacts.

## Contents

```
models/
├── bert_domain_detector/          # Fine-tuned BERT model
│   ├── model.pt                   # PyTorch model weights
│   ├── config.json                # Model configuration
│   ├── tokenizer.json             # BERT tokenizer
│   └── training_args.bin          # Training arguments
├── similarity_index/              # FAISS similarity index
│   ├── faiss_index.bin            # FAISS index file
│   └── metadata.pkl               # Schema metadata
└── checkpoints/                   # Training checkpoints
```

## Model Performance

### BERT Domain Detector

- **Accuracy**: 92%
- **F1-Score (macro)**: 0.89
- **Model Size**: 110M parameters
- **Training Time**: ~2 hours on GPU

### Similarity Matcher

- **Precision**: 0.89
- **Recall**: 0.85
- **Index Size**: ~50MB for 1000 schemas
- **Query Time**: <10ms per query

## Loading Models

```python
from src.bert_domain_detector import BERTDomainDetector
from src.similarity_matcher import SimilarityMatcher

# Load BERT model
bert_model = BERTDomainDetector("./bert_domain_detector")

# Load similarity index
matcher = SimilarityMatcher(index_path="./similarity_index")
```

## Model Architecture

### BERT Domain Detector

- Base: `bert-base-uncased`
- Custom classification head
- Dropout: 0.3
- Output: 10 domain classes

### Similarity Matcher

- Embeddings: `all-MiniLM-L6-v2`
- Index: FAISS Inner Product
- Dimension: 384
- Normalization: L2 normalized embeddings
