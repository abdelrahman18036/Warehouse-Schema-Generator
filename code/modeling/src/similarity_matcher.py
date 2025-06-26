"""
Similarity Matching System for Database Schemas
Uses sentence transformers and FAISS for efficient similarity search
"""

import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from typing import Dict, List, Tuple, Optional
import json
import pickle
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimilarityMatcher:
    """Vector-based similarity matching for database schemas"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2", index_path: Optional[str] = None):
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        
        # Initialize FAISS index
        self.index = faiss.IndexFlatIP(self.dimension)  # Inner product for cosine similarity
        self.schema_metadata = []
        self.schema_texts = []
        
        if index_path and Path(index_path).exists():
            self.load_index(index_path)
        else:
            logger.info("No existing index found. Will create new index.")
    
    def prepare_schema_text(self, schema_json: Dict) -> str:
        """Convert schema JSON to text for embedding"""
        text_parts = []
        
        # Add domain information
        if 'domain' in schema_json:
            text_parts.append(f"Domain: {schema_json['domain']}")
        
        # Process each table
        for table_name, table_info in schema_json.items():
            if table_name == 'domain':
                continue
                
            text_parts.append(f"Table: {table_name}")
            
            if isinstance(table_info, dict) and 'columns' in table_info:
                # Add column information
                column_names = []
                column_types = []
                constraints = []
                
                for column in table_info['columns']:
                    column_names.append(column['name'])
                    column_types.append(column['type'])
                    if column.get('constraints'):
                        constraints.extend(column['constraints'])
                
                text_parts.append(f"Columns: {', '.join(column_names)}")
                text_parts.append(f"Types: {', '.join(set(column_types))}")
                
                if constraints:
                    text_parts.append(f"Constraints: {', '.join(set(constraints))}")
        
        return " ".join(text_parts)
    
    def add_schema_to_index(self, schema_json: Dict, metadata: Dict = None):
        """Add a schema to the similarity index"""
        # Prepare text representation
        schema_text = self.prepare_schema_text(schema_json)
        
        # Generate embedding
        embedding = self.model.encode([schema_text], normalize_embeddings=True)
        
        # Add to FAISS index
        self.index.add(embedding.astype('float32'))
        
        # Store metadata
        schema_metadata = {
            'schema': schema_json,
            'text': schema_text,
            'index': len(self.schema_metadata)
        }
        
        if metadata:
            schema_metadata.update(metadata)
            
        self.schema_metadata.append(schema_metadata)
        self.schema_texts.append(schema_text)
        
        logger.info(f"Added schema to index. Total schemas: {len(self.schema_metadata)}")
    
    def build_index_from_schemas(self, schemas: List[Dict]):
        """Build the similarity index from a list of schemas"""
        logger.info(f"Building index from {len(schemas)} schemas...")
        
        for i, schema in enumerate(schemas):
            self.add_schema_to_index(schema, {'source_index': i})
        
        logger.info("Index building completed!")
    
    def find_similar(self, query_schema: Dict, k: int = 5, min_similarity: float = 0.3) -> List[Dict]:
        """Find similar schemas to the query schema"""
        if self.index.ntotal == 0:
            logger.warning("Index is empty. No similar schemas found.")
            return []
        
        # Prepare query text and embedding
        query_text = self.prepare_schema_text(query_schema)
        query_embedding = self.model.encode([query_text], normalize_embeddings=True)
        
        # Search in FAISS index
        similarities, indices = self.index.search(query_embedding.astype('float32'), min(k, self.index.ntotal))
        
        # Prepare results
        results = []
        for sim, idx in zip(similarities[0], indices[0]):
            if sim >= min_similarity:
                result = {
                    'similarity': float(sim),
                    'schema': self.schema_metadata[idx]['schema'],
                    'metadata': {k: v for k, v in self.schema_metadata[idx].items() 
                               if k not in ['schema', 'text']},
                    'match_explanation': self._explain_similarity(query_text, self.schema_texts[idx])
                }
                results.append(result)
        
        return results
    
    def _explain_similarity(self, query_text: str, match_text: str) -> Dict:
        """Explain why two schemas are similar"""
        query_words = set(query_text.lower().split())
        match_words = set(match_text.lower().split())
        
        common_words = query_words.intersection(match_words)
        
        # Categorize common words
        table_words = [w for w in common_words if w.startswith('table:') or 
                      any(keyword in w for keyword in ['customer', 'product', 'order', 'user', 'account'])]
        
        column_words = [w for w in common_words if w.startswith('column:') or
                       any(keyword in w for keyword in ['id', 'name', 'email', 'date', 'amount'])]
        
        domain_words = [w for w in common_words if w.startswith('domain:')]
        
        return {
            'common_concepts': len(common_words),
            'table_similarities': table_words[:5],  # Top 5
            'column_similarities': column_words[:5],  # Top 5
            'domain_similarities': domain_words,
            'similarity_score': len(common_words) / max(len(query_words), len(match_words))
        }
    
    def get_domain_similar_schemas(self, domain: str, k: int = 10) -> List[Dict]:
        """Get schemas similar to a specific domain"""
        domain_schemas = []
        
        for metadata in self.schema_metadata:
            schema = metadata['schema']
            if schema.get('domain', '').lower() == domain.lower():
                domain_schemas.append({
                    'schema': schema,
                    'metadata': metadata
                })
        
        return domain_schemas[:k]
    
    def compute_schema_similarity_matrix(self) -> np.ndarray:
        """Compute similarity matrix for all schemas in the index"""
        if self.index.ntotal == 0:
            return np.array([])
        
        # Get all embeddings
        embeddings = []
        for text in self.schema_texts:
            embedding = self.model.encode([text], normalize_embeddings=True)
            embeddings.append(embedding[0])
        
        embeddings = np.array(embeddings)
        
        # Compute similarity matrix (cosine similarity)
        similarity_matrix = np.dot(embeddings, embeddings.T)
        
        return similarity_matrix
    
    def cluster_similar_schemas(self, n_clusters: int = 5) -> Dict:
        """Cluster schemas based on similarity"""
        from sklearn.cluster import KMeans
        
        if self.index.ntotal < n_clusters:
            logger.warning(f"Not enough schemas ({self.index.ntotal}) for {n_clusters} clusters")
            return {}
        
        # Get all embeddings
        embeddings = []
        for text in self.schema_texts:
            embedding = self.model.encode([text], normalize_embeddings=True)
            embeddings.append(embedding[0])
        
        embeddings = np.array(embeddings)
        
        # Perform clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        cluster_labels = kmeans.fit_predict(embeddings)
        
        # Group schemas by cluster
        clusters = {}
        for i, label in enumerate(cluster_labels):
            if label not in clusters:
                clusters[label] = []
            
            clusters[label].append({
                'schema': self.schema_metadata[i]['schema'],
                'metadata': self.schema_metadata[i],
                'index': i
            })
        
        return clusters
    
    def save_index(self, path: str):
        """Save the FAISS index and metadata"""
        Path(path).mkdir(parents=True, exist_ok=True)
        
        # Save FAISS index
        faiss.write_index(self.index, f"{path}/faiss_index.bin")
        
        # Save metadata
        with open(f"{path}/metadata.pkl", 'wb') as f:
            pickle.dump({
                'schema_metadata': self.schema_metadata,
                'schema_texts': self.schema_texts,
                'dimension': self.dimension
            }, f)
        
        logger.info(f"Index saved to {path}")
    
    def load_index(self, path: str):
        """Load the FAISS index and metadata"""
        # Load FAISS index
        self.index = faiss.read_index(f"{path}/faiss_index.bin")
        
        # Load metadata
        with open(f"{path}/metadata.pkl", 'rb') as f:
            data = pickle.load(f)
            self.schema_metadata = data['schema_metadata']
            self.schema_texts = data['schema_texts']
            self.dimension = data['dimension']
        
        logger.info(f"Index loaded from {path}. Total schemas: {len(self.schema_metadata)}")
    
    def get_statistics(self) -> Dict:
        """Get statistics about the similarity index"""
        if not self.schema_metadata:
            return {"total_schemas": 0}
        
        domains = {}
        table_counts = []
        
        for metadata in self.schema_metadata:
            schema = metadata['schema']
            
            # Count domains
            domain = schema.get('domain', 'Unknown')
            domains[domain] = domains.get(domain, 0) + 1
            
            # Count tables
            table_count = len([k for k in schema.keys() if k != 'domain'])
            table_counts.append(table_count)
        
        return {
            "total_schemas": len(self.schema_metadata),
            "domains": domains,
            "avg_tables_per_schema": np.mean(table_counts) if table_counts else 0,
            "index_dimension": self.dimension,
            "model_name": self.model.model_name if hasattr(self.model, 'model_name') else "unknown"
        }

# Utility functions
def load_schemas_from_directory(directory: str) -> List[Dict]:
    """Load all schemas from a directory"""
    from .data_processing import parse_sql_to_json
    
    schemas = []
    sql_files = Path(directory).glob("*.sql")
    
    for sql_file in sql_files:
        try:
            schema_json = parse_sql_to_json(str(sql_file))
            schemas.append(schema_json)
        except Exception as e:
            logger.error(f"Error processing {sql_file}: {e}")
    
    return schemas

def build_similarity_index_from_sql_directory(sql_dir: str, output_path: str):
    """Build and save similarity index from SQL files directory"""
    matcher = SimilarityMatcher()
    schemas = load_schemas_from_directory(sql_dir)
    
    matcher.build_index_from_schemas(schemas)
    matcher.save_index(output_path)
    
    logger.info(f"Similarity index built and saved to {output_path}")
    return matcher 