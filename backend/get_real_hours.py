#!/usr/bin/env python3
"""
Get REAL logged hours from Jira worklogs
"""
from mcp_client import MCPAtlassianClient
import json

def get_real_logged_hours():
    """
    Get actual logged hours from CB project
    """
    client = MCPAtlassianClient()
    
    print("Fetching issues with worklogs...")
    
    # Get all issues with time tracking - need to include timetracking field
    import requests
    from requests.auth import HTTPBasicAuth
    
    # Load MCP configuration to get credentials
    config_path = "/Users/andrenunes/PycharmProjects/ProjetoJira/mcp-config.json"
    with open(config_path, 'r') as f:
        config = json.load(f)
    
    atlassian_env = config['mcpServers']['atlassian']['env']
    
    url = f"{atlassian_env['ATLASSIAN_URL']}/rest/api/3/search"
    
    auth = HTTPBasicAuth(
        atlassian_env['ATLASSIAN_EMAIL'],
        atlassian_env['ATLASSIAN_API_TOKEN']
    )
    
    params = {
        "jql": "project = CB AND timespent > 0",
        "maxResults": 200,
        "fields": "key,summary,timetracking,timespent,timeoriginalestimate,aggregatetimespent"
    }
    
    response = requests.get(url, headers={"Accept": "application/json"}, params=params, auth=auth)
    
    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        return
        
    issues = response.json()
    
    if not issues:
        print("No issues with logged time found")
        return
    
    print(f"Found {issues.get('total', 0)} issues with logged time")
    
    total_seconds = 0
    issues_with_time = []
    
    for issue in issues.get('issues', []):
        fields = issue.get('fields', {})
        timespent = fields.get('timespent')  # Time spent in seconds
        timeoriginalestimate = fields.get('timeoriginalestimate')  # Original estimate in seconds
        
        if timespent:
            total_seconds += timespent
            hours = timespent / 3600
            issues_with_time.append({
                'key': issue['key'],
                'summary': fields.get('summary', ''),
                'hours_logged': round(hours, 1)
            })
    
    total_hours = total_seconds / 3600
    
    print(f"\n✅ REAL LOGGED HOURS: {total_hours:.1f} hours")
    print(f"Issues with time logged: {len(issues_with_time)}")
    
    if issues_with_time:
        print("\nTop issues by time logged:")
        sorted_issues = sorted(issues_with_time, key=lambda x: x['hours_logged'], reverse=True)
        for issue in sorted_issues[:10]:
            print(f"  {issue['key']}: {issue['hours_logged']} hours - {issue['summary'][:50]}")
    
    # Also get estimated hours
    all_issues = client.search_issues('project = CB', max_results=200)
    total_estimate_seconds = 0
    
    for issue in all_issues.get('issues', []):
        fields = issue.get('fields', {})
        estimate = fields.get('timeoriginalestimate')
        if estimate:
            total_estimate_seconds += estimate
    
    total_estimated_hours = total_estimate_seconds / 3600
    
    print(f"\n📊 SUMMARY:")
    print(f"Total Logged Hours: {total_hours:.1f}")
    print(f"Total Estimated Hours: {total_estimated_hours:.1f}")
    print(f"Progress: {(total_hours/max(total_estimated_hours, 1)*100):.1f}%")
    
    return {
        'total_logged_hours': total_hours,
        'total_estimated_hours': total_estimated_hours,
        'issues_with_time': len(issues_with_time)
    }

if __name__ == "__main__":
    print("Getting REAL hours from Jira worklogs...")
    print("=" * 50)
    get_real_logged_hours()