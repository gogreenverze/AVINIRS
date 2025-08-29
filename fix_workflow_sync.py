#!/usr/bin/env python3
"""
Script to fix workflow synchronization issues.
This script will update existing workflow instances to match their routing statuses.
"""

import json
import sys
from datetime import datetime

def read_data(filename):
    """Read data from JSON file"""
    try:
        with open(f'backend/data/{filename}', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def write_data(filename, data):
    """Write data to JSON file"""
    with open(f'backend/data/{filename}', 'w') as f:
        json.dump(data, f, indent=2)

def get_workflow_stages_for_status(status):
    """Get the workflow stages that should exist for a given routing status"""
    status_to_stages = {
        'initiated': ['initiated'],
        'pending_approval': ['initiated', 'pending_approval'],
        'approved': ['initiated', 'pending_approval', 'approved'],
        'rejected': ['initiated', 'pending_approval', 'rejected'],
        'in_transit': ['initiated', 'pending_approval', 'approved', 'in_transit'],
        'delivered': ['initiated', 'pending_approval', 'approved', 'in_transit', 'delivered'],
        'completed': ['initiated', 'pending_approval', 'approved', 'in_transit', 'delivered', 'completed']
    }
    return status_to_stages.get(status, ['initiated'])

def fix_workflow_for_routing(routing, workflows):
    """Fix workflow instance for a specific routing"""
    routing_id = routing['id']
    routing_status = routing.get('status', 'pending_approval')
    
    print(f"Processing Routing {routing_id} (Sample {routing.get('sample_id', 'N/A')}) - Status: {routing_status}")
    
    # Find existing workflow
    workflow = next((w for w in workflows if w['routing_id'] == routing_id), None)
    
    if not workflow:
        print(f"  No workflow found, creating new one...")
        # Create new workflow
        workflow = {
            'id': f"workflow-{routing_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            'routing_id': routing_id,
            'workflow_type': 'sample_routing',
            'current_stage': routing_status,
            'created_at': routing.get('created_at', datetime.now().isoformat()),
            'created_by': routing.get('created_by', 1),
            'updated_at': routing.get('updated_at', datetime.now().isoformat()),
            'stage_history': []
        }
        workflows.append(workflow)
    else:
        print(f"  Found workflow, current stage: {workflow.get('current_stage', 'unknown')}")
        # Update existing workflow
        workflow['current_stage'] = routing_status
        workflow['updated_at'] = routing.get('updated_at', datetime.now().isoformat())
    
    # Rebuild stage history based on routing status and data
    required_stages = get_workflow_stages_for_status(routing_status)
    workflow['stage_history'] = []
    
    # Add stages in order
    for i, stage in enumerate(required_stages):
        stage_entry = {
            'stage_id': stage,
            'entered_at': routing.get('created_at', datetime.now().isoformat()),
            'entered_by': routing.get('created_by', 1),
            'notes': f'Stage {stage}',
            'metadata': {}
        }
        
        # Use specific timestamps and data if available
        if stage == 'initiated':
            stage_entry['entered_at'] = routing.get('created_at', datetime.now().isoformat())
            stage_entry['notes'] = 'Routing initiated'
        elif stage == 'pending_approval':
            stage_entry['entered_at'] = routing.get('created_at', datetime.now().isoformat())
            stage_entry['notes'] = 'Submitted for approval'
        elif stage == 'approved':
            stage_entry['entered_at'] = routing.get('approved_at', routing.get('updated_at', datetime.now().isoformat()))
            stage_entry['entered_by'] = routing.get('approved_by', routing.get('created_by', 1))
            stage_entry['notes'] = routing.get('approval_notes', 'Routing approved')
        elif stage == 'rejected':
            stage_entry['entered_at'] = routing.get('rejected_at', routing.get('updated_at', datetime.now().isoformat()))
            stage_entry['entered_by'] = routing.get('rejected_by', routing.get('created_by', 1))
            stage_entry['notes'] = routing.get('rejection_reason', 'Routing rejected')
        elif stage == 'in_transit':
            stage_entry['entered_at'] = routing.get('dispatch_date', routing.get('updated_at', datetime.now().isoformat()))
            stage_entry['entered_by'] = routing.get('dispatched_by', routing.get('created_by', 1))
            stage_entry['notes'] = routing.get('dispatch_notes', 'Sample dispatched')
            stage_entry['metadata'] = {
                'courier_name': routing.get('courier_name', ''),
                'courier_contact': routing.get('courier_contact', '')
            }
        elif stage == 'delivered':
            stage_entry['entered_at'] = routing.get('received_at', routing.get('updated_at', datetime.now().isoformat()))
            stage_entry['entered_by'] = routing.get('received_by', routing.get('created_by', 1))
            stage_entry['notes'] = routing.get('receipt_notes', 'Sample received')
            stage_entry['metadata'] = {
                'condition': routing.get('condition_on_arrival', 'good')
            }
        elif stage == 'completed':
            stage_entry['entered_at'] = routing.get('completed_at', routing.get('updated_at', datetime.now().isoformat()))
            stage_entry['entered_by'] = routing.get('completed_by', routing.get('created_by', 1))
            stage_entry['notes'] = routing.get('completion_notes', 'Routing completed')
        
        workflow['stage_history'].append(stage_entry)
    
    print(f"  Updated workflow with {len(workflow['stage_history'])} stages")
    return workflow

def main():
    print("Fixing Workflow Synchronization Issues")
    print("=" * 50)
    
    # Read data
    routings = read_data('sample_routings.json')
    workflows = read_data('workflow_instances.json')
    
    print(f"Found {len(routings)} routings and {len(workflows)} workflows")
    
    # Process each routing
    for routing in routings:
        fix_workflow_for_routing(routing, workflows)
    
    # Write updated workflows
    write_data('workflow_instances.json', workflows)
    
    print("\n" + "=" * 50)
    print("Workflow synchronization completed!")
    print(f"Updated {len(workflows)} workflow instances")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
