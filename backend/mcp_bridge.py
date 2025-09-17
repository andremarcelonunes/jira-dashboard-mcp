#!/usr/bin/env python3
"""
MCP Bridge Service - Fetches LIVE Jira data using MCP functions
This runs in Claude Code environment where MCP functions are available
Updates a shared JSON file that the FastAPI server reads
"""
import json
import os
import time
from datetime import datetime
from typing import Dict, Any, List

def fetch_live_jira_data() -> Dict[str, Any]:
    """
    Fetch LIVE data from Jira using real MCP functions
    This function is designed to run in Claude Code environment
    """
    print("Fetching LIVE Jira data via MCP...")
    
    try:
        # Import MCP function (only available in Claude Code environment)
        import mcp__atlassian__search_issues as jira_api
        
        # Get ALL issues from CB project
        all_issues = jira_api.search_issues(
            jql="project = CB ORDER BY created DESC",
            maxResults=200,  # Get ALL 161 issues
            fields=["key", "summary", "status", "issuetype", "priority", "created", "resolutiondate", "updated"]
        )
        
        if not all_issues or 'issues' not in all_issues:
            print("No data returned from Jira")
            return None
            
        total_count = all_issues.get('total', 0)
        issues = all_issues.get('issues', [])
        
        print(f"Fetched {len(issues)} issues out of {total_count} total")
        
        # Count real statuses
        completed_count = 0
        testing_count = 0
        backlog_count = 0
        in_progress_count = 0
        subtask_count = 0
        bug_count = 0
        high_priority_count = 0
        
        for issue in issues:
            fields = issue.get('fields', {})
            status = fields.get('status', {}).get('name', '').lower()
            issue_type = fields.get('issuetype', {}).get('name', '').lower()
            priority = fields.get('priority', {}).get('name', '').lower()
            
            # Count by status
            if 'concluído' in status or 'done' in status:
                completed_count += 1
            elif 'teste' in status or 'testing' in status:
                testing_count += 1
            elif 'backlog' in status:
                backlog_count += 1
            else:
                in_progress_count += 1
                
            # Count by type
            if 'subtarefa' in issue_type or 'subtask' in issue_type:
                subtask_count += 1
            elif 'bug' in issue_type:
                bug_count += 1
                
            # Count priority
            if 'high' in priority or 'critical' in priority:
                high_priority_count += 1
        
        # Get completed issues specifically
        completed_issues = jira_api.search_issues(
            jql='project = CB AND statusCategory = "done"',
            maxResults=1,
            fields=["key"]
        )
        
        real_completed_total = completed_issues.get('total', completed_count) if completed_issues else completed_count
        
        print(f"Real metrics: {real_completed_total} completed out of {total_count} total")
        
        # Build live data structure
        live_data = {
            "total": total_count,
            "issues": issues,
            "metrics": {
                "total_issues": total_count,
                "completed_count": real_completed_total,  # Use the real 51 completed
                "testing_count": testing_count,
                "backlog_count": backlog_count,
                "in_progress_count": in_progress_count,
                "subtask_count": subtask_count,
                "bug_count": bug_count,
                "high_priority_count": high_priority_count
            },
            "fetched_at": datetime.now().isoformat() + "Z",
            "data_source": "live_mcp_api"
        }
        
        # Save to file for FastAPI to read
        output_file = os.path.join(os.path.dirname(__file__), 'live_jira_data.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(live_data, f, indent=2, ensure_ascii=False)
            
        print(f"Live data saved to {output_file}")
        return live_data
        
    except ImportError as e:
        print(f"MCP functions not available: {e}")
        print("This script must run in Claude Code environment")
        return None
    except Exception as e:
        print(f"Error fetching live Jira data: {e}")
        return None

def auto_update_loop(interval_seconds: int = 60):
    """
    Continuously update Jira data at specified interval
    """
    print(f"Starting auto-update loop (interval: {interval_seconds}s)")
    
    while True:
        try:
            data = fetch_live_jira_data()
            if data:
                print(f"Successfully updated at {datetime.now()}")
                print(f"Stats: {data['metrics']['completed_count']}/{data['metrics']['total_issues']} completed")
            else:
                print("Failed to fetch data, will retry...")
                
            time.sleep(interval_seconds)
            
        except KeyboardInterrupt:
            print("\nStopping auto-update loop")
            break
        except Exception as e:
            print(f"Error in update loop: {e}")
            time.sleep(interval_seconds)

if __name__ == "__main__":
    print("MCP Bridge Service - Live Jira Data Fetcher")
    print("=" * 50)
    
    # Try single fetch first
    data = fetch_live_jira_data()
    
    if data:
        print(f"\nInitial fetch successful!")
        print(f"Total issues: {data['metrics']['total_issues']}")
        print(f"Completed: {data['metrics']['completed_count']}")
        print(f"Testing: {data['metrics']['testing_count']}")
        print(f"Backlog: {data['metrics']['backlog_count']}")
        
        # Start auto-update loop
        print("\nStarting auto-update loop...")
        auto_update_loop(interval_seconds=30)  # Update every 30 seconds
    else:
        print("\nMCP functions not available in this environment")
        print("Please run this script in Claude Code environment")