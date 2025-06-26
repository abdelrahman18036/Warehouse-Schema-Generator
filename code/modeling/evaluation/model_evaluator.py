"""
Comprehensive Model Evaluation System
Evaluates the entire BERT-based schema domain detection and enhancement pipeline
"""

import json
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from pathlib import Path
import logging
import time
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelEvaluator:
    """Comprehensive evaluation system for the modeling pipeline"""
    
    def __init__(self, output_dir: str = "./evaluation_results"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def evaluate_bert_domain_detector(self, model, test_data: List[Dict]) -> Dict:
        """Evaluate BERT domain detection model"""
        logger.info("Evaluating BERT domain detector...")
        
        predictions = []
        true_labels = []
        prediction_times = []
        
        for schema in test_data:
            start_time = time.time()
            result = model.predict(schema)
            prediction_time = time.time() - start_time
            
            predictions.append(result['domain'])
            true_labels.append(schema.get('domain', 'Unknown'))
            prediction_times.append(prediction_time)
        
        # Calculate metrics
        accuracy = sum(1 for true, pred in zip(true_labels, predictions) if true == pred) / len(true_labels)
        
        # Generate classification report
        report = classification_report(
            true_labels, predictions, 
            output_dict=True, zero_division=0
        )
        
        # Create confusion matrix
        cm = confusion_matrix(true_labels, predictions)
        
        evaluation_result = {
            "model_type": "BERT Domain Detector",
            "accuracy": accuracy,
            "classification_report": report,
            "confusion_matrix": cm.tolist(),
            "avg_prediction_time": np.mean(prediction_times),
            "total_samples": len(test_data),
            "predictions": predictions,
            "true_labels": true_labels
        }
        
        # Save detailed results
        self._save_evaluation_results(evaluation_result, "bert_domain_detector")
        
        return evaluation_result
    
    def evaluate_similarity_matcher(self, matcher, test_queries: List[Dict], ground_truth: List[List[str]]) -> Dict:
        """Evaluate similarity matching system"""
        logger.info("Evaluating similarity matcher...")
        
        precision_scores = []
        recall_scores = []
        map_scores = []  # Mean Average Precision
        
        for query, relevant_schemas in zip(test_queries, ground_truth):
            # Get similar schemas
            similar_results = matcher.find_similar(query, k=10)
            retrieved_ids = [result['metadata'].get('source_index', -1) for result in similar_results]
            
            # Calculate precision and recall
            relevant_retrieved = len(set(retrieved_ids) & set(relevant_schemas))
            precision = relevant_retrieved / len(retrieved_ids) if retrieved_ids else 0
            recall = relevant_retrieved / len(relevant_schemas) if relevant_schemas else 0
            
            precision_scores.append(precision)
            recall_scores.append(recall)
            
            # Calculate Average Precision for this query
            ap = self._calculate_average_precision(retrieved_ids, relevant_schemas)
            map_scores.append(ap)
        
        evaluation_result = {
            "model_type": "Similarity Matcher",
            "mean_precision": np.mean(precision_scores),
            "mean_recall": np.mean(recall_scores),
            "mean_average_precision": np.mean(map_scores),
            "precision_scores": precision_scores,
            "recall_scores": recall_scores,
            "map_scores": map_scores,
            "total_queries": len(test_queries)
        }
        
        self._save_evaluation_results(evaluation_result, "similarity_matcher")
        
        return evaluation_result
    
    def evaluate_ai_enhancer(self, enhancer, test_schemas: List[Dict]) -> Dict:
        """Evaluate AI schema enhancement system"""
        logger.info("Evaluating AI enhancer...")
        
        enhancement_scores = []
        suggestion_counts = []
        quality_scores = []
        
        for schema in test_schemas:
            # Get enhancement results
            enhancement_result = enhancer.enhance(schema)
            
            # Calculate enhancement score
            enhancement_score = enhancement_result.get('enhancement_score', 0)
            enhancement_scores.append(enhancement_score)
            
            # Count suggestions
            suggestions = enhancement_result.get('enhancement_suggestions', [])
            suggestion_counts.append(len(suggestions))
            
            # Evaluate quality metrics
            quality_metrics = enhancement_result.get('quality_metrics', {})
            overall_quality = np.mean(list(quality_metrics.values()))
            quality_scores.append(overall_quality)
        
        evaluation_result = {
            "model_type": "AI Enhancer",
            "mean_enhancement_score": np.mean(enhancement_scores),
            "mean_suggestions_per_schema": np.mean(suggestion_counts),
            "mean_quality_score": np.mean(quality_scores),
            "enhancement_scores": enhancement_scores,
            "suggestion_counts": suggestion_counts,
            "quality_scores": quality_scores,
            "total_schemas": len(test_schemas)
        }
        
        self._save_evaluation_results(evaluation_result, "ai_enhancer")
        
        return evaluation_result
    
    def evaluate_complete_pipeline(self, bert_model, similarity_matcher, ai_enhancer, test_data: List[Dict]) -> Dict:
        """Evaluate the complete pipeline end-to-end"""
        logger.info("Evaluating complete pipeline...")
        
        pipeline_results = []
        total_time = 0
        
        for schema in test_data:
            start_time = time.time()
            
            # Step 1: Domain detection
            domain_result = bert_model.predict(schema)
            detected_domain = domain_result['domain']
            confidence = domain_result['confidence']
            
            # Step 2: Similarity matching
            similar_schemas = similarity_matcher.find_similar(schema, k=5)
            
            # Step 3: AI enhancement
            enhanced_result = ai_enhancer.enhance(schema, domain=detected_domain)
            
            end_time = time.time()
            processing_time = end_time - start_time
            total_time += processing_time
            
            pipeline_result = {
                "original_domain": schema.get('domain', 'Unknown'),
                "detected_domain": detected_domain,
                "domain_confidence": confidence,
                "similar_schemas_found": len(similar_schemas),
                "enhancement_score": enhanced_result.get('enhancement_score', 0),
                "suggestions_count": len(enhanced_result.get('enhancement_suggestions', [])),
                "processing_time": processing_time,
                "domain_correct": schema.get('domain', 'Unknown') == detected_domain
            }
            
            pipeline_results.append(pipeline_result)
        
        # Calculate overall metrics
        domain_accuracy = sum(1 for r in pipeline_results if r['domain_correct']) / len(pipeline_results)
        avg_confidence = np.mean([r['domain_confidence'] for r in pipeline_results])
        avg_similar_found = np.mean([r['similar_schemas_found'] for r in pipeline_results])
        avg_enhancement_score = np.mean([r['enhancement_score'] for r in pipeline_results])
        avg_processing_time = total_time / len(pipeline_results)
        
        evaluation_result = {
            "pipeline_type": "Complete BERT + Similarity + Enhancement",
            "domain_detection_accuracy": domain_accuracy,
            "average_confidence": avg_confidence,
            "average_similar_schemas_found": avg_similar_found,
            "average_enhancement_score": avg_enhancement_score,
            "average_processing_time": avg_processing_time,
            "total_processing_time": total_time,
            "throughput_schemas_per_second": len(pipeline_results) / total_time,
            "individual_results": pipeline_results,
            "total_schemas_processed": len(pipeline_results)
        }
        
        self._save_evaluation_results(evaluation_result, "complete_pipeline")
        
        return evaluation_result
    
    def _calculate_average_precision(self, retrieved: List[int], relevant: List[int]) -> float:
        """Calculate Average Precision for a single query"""
        if not retrieved or not relevant:
            return 0.0
        
        relevant_set = set(relevant)
        precision_sum = 0.0
        relevant_count = 0
        
        for i, item in enumerate(retrieved):
            if item in relevant_set:
                relevant_count += 1
                precision_at_i = relevant_count / (i + 1)
                precision_sum += precision_at_i
        
        return precision_sum / len(relevant) if relevant else 0.0
    
    def _save_evaluation_results(self, results: Dict, model_name: str):
        """Save evaluation results to files"""
        # Save JSON results
        json_file = self.output_dir / f"{model_name}_evaluation.json"
        with open(json_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        # Create visualization if applicable
        if model_name == "bert_domain_detector":
            self._create_domain_detection_plots(results)
        elif model_name == "similarity_matcher":
            self._create_similarity_plots(results)
        elif model_name == "ai_enhancer":
            self._create_enhancement_plots(results)
        elif model_name == "complete_pipeline":
            self._create_pipeline_plots(results)
        
        logger.info(f"Saved evaluation results for {model_name}")
    
    def _create_domain_detection_plots(self, results: Dict):
        """Create plots for domain detection evaluation"""
        try:
            # Confusion matrix heatmap
            plt.figure(figsize=(12, 8))
            cm = np.array(results['confusion_matrix'])
            
            # Get unique labels
            labels = sorted(set(results['true_labels'] + results['predictions']))
            
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                       xticklabels=labels, yticklabels=labels)
            plt.title('Domain Detection Confusion Matrix')
            plt.xlabel('Predicted Domain')
            plt.ylabel('True Domain')
            plt.xticks(rotation=45)
            plt.yticks(rotation=0)
            plt.tight_layout()
            plt.savefig(self.output_dir / 'domain_confusion_matrix.png', dpi=300, bbox_inches='tight')
            plt.close()
            
            # Accuracy by domain
            report = results['classification_report']
            domains = [k for k in report.keys() if k not in ['accuracy', 'macro avg', 'weighted avg']]
            f1_scores = [report[domain]['f1-score'] for domain in domains]
            
            plt.figure(figsize=(12, 6))
            plt.bar(domains, f1_scores)
            plt.title('F1-Score by Domain')
            plt.xlabel('Domain')
            plt.ylabel('F1-Score')
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.savefig(self.output_dir / 'domain_f1_scores.png', dpi=300, bbox_inches='tight')
            plt.close()
            
        except Exception as e:
            logger.error(f"Error creating domain detection plots: {e}")
    
    def _create_similarity_plots(self, results: Dict):
        """Create plots for similarity matching evaluation"""
        try:
            # Precision-Recall distribution
            plt.figure(figsize=(12, 5))
            
            plt.subplot(1, 2, 1)
            plt.hist(results['precision_scores'], bins=20, alpha=0.7, color='blue')
            plt.title('Precision Score Distribution')
            plt.xlabel('Precision')
            plt.ylabel('Frequency')
            
            plt.subplot(1, 2, 2)
            plt.hist(results['recall_scores'], bins=20, alpha=0.7, color='green')
            plt.title('Recall Score Distribution')
            plt.xlabel('Recall')
            plt.ylabel('Frequency')
            
            plt.tight_layout()
            plt.savefig(self.output_dir / 'similarity_precision_recall.png', dpi=300, bbox_inches='tight')
            plt.close()
            
        except Exception as e:
            logger.error(f"Error creating similarity plots: {e}")
    
    def _create_enhancement_plots(self, results: Dict):
        """Create plots for AI enhancement evaluation"""
        try:
            # Enhancement scores distribution
            plt.figure(figsize=(12, 5))
            
            plt.subplot(1, 2, 1)
            plt.hist(results['enhancement_scores'], bins=20, alpha=0.7, color='purple')
            plt.title('Enhancement Score Distribution')
            plt.xlabel('Enhancement Score')
            plt.ylabel('Frequency')
            
            plt.subplot(1, 2, 2)
            plt.hist(results['suggestion_counts'], bins=20, alpha=0.7, color='orange')
            plt.title('Suggestions Count Distribution')
            plt.xlabel('Number of Suggestions')
            plt.ylabel('Frequency')
            
            plt.tight_layout()
            plt.savefig(self.output_dir / 'enhancement_distributions.png', dpi=300, bbox_inches='tight')
            plt.close()
            
        except Exception as e:
            logger.error(f"Error creating enhancement plots: {e}")
    
    def _create_pipeline_plots(self, results: Dict):
        """Create plots for complete pipeline evaluation"""
        try:
            # Processing time vs enhancement score
            individual_results = results['individual_results']
            processing_times = [r['processing_time'] for r in individual_results]
            enhancement_scores = [r['enhancement_score'] for r in individual_results]
            
            plt.figure(figsize=(10, 6))
            plt.scatter(processing_times, enhancement_scores, alpha=0.6)
            plt.xlabel('Processing Time (seconds)')
            plt.ylabel('Enhancement Score')
            plt.title('Processing Time vs Enhancement Score')
            plt.tight_layout()
            plt.savefig(self.output_dir / 'pipeline_performance.png', dpi=300, bbox_inches='tight')
            plt.close()
            
        except Exception as e:
            logger.error(f"Error creating pipeline plots: {e}")
    
    def generate_comprehensive_report(self, all_results: Dict) -> Dict:
        """Generate a comprehensive evaluation report"""
        report = {
            "evaluation_summary": {
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "total_models_evaluated": len(all_results),
                "overall_system_performance": "Excellent" if all(
                    result.get('accuracy', result.get('mean_precision', 0)) > 0.85 
                    for result in all_results.values()
                ) else "Good"
            },
            "individual_model_performance": all_results,
            "recommendations": self._generate_recommendations(all_results),
            "next_steps": [
                "Consider fine-tuning on domain-specific data",
                "Implement online learning for continuous improvement", 
                "Add more sophisticated similarity metrics",
                "Enhance tokenization for better realism"
            ]
        }
        
        # Save comprehensive report
        with open(self.output_dir / "comprehensive_evaluation_report.json", 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        return report
    
    def _generate_recommendations(self, results: Dict) -> List[str]:
        """Generate recommendations based on evaluation results"""
        recommendations = []
        
        # Check domain detection performance
        if 'bert_domain_detector' in results:
            accuracy = results['bert_domain_detector'].get('accuracy', 0)
            if accuracy < 0.9:
                recommendations.append("Consider additional training data for domain detection")
            if accuracy > 0.95:
                recommendations.append("Domain detection performance is excellent")
        
        # Check similarity matching
        if 'similarity_matcher' in results:
            precision = results['similarity_matcher'].get('mean_precision', 0)
            if precision < 0.8:
                recommendations.append("Improve similarity matching algorithm or embeddings")
        
        # Check enhancement quality
        if 'ai_enhancer' in results:
            quality = results['ai_enhancer'].get('mean_quality_score', 0)
            if quality < 0.85:
                recommendations.append("Enhance AI enhancement rules and patterns")
        
        # Check pipeline performance
        if 'complete_pipeline' in results:
            throughput = results['complete_pipeline'].get('throughput_schemas_per_second', 0)
            if throughput < 1.0:
                recommendations.append("Optimize pipeline for better throughput")
        
        return recommendations

# Utility functions
def run_complete_evaluation(bert_model, similarity_matcher, ai_enhancer, test_data: List[Dict]):
    """Run complete evaluation of all components"""
    evaluator = ModelEvaluator()
    
    # Evaluate individual components
    bert_results = evaluator.evaluate_bert_domain_detector(bert_model, test_data)
    
    # For similarity matcher, we need ground truth - simulate it
    test_queries = test_data[:50]  # Use subset for similarity testing
    ground_truth = [[i, i+1, i+2] for i in range(len(test_queries))]  # Mock ground truth
    
    similarity_results = evaluator.evaluate_similarity_matcher(
        similarity_matcher, test_queries, ground_truth
    )
    
    enhancement_results = evaluator.evaluate_ai_enhancer(ai_enhancer, test_data)
    
    # Evaluate complete pipeline
    pipeline_results = evaluator.evaluate_complete_pipeline(
        bert_model, similarity_matcher, ai_enhancer, test_data
    )
    
    # Generate comprehensive report
    all_results = {
        'bert_domain_detector': bert_results,
        'similarity_matcher': similarity_results,
        'ai_enhancer': enhancement_results,
        'complete_pipeline': pipeline_results
    }
    
    comprehensive_report = evaluator.generate_comprehensive_report(all_results)
    
    logger.info("Complete evaluation finished!")
    return comprehensive_report 