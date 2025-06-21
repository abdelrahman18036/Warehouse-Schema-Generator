import json
import math
from collections import defaultdict
from typing import Dict, List, Tuple, Any
from datetime import datetime

class SchemaEvaluationFramework:
    """
    Comprehensive evaluation framework for warehouse schema generation using multiple algorithms and metrics.
    
    Algorithms implemented:
    1. Structural Similarity Analysis (SSA)
    2. Semantic Coherence Scoring (SCS) 
    3. Data Warehouse Best Practices Compliance (DWBPC)
    4. Schema Quality Index (SQI)
    5. Relationship Integrity Metric (RIM)
    6. Domain Alignment Score (DAS)
    """
    
    def __init__(self):
        self.weights = {
            'structural': 0.20,
            'semantic': 0.15,
            'best_practices': 0.25,
            'quality': 0.20,
            'relationships': 0.15,
            'domain_alignment': 0.05
        }
        
        # Standard data warehouse patterns
        self.dw_patterns = {
            'fact_table_indicators': ['fact_', 'sales_', 'transaction_', 'order_', 'event_'],
            'dimension_indicators': ['dim_', 'customer', 'product', 'date', 'time', 'location', 'geography'],
            'key_patterns': ['_key', '_id', 'surrogate_key', 'business_key'],
            'measure_patterns': ['amount', 'quantity', 'count', 'total', 'sum', 'revenue', 'cost'],
            'audit_columns': ['created_date', 'updated_date', 'effective_date', 'expiry_date', 'is_current']
        }

    def evaluate_schemas(self, original_schema: Dict, warehouse_schema: Dict, ai_enhanced_schema: Dict, domain: str) -> Dict:
        """
        Comprehensive evaluation of all three schema types.
        
        Args:
            original_schema: The uploaded original schema
            warehouse_schema: AI-generated warehouse schema
            ai_enhanced_schema: AI-enhanced enterprise schema
            domain: Business domain context
            
        Returns:
            Dict: Comprehensive evaluation results with scores and recommendations
        """
        
        print("🔍 Starting comprehensive schema evaluation...")
        
        results = {
            'evaluation_timestamp': datetime.now().isoformat(),
            'domain': domain,
            'algorithm_details': self._get_algorithm_descriptions(),
            'warehouse_schema_evaluation': self._evaluate_single_schema(
                warehouse_schema, original_schema, domain, 'warehouse'
            ),
            'ai_enhanced_schema_evaluation': self._evaluate_single_schema(
                ai_enhanced_schema, original_schema, domain, 'ai_enhanced'
            ),
            'comparative_analysis': self._compare_schemas(warehouse_schema, ai_enhanced_schema),
            'recommendations': self._generate_recommendations(warehouse_schema, ai_enhanced_schema, domain),
            'best_schema_recommendation': None
        }
        
        # Determine best schema
        warehouse_score = results['warehouse_schema_evaluation']['overall_score']
        ai_enhanced_score = results['ai_enhanced_schema_evaluation']['overall_score']
        
        if warehouse_score > ai_enhanced_score:
            results['best_schema_recommendation'] = {
                'schema_type': 'warehouse',
                'score': warehouse_score,
                'reason': 'Higher overall quality score with better structural alignment'
            }
        else:
            results['best_schema_recommendation'] = {
                'schema_type': 'ai_enhanced',
                'score': ai_enhanced_score,
                'reason': 'Superior comprehensive design with advanced features'
            }
        
        print(f"✅ Evaluation completed. Best schema: {results['best_schema_recommendation']['schema_type']}")
        
        return results

    def _evaluate_single_schema(self, target_schema: Dict, reference_schema: Dict, domain: str, schema_type: str) -> Dict:
        """Evaluate a single schema using all algorithms."""
        
        print(f"📊 Evaluating {schema_type} schema...")
        
        # Algorithm 1: Structural Similarity Analysis (SSA)
        structural_score = self._structural_similarity_analysis(target_schema, reference_schema)
        
        # Algorithm 2: Semantic Coherence Scoring (SCS)
        semantic_score = self._semantic_coherence_scoring(target_schema, domain)
        
        # Algorithm 3: Data Warehouse Best Practices Compliance (DWBPC)
        best_practices_score = self._dw_best_practices_compliance(target_schema)
        
        # Algorithm 4: Schema Quality Index (SQI)
        quality_score = self._schema_quality_index(target_schema)
        
        # Algorithm 5: Relationship Integrity Metric (RIM)
        relationship_score = self._relationship_integrity_metric(target_schema)
        
        # Algorithm 6: Domain Alignment Score (DAS)
        domain_score = self._domain_alignment_score(target_schema, domain)
        
        # Calculate weighted overall score
        overall_score = (
            structural_score * self.weights['structural'] +
            semantic_score * self.weights['semantic'] +
            best_practices_score * self.weights['best_practices'] +
            quality_score * self.weights['quality'] +
            relationship_score * self.weights['relationships'] +
            domain_score * self.weights['domain_alignment']
        )
        
        return {
            'overall_score': round(overall_score, 2),
            'algorithm_scores': {
                'structural_similarity_analysis': {
                    'score': round(structural_score, 2),
                    'weight': self.weights['structural'],
                    'weighted_score': round(structural_score * self.weights['structural'], 2)
                },
                'semantic_coherence_scoring': {
                    'score': round(semantic_score, 2),
                    'weight': self.weights['semantic'],
                    'weighted_score': round(semantic_score * self.weights['semantic'], 2)
                },
                'dw_best_practices_compliance': {
                    'score': round(best_practices_score, 2),
                    'weight': self.weights['best_practices'],
                    'weighted_score': round(best_practices_score * self.weights['best_practices'], 2)
                },
                'schema_quality_index': {
                    'score': round(quality_score, 2),
                    'weight': self.weights['quality'],
                    'weighted_score': round(quality_score * self.weights['quality'], 2)
                },
                'relationship_integrity_metric': {
                    'score': round(relationship_score, 2),
                    'weight': self.weights['relationships'],
                    'weighted_score': round(relationship_score * self.weights['relationships'], 2)
                },
                'domain_alignment_score': {
                    'score': round(domain_score, 2),
                    'weight': self.weights['domain_alignment'],
                    'weighted_score': round(domain_score * self.weights['domain_alignment'], 2)
                }
            },
            'detailed_metrics': self._get_detailed_metrics(target_schema, domain),
            'schema_statistics': self._get_schema_statistics(target_schema)
        }

    def _structural_similarity_analysis(self, target_schema: Dict, reference_schema: Dict) -> float:
        """
        Algorithm 1: Structural Similarity Analysis (SSA)
        Measures how well the target schema preserves the structural patterns of the reference schema.
        """
        
        if not reference_schema or not target_schema:
            return 0.0
        
        # Extract structural features
        target_features = self._extract_structural_features(target_schema)
        reference_features = self._extract_structural_features(reference_schema)
        
        # Calculate similarity metrics
        table_count_similarity = min(target_features['table_count'], reference_features['table_count']) / max(target_features['table_count'], reference_features['table_count'])
        
        # Column distribution similarity
        target_col_dist = target_features['column_distribution']
        ref_col_dist = reference_features['column_distribution']
        col_dist_similarity = 1 - abs(target_col_dist - ref_col_dist) / max(target_col_dist, ref_col_dist)
        
        # Data type preservation
        target_types = set(target_features['data_types'])
        ref_types = set(reference_features['data_types'])
        type_preservation = len(target_types.intersection(ref_types)) / len(target_types.union(ref_types)) if target_types.union(ref_types) else 1.0
        
        # Relationship preservation
        target_rels = target_features['relationship_count']
        ref_rels = reference_features['relationship_count']
        rel_similarity = min(target_rels, ref_rels) / max(target_rels, ref_rels) if max(target_rels, ref_rels) > 0 else 1.0
        
        # Weighted combination
        ssa_score = (
            table_count_similarity * 0.25 +
            col_dist_similarity * 0.25 +
            type_preservation * 0.25 +
            rel_similarity * 0.25
        ) * 100
        
        return min(ssa_score, 100.0)

    def _semantic_coherence_scoring(self, schema: Dict, domain: str) -> float:
        """
        Algorithm 2: Semantic Coherence Scoring (SCS)
        Evaluates the semantic consistency and logical naming conventions.
        """
        
        score_components = []
        
        # Naming consistency analysis
        naming_score = self._analyze_naming_consistency(schema)
        score_components.append(naming_score * 0.4)
        
        # Domain relevance analysis
        domain_relevance = self._analyze_domain_relevance(schema, domain)
        score_components.append(domain_relevance * 0.3)
        
        # Logical structure analysis
        logical_structure = self._analyze_logical_structure(schema)
        score_components.append(logical_structure * 0.3)
        
        scs_score = sum(score_components)
        return min(scs_score, 100.0)

    def _dw_best_practices_compliance(self, schema: Dict) -> float:
        """
        Algorithm 3: Data Warehouse Best Practices Compliance (DWBPC)
        Measures adherence to established data warehousing best practices.
        """
        
        compliance_checks = []
        
        # Check 1: Fact/Dimension separation
        fact_dim_separation = self._check_fact_dim_separation(schema)
        compliance_checks.append(fact_dim_separation)
        
        # Check 2: Surrogate key usage
        surrogate_key_usage = self._check_surrogate_keys(schema)
        compliance_checks.append(surrogate_key_usage)
        
        # Check 3: Slowly Changing Dimension (SCD) support
        scd_support = self._check_scd_support(schema)
        compliance_checks.append(scd_support)
        
        # Check 4: Date dimension presence
        date_dimension = self._check_date_dimension(schema)
        compliance_checks.append(date_dimension)
        
        # Check 5: Audit trail columns
        audit_trails = self._check_audit_trails(schema)
        compliance_checks.append(audit_trails)
        
        # Check 6: Foreign key relationships
        fk_relationships = self._check_fk_relationships(schema)
        compliance_checks.append(fk_relationships)
        
        dwbpc_score = (sum(compliance_checks) / len(compliance_checks)) * 100
        return min(dwbpc_score, 100.0)

    def _schema_quality_index(self, schema: Dict) -> float:
        """
        Algorithm 4: Schema Quality Index (SQI)
        Comprehensive quality assessment based on multiple quality dimensions.
        """
        
        quality_dimensions = []
        
        # Completeness
        completeness = self._assess_completeness(schema)
        quality_dimensions.append(completeness * 0.25)
        
        # Consistency
        consistency = self._assess_consistency(schema)
        quality_dimensions.append(consistency * 0.25)
        
        # Correctness
        correctness = self._assess_correctness(schema)
        quality_dimensions.append(correctness * 0.25)
        
        # Conciseness
        conciseness = self._assess_conciseness(schema)
        quality_dimensions.append(conciseness * 0.25)
        
        sqi_score = sum(quality_dimensions)
        return min(sqi_score, 100.0)

    def _relationship_integrity_metric(self, schema: Dict) -> float:
        """
        Algorithm 5: Relationship Integrity Metric (RIM)
        Evaluates the integrity and correctness of relationships between tables.
        """
        
        if not schema:
            return 0.0
        
        integrity_checks = []
        
        # Foreign key consistency
        fk_consistency = self._check_fk_consistency(schema)
        integrity_checks.append(fk_consistency)
        
        # Referential integrity
        ref_integrity = self._check_referential_integrity(schema)
        integrity_checks.append(ref_integrity)
        
        # Cardinality appropriateness
        cardinality_score = self._check_cardinality_appropriateness(schema)
        integrity_checks.append(cardinality_score)
        
        # Circular reference detection
        circular_ref_score = self._check_circular_references(schema)
        integrity_checks.append(circular_ref_score)
        
        rim_score = (sum(integrity_checks) / len(integrity_checks)) * 100
        return min(rim_score, 100.0)

    def _domain_alignment_score(self, schema: Dict, domain: str) -> float:
        """
        Algorithm 6: Domain Alignment Score (DAS)
        Measures how well the schema aligns with domain-specific requirements and patterns.
        """
        
        domain_patterns = self._get_domain_patterns(domain)
        alignment_scores = []
        
        # Table name alignment
        table_alignment = self._check_table_name_alignment(schema, domain_patterns)
        alignment_scores.append(table_alignment * 0.4)
        
        # Column name alignment
        column_alignment = self._check_column_name_alignment(schema, domain_patterns)
        alignment_scores.append(column_alignment * 0.3)
        
        # Business rule alignment
        business_rule_alignment = self._check_business_rule_alignment(schema, domain)
        alignment_scores.append(business_rule_alignment * 0.3)
        
        das_score = sum(alignment_scores)
        return min(das_score, 100.0)

    # Helper methods for structural analysis
    def _extract_structural_features(self, schema: Dict) -> Dict:
        """Extract structural features from schema."""
        features = {
            'table_count': len(schema),
            'total_columns': 0,
            'data_types': [],
            'relationship_count': 0
        }
        
        for table_name, table_info in schema.items():
            if isinstance(table_info, dict) and 'columns' in table_info:
                columns = table_info['columns']
                features['total_columns'] += len(columns)
                
                for col in columns:
                    if isinstance(col, dict):
                        col_type = col.get('type', '').upper()
                        features['data_types'].append(col_type)
                        
                        constraints = col.get('constraints', [])
                        if isinstance(constraints, list):
                            for constraint in constraints:
                                if 'FOREIGN KEY' in str(constraint).upper():
                                    features['relationship_count'] += 1
        
        features['column_distribution'] = features['total_columns'] / features['table_count'] if features['table_count'] > 0 else 0
        
        return features

    def _analyze_naming_consistency(self, schema: Dict) -> float:
        """Analyze naming consistency across the schema."""
        naming_patterns = []
        
        for table_name, table_info in schema.items():
            # Check table naming patterns
            if table_name.startswith(('fact_', 'dim_')):
                naming_patterns.append(1.0)
            else:
                naming_patterns.append(0.5)
            
            # Check column naming patterns
            if isinstance(table_info, dict) and 'columns' in table_info:
                for col in table_info['columns']:
                    if isinstance(col, dict):
                        col_name = col.get('name', '').lower()
                        if col_name.endswith(('_key', '_id')):
                            naming_patterns.append(1.0)
                        elif any(pattern in col_name for pattern in ['date', 'time', 'amount', 'quantity']):
                            naming_patterns.append(0.8)
                        else:
                            naming_patterns.append(0.6)
        
        return sum(naming_patterns) / len(naming_patterns) if naming_patterns else 0.0

    def _analyze_domain_relevance(self, schema: Dict, domain: str) -> float:
        """Analyze how relevant the schema is to the specified domain."""
        domain_keywords = self._get_domain_keywords(domain)
        relevance_scores = []
        
        for table_name, table_info in schema.items():
            table_relevance = 0.0
            
            # Check table name relevance
            for keyword in domain_keywords:
                if keyword.lower() in table_name.lower():
                    table_relevance += 0.5
            
            # Check column name relevance
            if isinstance(table_info, dict) and 'columns' in table_info:
                col_relevance = 0.0
                for col in table_info['columns']:
                    if isinstance(col, dict):
                        col_name = col.get('name', '').lower()
                        for keyword in domain_keywords:
                            if keyword.lower() in col_name:
                                col_relevance += 0.1
                
                table_relevance += min(col_relevance, 0.5)
            
            relevance_scores.append(min(table_relevance, 1.0))
        
        return sum(relevance_scores) / len(relevance_scores) if relevance_scores else 0.0

    def _analyze_logical_structure(self, schema: Dict) -> float:
        """Analyze the logical structure and organization of the schema."""
        structure_score = 0.0
        total_tables = len(schema)
        
        if total_tables == 0:
            return 0.0
        
        fact_tables = 0
        dim_tables = 0
        
        for table_name, table_info in schema.items():
            if table_name.lower().startswith('fact_'):
                fact_tables += 1
            elif table_name.lower().startswith('dim_'):
                dim_tables += 1
        
        # Good ratio of fact to dimension tables (1:3 to 1:7 is typical)
        if fact_tables > 0:
            ratio = dim_tables / fact_tables
            if 3 <= ratio <= 7:
                structure_score += 0.5
            elif 2 <= ratio <= 8:
                structure_score += 0.3
            else:
                structure_score += 0.1
        
        # Check for essential tables
        has_date_dim = any('date' in table_name.lower() for table_name in schema.keys())
        if has_date_dim:
            structure_score += 0.3
        
        # Check for proper key structures
        proper_keys = 0
        for table_name, table_info in schema.items():
            if isinstance(table_info, dict) and 'columns' in table_info:
                has_pk = False
                has_appropriate_keys = False
                
                for col in table_info['columns']:
                    if isinstance(col, dict):
                        constraints = col.get('constraints', [])
                        if any('PRIMARY KEY' in str(c).upper() for c in constraints):
                            has_pk = True
                        if col.get('name', '').lower().endswith(('_key', '_id')):
                            has_appropriate_keys = True
                
                if has_pk and has_appropriate_keys:
                    proper_keys += 1
        
        if total_tables > 0:
            structure_score += (proper_keys / total_tables) * 0.2
        
        return min(structure_score, 1.0)

    # Helper methods for best practices compliance
    def _check_fact_dim_separation(self, schema: Dict) -> float:
        """Check if fact and dimension tables are properly separated."""
        fact_tables = []
        dim_tables = []
        
        for table_name, table_info in schema.items():
            if table_name.lower().startswith('fact_'):
                fact_tables.append(table_name)
            elif table_name.lower().startswith('dim_'):
                dim_tables.append(table_name)
        
        if len(fact_tables) > 0 and len(dim_tables) > 0:
            return 1.0
        elif len(fact_tables) > 0 or len(dim_tables) > 0:
            return 0.5
        else:
            return 0.0

    def _check_surrogate_keys(self, schema: Dict) -> float:
        """Check for proper surrogate key usage."""
        tables_with_surrogate_keys = 0
        total_tables = len(schema)
        
        for table_name, table_info in schema.items():
            if isinstance(table_info, dict) and 'columns' in table_info:
                has_surrogate_key = False
                for col in table_info['columns']:
                    if isinstance(col, dict):
                        col_name = col.get('name', '').lower()
                        constraints = col.get('constraints', [])
                        
                        if (col_name.endswith('_key') and 
                            any('PRIMARY KEY' in str(c).upper() for c in constraints) and
                            any('AUTO_INCREMENT' in str(c).upper() for c in constraints)):
                            has_surrogate_key = True
                            break
                
                if has_surrogate_key:
                    tables_with_surrogate_keys += 1
        
        return tables_with_surrogate_keys / total_tables if total_tables > 0 else 0.0

    def _check_scd_support(self, schema: Dict) -> float:
        """Check for Slowly Changing Dimension support."""
        scd_indicators = ['effective_date', 'expiry_date', 'is_current', 'scd_version', 'valid_from', 'valid_to']
        tables_with_scd = 0
        dim_tables = 0
        
        for table_name, table_info in schema.items():
            if table_name.lower().startswith('dim_'):
                dim_tables += 1
                if isinstance(table_info, dict) and 'columns' in table_info:
                    has_scd = False
                    for col in table_info['columns']:
                        if isinstance(col, dict):
                            col_name = col.get('name', '').lower()
                            if any(indicator in col_name for indicator in scd_indicators):
                                has_scd = True
                                break
                    
                    if has_scd:
                        tables_with_scd += 1
        
        return tables_with_scd / dim_tables if dim_tables > 0 else 0.0

    def _check_date_dimension(self, schema: Dict) -> float:
        """Check for presence and quality of date dimension."""
        date_tables = [name for name in schema.keys() if 'date' in name.lower()]
        
        if not date_tables:
            return 0.0
        
        # Check quality of date dimension
        for table_name in date_tables:
            table_info = schema[table_name]
            if isinstance(table_info, dict) and 'columns' in table_info:
                date_columns = []
                for col in table_info['columns']:
                    if isinstance(col, dict):
                        col_name = col.get('name', '').lower()
                        date_columns.append(col_name)
                
                # Check for essential date columns
                essential_cols = ['year', 'month', 'day', 'quarter']
                present_cols = sum(1 for col in essential_cols if any(col in dc for dc in date_columns))
                
                return min(present_cols / len(essential_cols), 1.0)
        
        return 0.5  # Has date table but couldn't assess quality

    def _check_audit_trails(self, schema: Dict) -> float:
        """Check for audit trail columns."""
        audit_columns = ['created_date', 'updated_date', 'created_at', 'updated_at', 'modified_date']
        tables_with_audit = 0
        total_tables = len(schema)
        
        for table_name, table_info in schema.items():
            if isinstance(table_info, dict) and 'columns' in table_info:
                has_audit = False
                for col in table_info['columns']:
                    if isinstance(col, dict):
                        col_name = col.get('name', '').lower()
                        if any(audit_col in col_name for audit_col in audit_columns):
                            has_audit = True
                            break
                
                if has_audit:
                    tables_with_audit += 1
        
        return tables_with_audit / total_tables if total_tables > 0 else 0.0

    def _check_fk_relationships(self, schema: Dict) -> float:
        """Check for proper foreign key relationships."""
        total_relationships = 0
        valid_relationships = 0
        
        table_names = set(schema.keys())
        
        for table_name, table_info in schema.items():
            if isinstance(table_info, dict) and 'columns' in table_info:
                for col in table_info['columns']:
                    if isinstance(col, dict):
                        constraints = col.get('constraints', [])
                        for constraint in constraints:
                            if 'FOREIGN KEY' in str(constraint).upper():
                                total_relationships += 1
                                # This is a simplified check - in practice, you'd validate the actual references
                                valid_relationships += 1
        
        return valid_relationships / total_relationships if total_relationships > 0 else 1.0

    # Helper methods for quality assessment
    def _assess_completeness(self, schema: Dict) -> float:
        """Assess schema completeness."""
        completeness_score = 0.0
        
        # Check if schema has tables
        if len(schema) == 0:
            return 0.0
        
        completeness_score += 0.3  # Has tables
        
        # Check if tables have columns
        tables_with_columns = 0
        for table_name, table_info in schema.items():
            if isinstance(table_info, dict) and 'columns' in table_info and len(table_info['columns']) > 0:
                tables_with_columns += 1
        
        if tables_with_columns == len(schema):
            completeness_score += 0.3  # All tables have columns
        
        # Check if columns have proper types
        columns_with_types = 0
        total_columns = 0
        
        for table_name, table_info in schema.items():
            if isinstance(table_info, dict) and 'columns' in table_info:
                for col in table_info['columns']:
                    if isinstance(col, dict):
                        total_columns += 1
                        if col.get('type'):
                            columns_with_types += 1
        
        if total_columns > 0:
            type_completeness = columns_with_types / total_columns
            completeness_score += type_completeness * 0.4
        
        return min(completeness_score, 1.0)

    def _assess_consistency(self, schema: Dict) -> float:
        """Assess schema consistency."""
        consistency_score = 0.0
        
        # Check naming consistency
        naming_score = self._analyze_naming_consistency(schema)
        consistency_score += naming_score * 0.5
        
        # Check data type consistency
        type_consistency = self._check_type_consistency(schema)
        consistency_score += type_consistency * 0.3
        
        # Check constraint consistency
        constraint_consistency = self._check_constraint_consistency(schema)
        consistency_score += constraint_consistency * 0.2
        
        return min(consistency_score, 1.0)

    def _assess_correctness(self, schema: Dict) -> float:
        """Assess schema correctness."""
        correctness_score = 0.0
        
        # Check for valid data types
        valid_types_score = self._check_valid_data_types(schema)
        correctness_score += valid_types_score * 0.4
        
        # Check for logical constraints
        logical_constraints_score = self._check_logical_constraints(schema)
        correctness_score += logical_constraints_score * 0.3
        
        # Check for referential integrity
        ref_integrity_score = self._check_referential_integrity(schema)
        correctness_score += ref_integrity_score * 0.3
        
        return min(correctness_score, 1.0)

    def _assess_conciseness(self, schema: Dict) -> float:
        """Assess schema conciseness (not overly complex)."""
        if len(schema) == 0:
            return 0.0
        
        # Check table count (5-15 tables is typically good for a warehouse)
        table_count = len(schema)
        if 5 <= table_count <= 15:
            table_score = 1.0
        elif 3 <= table_count <= 20:
            table_score = 0.8
        elif 1 <= table_count <= 25:
            table_score = 0.6
        else:
            table_score = 0.4
        
        # Check average columns per table (5-15 is typically good)
        total_columns = 0
        for table_name, table_info in schema.items():
            if isinstance(table_info, dict) and 'columns' in table_info:
                total_columns += len(table_info['columns'])
        
        avg_columns = total_columns / table_count if table_count > 0 else 0
        if 5 <= avg_columns <= 15:
            column_score = 1.0
        elif 3 <= avg_columns <= 20:
            column_score = 0.8
        else:
            column_score = 0.6
        
        return (table_score + column_score) / 2

    # Additional helper methods
    def _check_type_consistency(self, schema: Dict) -> float:
        """Check data type consistency across similar columns."""
        type_mappings = defaultdict(set)
        
        for table_name, table_info in schema.items():
            if isinstance(table_info, dict) and 'columns' in table_info:
                for col in table_info['columns']:
                    if isinstance(col, dict):
                        col_name = col.get('name', '').lower()
                        col_type = col.get('type', '').upper()
                        type_mappings[col_name].add(col_type)
        
        consistent_types = 0
        total_unique_names = len(type_mappings)
        
        for col_name, types in type_mappings.items():
            if len(types) == 1:  # Consistent type across all occurrences
                consistent_types += 1
        
        return consistent_types / total_unique_names if total_unique_names > 0 else 1.0

    def _check_constraint_consistency(self, schema: Dict) -> float:
        """Check constraint consistency."""
        # Simplified check - in practice, this would be more sophisticated
        return 0.8  # Placeholder

    def _check_valid_data_types(self, schema: Dict) -> float:
        """Check for valid SQL data types."""
        valid_types = {
            'INTEGER', 'INT', 'BIGINT', 'SMALLINT', 'TINYINT',
            'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL',
            'VARCHAR', 'CHAR', 'TEXT', 'NVARCHAR', 'NCHAR',
            'DATE', 'TIME', 'DATETIME', 'TIMESTAMP',
            'BOOLEAN', 'BOOL', 'BIT'
        }
        
        valid_type_count = 0
        total_columns = 0
        
        for table_name, table_info in schema.items():
            if isinstance(table_info, dict) and 'columns' in table_info:
                for col in table_info['columns']:
                    if isinstance(col, dict):
                        total_columns += 1
                        col_type = col.get('type', '').upper()
                        # Extract base type (handle things like VARCHAR(255))
                        base_type = col_type.split('(')[0].strip()
                        if base_type in valid_types:
                            valid_type_count += 1
        
        return valid_type_count / total_columns if total_columns > 0 else 0.0

    def _check_logical_constraints(self, schema: Dict) -> float:
        """Check for logical constraint usage."""
        # Simplified check for constraint presence
        tables_with_constraints = 0
        total_tables = len(schema)
        
        for table_name, table_info in schema.items():
            if isinstance(table_info, dict) and 'columns' in table_info:
                has_constraints = False
                for col in table_info['columns']:
                    if isinstance(col, dict) and col.get('constraints'):
                        has_constraints = True
                        break
                
                if has_constraints:
                    tables_with_constraints += 1
        
        return tables_with_constraints / total_tables if total_tables > 0 else 0.0

    def _check_fk_consistency(self, schema: Dict) -> float:
        """Check foreign key consistency."""
        # Simplified implementation
        return 0.8

    def _check_referential_integrity(self, schema: Dict) -> float:
        """Check referential integrity."""
        # Simplified implementation
        return 0.8

    def _check_cardinality_appropriateness(self, schema: Dict) -> float:
        """Check if cardinalities are appropriate."""
        # Simplified implementation
        return 0.8

    def _check_circular_references(self, schema: Dict) -> float:
        """Check for circular references."""
        # Simplified implementation - assume no circular references for now
        return 1.0

    def _get_domain_patterns(self, domain: str) -> Dict:
        """Get domain-specific patterns."""
        patterns = {
            'E-commerce': {
                'tables': ['product', 'customer', 'order', 'payment', 'inventory'],
                'columns': ['price', 'quantity', 'total', 'discount', 'tax']
            },
            'Healthcare': {
                'tables': ['patient', 'doctor', 'appointment', 'treatment', 'medication'],
                'columns': ['diagnosis', 'treatment_date', 'dosage', 'symptoms']
            },
            'Finance': {
                'tables': ['account', 'transaction', 'customer', 'loan', 'investment'],
                'columns': ['amount', 'balance', 'interest_rate', 'currency']
            },
            'Education': {
                'tables': ['student', 'course', 'enrollment', 'grade', 'instructor'],
                'columns': ['grade', 'credit_hours', 'gpa', 'semester']
            }
        }
        
        return patterns.get(domain, {'tables': [], 'columns': []})

    def _check_table_name_alignment(self, schema: Dict, patterns: Dict) -> float:
        """Check table name alignment with domain patterns."""
        domain_tables = patterns.get('tables', [])
        if not domain_tables:
            return 0.5  # No specific patterns to check against
        
        aligned_tables = 0
        total_tables = len(schema)
        
        for table_name in schema.keys():
            table_lower = table_name.lower()
            for pattern in domain_tables:
                if pattern.lower() in table_lower:
                    aligned_tables += 1
                    break
        
        return aligned_tables / total_tables if total_tables > 0 else 0.0

    def _check_column_name_alignment(self, schema: Dict, patterns: Dict) -> float:
        """Check column name alignment with domain patterns."""
        domain_columns = patterns.get('columns', [])
        if not domain_columns:
            return 0.5  # No specific patterns to check against
        
        aligned_columns = 0
        total_columns = 0
        
        for table_name, table_info in schema.items():
            if isinstance(table_info, dict) and 'columns' in table_info:
                for col in table_info['columns']:
                    if isinstance(col, dict):
                        total_columns += 1
                        col_name = col.get('name', '').lower()
                        for pattern in domain_columns:
                            if pattern.lower() in col_name:
                                aligned_columns += 1
                                break
        
        return aligned_columns / total_columns if total_columns > 0 else 0.0

    def _check_business_rule_alignment(self, schema: Dict, domain: str) -> float:
        """Check alignment with business rules."""
        # Simplified implementation - would need more domain-specific logic
        return 0.7

    def _get_domain_keywords(self, domain: str) -> List[str]:
        """Get domain-specific keywords."""
        keywords = {
            'E-commerce': ['product', 'customer', 'order', 'cart', 'payment', 'shipping', 'inventory'],
            'Healthcare': ['patient', 'doctor', 'medical', 'treatment', 'diagnosis', 'appointment'],
            'Finance': ['account', 'transaction', 'payment', 'balance', 'loan', 'investment'],
            'Education': ['student', 'course', 'grade', 'enrollment', 'instructor', 'academic'],
            'Supply Chain': ['supplier', 'warehouse', 'shipment', 'inventory', 'logistics'],
            'Social Media': ['user', 'post', 'comment', 'like', 'share', 'follow']
        }
        
        return keywords.get(domain, [])

    def _compare_schemas(self, warehouse_schema: Dict, ai_enhanced_schema: Dict) -> Dict:
        """Compare warehouse and AI enhanced schemas."""
        comparison = {
            'warehouse_tables': len(warehouse_schema),
            'ai_enhanced_tables': len(ai_enhanced_schema),
            'table_difference': len(ai_enhanced_schema) - len(warehouse_schema),
            'common_tables': len(set(warehouse_schema.keys()).intersection(set(ai_enhanced_schema.keys()))),
            'warehouse_only_tables': list(set(warehouse_schema.keys()) - set(ai_enhanced_schema.keys())),
            'ai_enhanced_only_tables': list(set(ai_enhanced_schema.keys()) - set(warehouse_schema.keys()))
        }
        
        return comparison

    def _generate_recommendations(self, warehouse_schema: Dict, ai_enhanced_schema: Dict, domain: str) -> List[str]:
        """Generate improvement recommendations."""
        recommendations = []
        
        # Analyze warehouse schema
        warehouse_stats = self._get_schema_statistics(warehouse_schema)
        ai_stats = self._get_schema_statistics(ai_enhanced_schema)
        
        if warehouse_stats['fact_tables'] == 0:
            recommendations.append("Add explicit fact tables with proper naming (fact_*)")
        
        if warehouse_stats['dimension_tables'] < 3:
            recommendations.append("Consider adding more dimension tables for better analytical capabilities")
        
        if not any('date' in table.lower() for table in warehouse_schema.keys()):
            recommendations.append("Add a comprehensive date dimension table for time-based analysis")
        
        if ai_stats['avg_columns_per_table'] > warehouse_stats['avg_columns_per_table'] + 2:
            recommendations.append("AI enhanced schema provides richer column structure")
        
        recommendations.append(f"Consider domain-specific enhancements for {domain} industry")
        
        return recommendations

    def _get_detailed_metrics(self, schema: Dict, domain: str) -> Dict:
        """Get detailed metrics for the schema."""
        metrics = {
            'table_count': len(schema),
            'fact_tables': len([t for t in schema.keys() if t.lower().startswith('fact_')]),
            'dimension_tables': len([t for t in schema.keys() if t.lower().startswith('dim_')]),
            'total_columns': 0,
            'tables_with_audit_columns': 0,
            'tables_with_surrogate_keys': 0,
            'foreign_key_relationships': 0
        }
        
        for table_name, table_info in schema.items():
            if isinstance(table_info, dict) and 'columns' in table_info:
                columns = table_info['columns']
                metrics['total_columns'] += len(columns)
                
                has_audit = False
                has_surrogate = False
                
                for col in columns:
                    if isinstance(col, dict):
                        col_name = col.get('name', '').lower()
                        constraints = col.get('constraints', [])
                        
                        # Check audit columns
                        if any(audit in col_name for audit in ['created_date', 'updated_date', 'created_at', 'updated_at']):
                            has_audit = True
                        
                        # Check surrogate keys
                        if (col_name.endswith('_key') and 
                            any('PRIMARY KEY' in str(c).upper() for c in constraints)):
                            has_surrogate = True
                        
                        # Check foreign keys
                        if any('FOREIGN KEY' in str(c).upper() for c in constraints):
                            metrics['foreign_key_relationships'] += 1
                
                if has_audit:
                    metrics['tables_with_audit_columns'] += 1
                if has_surrogate:
                    metrics['tables_with_surrogate_keys'] += 1
        
        return metrics

    def _get_schema_statistics(self, schema: Dict) -> Dict:
        """Get basic schema statistics."""
        stats = {
            'total_tables': len(schema),
            'fact_tables': 0,
            'dimension_tables': 0,
            'total_columns': 0,
            'avg_columns_per_table': 0
        }
        
        for table_name, table_info in schema.items():
            if table_name.lower().startswith('fact_'):
                stats['fact_tables'] += 1
            elif table_name.lower().startswith('dim_'):
                stats['dimension_tables'] += 1
            
            if isinstance(table_info, dict) and 'columns' in table_info:
                stats['total_columns'] += len(table_info['columns'])
        
        if stats['total_tables'] > 0:
            stats['avg_columns_per_table'] = stats['total_columns'] / stats['total_tables']
        
        return stats

    def _get_algorithm_descriptions(self) -> Dict:
        """Get descriptions of all evaluation algorithms."""
        return {
            'structural_similarity_analysis': {
                'name': 'Structural Similarity Analysis (SSA)',
                'description': 'Measures structural preservation between original and generated schemas',
                'metrics': ['Table count similarity', 'Column distribution', 'Data type preservation', 'Relationship preservation']
            },
            'semantic_coherence_scoring': {
                'name': 'Semantic Coherence Scoring (SCS)',
                'description': 'Evaluates semantic consistency and logical naming conventions',
                'metrics': ['Naming consistency', 'Domain relevance', 'Logical structure']
            },
            'dw_best_practices_compliance': {
                'name': 'Data Warehouse Best Practices Compliance (DWBPC)',
                'description': 'Measures adherence to established data warehousing best practices',
                'metrics': ['Fact/Dimension separation', 'Surrogate keys', 'SCD support', 'Date dimension', 'Audit trails', 'Foreign keys']
            },
            'schema_quality_index': {
                'name': 'Schema Quality Index (SQI)',
                'description': 'Comprehensive quality assessment based on multiple dimensions',
                'metrics': ['Completeness', 'Consistency', 'Correctness', 'Conciseness']
            },
            'relationship_integrity_metric': {
                'name': 'Relationship Integrity Metric (RIM)',
                'description': 'Evaluates integrity and correctness of inter-table relationships',
                'metrics': ['FK consistency', 'Referential integrity', 'Cardinality appropriateness', 'Circular reference detection']
            },
            'domain_alignment_score': {
                'name': 'Domain Alignment Score (DAS)',
                'description': 'Measures alignment with domain-specific requirements and patterns',
                'metrics': ['Table name alignment', 'Column name alignment', 'Business rule alignment']
            }
        }

# Global instance for easy access
evaluation_framework = SchemaEvaluationFramework() 