"""
BERT-based Domain Detection for Database Schemas
Fine-tuned for high accuracy domain classification
"""

import torch
import torch.nn as nn
from transformers import (
    AutoTokenizer, AutoModel, AutoConfig,
    Trainer, TrainingArguments, DataCollatorWithPadding
)
from sklearn.metrics import accuracy_score, classification_report
import pandas as pd
import numpy as np
import json
from typing import Dict, List, Tuple, Optional
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BERTDomainClassifier(nn.Module):
    """Custom BERT model for domain classification"""
    
    def __init__(self, model_name: str = "bert-base-uncased", num_labels: int = 10, dropout: float = 0.3):
        super().__init__()
        self.config = AutoConfig.from_pretrained(model_name)
        self.bert = AutoModel.from_pretrained(model_name)
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(self.config.hidden_size, num_labels)
        
    def forward(self, input_ids, attention_mask=None, labels=None):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled_output = outputs.pooler_output
        pooled_output = self.dropout(pooled_output)
        logits = self.classifier(pooled_output)
        
        loss = None
        if labels is not None:
            loss_fct = nn.CrossEntropyLoss()
            loss = loss_fct(logits.view(-1, self.classifier.out_features), labels.view(-1))
            
        return {"loss": loss, "logits": logits}

class BERTDomainDetector:
    """Main class for BERT-based domain detection"""
    
    def __init__(self, model_path: Optional[str] = None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {self.device}")
        
        # Domain labels mapping
        self.domain_labels = {
            0: "E-commerce",
            1: "Healthcare", 
            2: "Education",
            3: "Finance",
            4: "Supply Chain",
            5: "Social Media",
            6: "Retail",
            7: "Real Estate",
            8: "Cybersecurity",
            9: "Telecommunications"
        }
        
        self.label_to_id = {v: k for k, v in self.domain_labels.items()}
        
        # Initialize tokenizer and model
        self.tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
        self.model = BERTDomainClassifier(num_labels=len(self.domain_labels))
        
        if model_path and Path(model_path).exists():
            self.load_model(model_path)
        else:
            logger.info("No pre-trained model found. Model will need training.")
            
        self.model.to(self.device)
        
    def prepare_schema_text(self, schema_json: Dict) -> str:
        """Convert schema JSON to text for BERT processing"""
        text_parts = []
        
        # Add schema type information
        if 'domain' in schema_json:
            text_parts.append(f"Domain: {schema_json['domain']}")
            
        # Process tables and columns
        for table_name, table_info in schema_json.items():
            if table_name == 'domain':
                continue
                
            text_parts.append(f"Table: {table_name}")
            
            if 'columns' in table_info:
                for column in table_info['columns']:
                    col_text = f"Column: {column['name']} Type: {column['type']}"
                    if column.get('constraints'):
                        col_text += f" Constraints: {', '.join(column['constraints'])}"
                    text_parts.append(col_text)
                    
        return " ".join(text_parts)
    
    def tokenize_data(self, texts: List[str], labels: Optional[List[int]] = None):
        """Tokenize text data for BERT"""
        encodings = self.tokenizer(
            texts,
            truncation=True,
            padding=True,
            max_length=512,
            return_tensors="pt"
        )
        
        if labels is not None:
            encodings["labels"] = torch.tensor(labels)
            
        return encodings
    
    def fine_tune(self, train_data: List[Dict], val_data: List[Dict], epochs: int = 3, batch_size: int = 16):
        """Fine-tune BERT model on schema data"""
        logger.info("Starting BERT fine-tuning...")
        
        # Prepare training data
        train_texts = [self.prepare_schema_text(schema) for schema in train_data]
        train_labels = [self.label_to_id[schema.get('domain', 'E-commerce')] for schema in train_data]
        
        val_texts = [self.prepare_schema_text(schema) for schema in val_data]
        val_labels = [self.label_to_id[schema.get('domain', 'E-commerce')] for schema in val_data]
        
        # Tokenize
        train_encodings = self.tokenize_data(train_texts, train_labels)
        val_encodings = self.tokenize_data(val_texts, val_labels)
        
        # Create datasets
        train_dataset = SchemaDataset(train_encodings)
        val_dataset = SchemaDataset(val_encodings)
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir="./models/bert_domain_detector",
            num_train_epochs=epochs,
            per_device_train_batch_size=batch_size,
            per_device_eval_batch_size=batch_size,
            warmup_steps=500,
            weight_decay=0.01,
            logging_dir="./logs",
            logging_steps=10,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
            metric_for_best_model="eval_accuracy",
            greater_is_better=True,
        )
        
        # Data collator
        data_collator = DataCollatorWithPadding(tokenizer=self.tokenizer)
        
        # Trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            data_collator=data_collator,
            compute_metrics=self.compute_metrics,
        )
        
        # Train
        trainer.train()
        
        # Save model
        self.save_model("./models/bert_domain_detector_finetuned")
        logger.info("Fine-tuning completed!")
        
    def compute_metrics(self, eval_pred):
        """Compute metrics for evaluation"""
        predictions, labels = eval_pred
        predictions = np.argmax(predictions, axis=1)
        
        accuracy = accuracy_score(labels, predictions)
        return {"accuracy": accuracy}
    
    def predict(self, schema_json: Dict) -> Dict:
        """Predict domain for a given schema"""
        self.model.eval()
        
        # Prepare text
        text = self.prepare_schema_text(schema_json)
        
        # Tokenize
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding=True,
            max_length=512,
            return_tensors="pt"
        )
        
        # Move to device
        encoding = {k: v.to(self.device) for k, v in encoding.items()}
        
        # Predict
        with torch.no_grad():
            outputs = self.model(**encoding)
            predictions = torch.nn.functional.softmax(outputs["logits"], dim=-1)
            
        # Get top prediction
        predicted_class_id = predictions.argmax().item()
        confidence = predictions.max().item()
        predicted_domain = self.domain_labels[predicted_class_id]
        
        # Get top 3 predictions
        top_3_indices = torch.topk(predictions, 3).indices[0].cpu().numpy()
        top_3_predictions = [
            {
                "domain": self.domain_labels[idx],
                "confidence": predictions[0][idx].item()
            }
            for idx in top_3_indices
        ]
        
        return {
            "domain": predicted_domain,
            "confidence": confidence,
            "top_predictions": top_3_predictions,
            "embedding": outputs["logits"].cpu().numpy().tolist()
        }
    
    def batch_predict(self, schemas: List[Dict]) -> List[Dict]:
        """Predict domains for multiple schemas"""
        results = []
        for schema in schemas:
            result = self.predict(schema)
            results.append(result)
        return results
    
    def save_model(self, path: str):
        """Save the fine-tuned model"""
        Path(path).mkdir(parents=True, exist_ok=True)
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'domain_labels': self.domain_labels,
        }, f"{path}/model.pt")
        self.tokenizer.save_pretrained(path)
        logger.info(f"Model saved to {path}")
    
    def load_model(self, path: str):
        """Load a pre-trained model"""
        checkpoint = torch.load(f"{path}/model.pt", map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.domain_labels = checkpoint['domain_labels']
        logger.info(f"Model loaded from {path}")

class SchemaDataset(torch.utils.data.Dataset):
    """Custom dataset for schema data"""
    
    def __init__(self, encodings):
        self.encodings = encodings
    
    def __getitem__(self, idx):
        return {key: val[idx] for key, val in self.encodings.items()}
    
    def __len__(self):
        return len(self.encodings['input_ids'])

# Utility functions
def create_training_data_from_sql_files(sql_files_dir: str) -> List[Dict]:
    """Create training data from SQL files directory"""
    from ..data_processing import parse_sql_to_json
    
    training_data = []
    sql_files = Path(sql_files_dir).glob("*.sql")
    
    for sql_file in sql_files:
        # Parse SQL to JSON
        schema_json = parse_sql_to_json(str(sql_file))
        
        # Extract domain from filename or content
        domain = extract_domain_from_filename(sql_file.name)
        schema_json['domain'] = domain
        
        training_data.append(schema_json)
    
    return training_data

def extract_domain_from_filename(filename: str) -> str:
    """Extract domain from filename"""
    domain_mapping = {
        'ecommerce': 'E-commerce',
        'healthcare': 'Healthcare',
        'education': 'Education',
        'finance': 'Finance',
        'store': 'Retail',
        'hotel': 'Real Estate',
        'restaurant': 'Retail'
    }
    
    filename_lower = filename.lower()
    for key, domain in domain_mapping.items():
        if key in filename_lower:
            return domain
    
    return 'E-commerce'  # Default domain 