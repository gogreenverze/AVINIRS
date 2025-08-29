"""
Workflow Engine for Sample Routing System
Handles multi-step workflow management with configurable stages
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from utils import read_data, write_data
import uuid

class WorkflowEngine:
    """
    Multi-step workflow engine for sample routing
    """
    
    # Define workflow stages
    WORKFLOW_STAGES = {
        'sample_routing': [
            {
                'id': 'initiated',
                'name': 'Routing Initiated',
                'description': 'Sample routing request has been created',
                'required_actions': [],
                'next_stages': ['pending_approval']
            },
            {
                'id': 'pending_approval',
                'name': 'Pending Approval',
                'description': 'Waiting for destination facility approval',
                'required_actions': ['approve', 'reject'],
                'next_stages': ['approved', 'rejected']
            },
            {
                'id': 'approved',
                'name': 'Approved',
                'description': 'Routing approved by destination facility',
                'required_actions': ['dispatch'],
                'next_stages': ['in_transit']
            },
            {
                'id': 'rejected',
                'name': 'Rejected',
                'description': 'Routing rejected by destination facility',
                'required_actions': [],
                'next_stages': []
            },
            {
                'id': 'in_transit',
                'name': 'In Transit',
                'description': 'Sample is being transported',
                'required_actions': ['receive', 'report_issue'],
                'next_stages': ['delivered', 'issue_reported']
            },
            {
                'id': 'delivered',
                'name': 'Delivered',
                'description': 'Sample successfully delivered and received',
                'required_actions': ['confirm_receipt'],
                'next_stages': ['completed']
            },
            {
                'id': 'issue_reported',
                'name': 'Issue Reported',
                'description': 'Issue reported during transit',
                'required_actions': ['resolve_issue', 'cancel'],
                'next_stages': ['in_transit', 'cancelled']
            },
            {
                'id': 'completed',
                'name': 'Completed',
                'description': 'Sample routing completed successfully',
                'required_actions': [],
                'next_stages': []
            },
            {
                'id': 'cancelled',
                'name': 'Cancelled',
                'description': 'Sample routing cancelled',
                'required_actions': [],
                'next_stages': []
            }
        ]
    }
    
    @staticmethod
    def get_workflow_stages(workflow_type: str = 'sample_routing') -> List[Dict]:
        """Get workflow stages for a specific workflow type"""
        return WorkflowEngine.WORKFLOW_STAGES.get(workflow_type, [])
    
    @staticmethod
    def get_stage_by_id(stage_id: str, workflow_type: str = 'sample_routing') -> Optional[Dict]:
        """Get a specific stage by ID"""
        stages = WorkflowEngine.get_workflow_stages(workflow_type)
        return next((stage for stage in stages if stage['id'] == stage_id), None)
    
    @staticmethod
    def get_next_stages(current_stage_id: str, workflow_type: str = 'sample_routing') -> List[Dict]:
        """Get possible next stages from current stage"""
        current_stage = WorkflowEngine.get_stage_by_id(current_stage_id, workflow_type)
        if not current_stage:
            return []
        
        next_stage_ids = current_stage.get('next_stages', [])
        stages = WorkflowEngine.get_workflow_stages(workflow_type)
        return [stage for stage in stages if stage['id'] in next_stage_ids]
    
    @staticmethod
    def can_transition_to_stage(current_stage_id: str, target_stage_id: str, 
                               workflow_type: str = 'sample_routing') -> bool:
        """Check if transition from current stage to target stage is allowed"""
        next_stages = WorkflowEngine.get_next_stages(current_stage_id, workflow_type)
        return any(stage['id'] == target_stage_id for stage in next_stages)
    
    @staticmethod
    def create_workflow_instance(routing_id: int, workflow_type: str = 'sample_routing',
                                user_id: int = None) -> Dict:
        """Create a new workflow instance"""
        workflow_instance = {
            'id': str(uuid.uuid4()),
            'routing_id': routing_id,
            'workflow_type': workflow_type,
            'current_stage': 'initiated',
            'created_at': datetime.now().isoformat(),
            'created_by': user_id,
            'updated_at': datetime.now().isoformat(),
            'stage_history': [
                {
                    'stage_id': 'initiated',
                    'entered_at': datetime.now().isoformat(),
                    'entered_by': user_id,
                    'notes': 'Workflow initiated'
                }
            ]
        }
        
        # Save workflow instance
        workflows = read_data('workflow_instances.json')
        workflows.append(workflow_instance)
        write_data('workflow_instances.json', workflows)
        
        return workflow_instance
    
    @staticmethod
    def transition_stage(workflow_id: str, target_stage_id: str, user_id: int = None,
                        notes: str = '', metadata: Dict = None) -> Dict:
        """Transition workflow to a new stage"""
        workflows = read_data('workflow_instances.json')
        workflow_index = next((i for i, w in enumerate(workflows) if w['id'] == workflow_id), None)
        
        if workflow_index is None:
            raise ValueError(f"Workflow {workflow_id} not found")
        
        workflow = workflows[workflow_index]
        current_stage = workflow['current_stage']
        
        # Check if transition is allowed
        if not WorkflowEngine.can_transition_to_stage(current_stage, target_stage_id, 
                                                     workflow['workflow_type']):
            raise ValueError(f"Cannot transition from {current_stage} to {target_stage_id}")
        
        # Update workflow
        workflow['current_stage'] = target_stage_id
        workflow['updated_at'] = datetime.now().isoformat()
        
        # Add to stage history
        stage_entry = {
            'stage_id': target_stage_id,
            'entered_at': datetime.now().isoformat(),
            'entered_by': user_id,
            'notes': notes,
            'metadata': metadata or {}
        }
        workflow['stage_history'].append(stage_entry)
        
        # Save updated workflow
        workflows[workflow_index] = workflow
        write_data('workflow_instances.json', workflows)
        
        return workflow
    
    @staticmethod
    def get_workflow_by_routing_id(routing_id: int) -> Optional[Dict]:
        """Get workflow instance by routing ID"""
        workflows = read_data('workflow_instances.json')
        return next((w for w in workflows if w['routing_id'] == routing_id), None)
    
    @staticmethod
    def get_workflow_status(routing_id: int) -> Dict:
        """Get current workflow status for a routing"""
        workflow = WorkflowEngine.get_workflow_by_routing_id(routing_id)
        if not workflow:
            return {'status': 'not_found', 'current_stage': None}
        
        current_stage_info = WorkflowEngine.get_stage_by_id(
            workflow['current_stage'], 
            workflow['workflow_type']
        )
        
        next_stages = WorkflowEngine.get_next_stages(
            workflow['current_stage'], 
            workflow['workflow_type']
        )
        
        return {
            'status': 'active',
            'workflow_id': workflow['id'],
            'current_stage': workflow['current_stage'],
            'current_stage_info': current_stage_info,
            'next_stages': next_stages,
            'stage_history': workflow['stage_history'],
            'updated_at': workflow['updated_at']
        }
