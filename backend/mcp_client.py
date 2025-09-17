#!/usr/bin/env python3
"""
MCP Client for Python - Connects to your local MCP Atlassian server
This allows Python to access real Jira data via MCP
"""
import json
import subprocess
import os
from typing import Dict, Any, Optional
from datetime import datetime

class MCPAtlassianClient:
    """Client to connect to MCP Atlassian server"""
    
    def __init__(self):
        # Your MCP server configuration
        self.mcp_server_path = "/Users/andrenunes/go-realtime-event-system/mcp-atlassian-server/server.js"
        self.node_path = "/Users/andrenunes/.nvm/versions/node/v20.17.0/bin/node"
        
        # Environment variables for the MCP server
        self.env = {
            **os.environ.copy(),
            "ATLASSIAN_URL": "https://your-domain.atlassian.net",
            "ATLASSIAN_EMAIL": "your-email@example.com",
            "ATLASSIAN_API_TOKEN": "your-api-token"
        }
        
    def call_mcp_function(self, function_name: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Call an MCP function via the server
        """
        try:
            # Create MCP request
            mcp_request = {
                "jsonrpc": "2.0",
                "method": f"tools/{function_name}",
                "params": params,
                "id": 1
            }
            
            # Send request to MCP server
            process = subprocess.Popen(
                [self.node_path, self.mcp_server_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=self.env,
                text=True
            )
            
            # Send the request
            stdout, stderr = process.communicate(
                input=json.dumps(mcp_request),
                timeout=30
            )
            
            if stdout:
                try:
                    response = json.loads(stdout)
                    if 'result' in response:
                        return response['result']
                    elif 'error' in response:
                        print(f"MCP error: {response['error']}")
                        return None
                except json.JSONDecodeError:
                    print(f"Failed to parse MCP response: {stdout}")
                    
            if stderr:
                print(f"MCP stderr: {stderr}")
                
            return None
            
        except Exception as e:
            print(f"Error calling MCP function {function_name}: {e}")
            return None
    
    def get_worklogs(self, issue_key: str) -> Optional[Dict[str, Any]]:
        """
        Get worklogs for a specific issue
        """
        try:
            import requests
            from requests.auth import HTTPBasicAuth
            
            url = f"https://your-domain.atlassian.net/rest/api/3/issue/{issue_key}/worklog"
            
            auth = HTTPBasicAuth(
                "your-email@example.com",
                "your-api-token"
            )
            
            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
            
            response = requests.get(url, headers=headers, auth=auth)
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
                
        except Exception as e:
            print(f"Error getting worklogs: {e}")
            return None
    
    def search_issues(self, jql: str, max_results: int = 50) -> Optional[Dict[str, Any]]:
        """
        Search Jira issues using JQL
        """
        print(f"Searching Jira with: {jql}")
        
        # Try direct API call first since MCP protocol might need different approach
        import requests
        from requests.auth import HTTPBasicAuth
        
        try:
            url = "https://your-domain.atlassian.net/rest/api/3/search"
            
            auth = HTTPBasicAuth(
                "your-email@example.com",
                "your-api-token"
            )
            
            headers = {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
            
            params = {
                "jql": jql,
                "maxResults": max_results,
                "fields": "key,summary,status,issuetype,priority,created,resolutiondate,updated"
            }
            
            response = requests.get(url, headers=headers, params=params, auth=auth)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Jira API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Error calling Jira API: {e}")
            return None

def fetch_live_cb_metrics():
    """
    Fetch live metrics for CB project
    """
    client = MCPAtlassianClient()
    
    print("Fetching live CB project metrics...")
    
    # Get total issues
    all_issues = client.search_issues("project = CB", max_results=200)
    
    if not all_issues:
        print("Failed to fetch issues")
        return None
        
    total = all_issues.get('total', 0)
    issues = all_issues.get('issues', [])
    
    print(f"Total issues in CB project: {total}")
    
    # Get completed issues count
    completed_issues = client.search_issues('project = CB AND statusCategory = "done"', max_results=1)
    completed_total = completed_issues.get('total', 0) if completed_issues else 0
    
    print(f"Completed issues: {completed_total}")
    
    # Count status breakdown
    status_counts = {}
    type_counts = {}
    priority_counts = {}
    
    for issue in issues:
        fields = issue.get('fields', {})
        
        # Status
        status = fields.get('status', {}).get('name', 'Unknown')
        status_counts[status] = status_counts.get(status, 0) + 1
        
        # Type
        issue_type = fields.get('issuetype', {}).get('name', 'Unknown')
        type_counts[issue_type] = type_counts.get(issue_type, 0) + 1
        
        # Priority
        priority = fields.get('priority', {}).get('name', 'Unknown')
        priority_counts[priority] = priority_counts.get(priority, 0) + 1
    
    metrics = {
        "total_issues": total,
        "completed_count": completed_total,
        "issues_fetched": len(issues),
        "status_breakdown": status_counts,
        "type_breakdown": type_counts,
        "priority_breakdown": priority_counts,
        "fetched_at": datetime.now().isoformat() + "Z"
    }
    
    # Save to file
    output_file = os.path.join(os.path.dirname(__file__), 'live_jira_metrics.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)
        
    print(f"Metrics saved to {output_file}")
    
    return metrics

if __name__ == "__main__":
    print("MCP Atlassian Client Test")
    print("=" * 50)
    
    metrics = fetch_live_cb_metrics()
    
    if metrics:
        print("\n✅ Successfully fetched live data!")
        print(f"Total issues: {metrics['total_issues']}")
        print(f"Completed: {metrics['completed_count']} (This should be 51)")
        print(f"\nStatus breakdown:")
        for status, count in metrics['status_breakdown'].items():
            print(f"  {status}: {count}")
        print(f"\nType breakdown:")
        for type_name, count in metrics['type_breakdown'].items():
            print(f"  {type_name}: {count}")
    else:
        print("\n❌ Failed to fetch data")