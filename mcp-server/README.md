# Atlassian MCP Server

A Model Context Protocol (MCP) server for comprehensive Atlassian API integration, providing access to Jira issues, projects, users, worklogs, and more.

## Features

### Issue Management
- **Search Issues**: Advanced JQL search with pagination and field selection
- **Issue CRUD**: Create, read, update, and delete Jira issues
- **Issue Transitions**: Transition issues through workflow states
- **Comments**: Add and retrieve issue comments
- **Worklogs**: Track time spent on issues

### Project Management
- **Project Information**: Get project details and lists
- **Project Search**: Find projects with filtering options

### User Management
- **User Search**: Find users in your Jira instance
- **Current User**: Get information about the authenticated user

### Metadata
- **Issue Types**: Get available issue types
- **Statuses**: Retrieve all available statuses
- **Priorities**: Get priority levels

## Installation

1. Navigate to the mcp-atlassian-server directory:
```bash
cd /Users/andrenunes/go-realtime-event-system/mcp-atlassian-server
```

2. Install dependencies:
```bash
npm install
```

## Configuration

The server is configured in your MCP config file with the following environment variables:

- `ATLASSIAN_URL`: Your Atlassian instance URL (e.g., https://your-domain.atlassian.net)
- `ATLASSIAN_EMAIL`: Your Atlassian account email
- `ATLASSIAN_API_TOKEN`: Your Atlassian API token

### Getting an API Token

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a descriptive name
4. Copy the generated token

## Available Tools

### Issue Operations
- `search_issues` - Search for issues using JQL
- `get_issue` - Get detailed information about a specific issue
- `create_issue` - Create a new issue
- `update_issue` - Update an existing issue
- `transition_issue` - Move an issue through workflow states
- `get_issue_transitions` - Get available transitions for an issue

### Comments
- `add_comment` - Add a comment to an issue
- `get_comments` - Get all comments for an issue

### Projects
- `get_projects` - List accessible projects
- `get_project` - Get detailed information about a project

### Users
- `search_users` - Search for users
- `get_current_user` - Get current user information

### Worklogs
- `add_worklog` - Add time tracking to an issue
- `get_worklogs` - Get worklog entries for an issue

### Metadata
- `get_issue_types` - Get available issue types
- `get_statuses` - Get available statuses
- `get_priorities` - Get available priorities

## Usage Examples

### Search for issues in a specific project:
```javascript
await mcp.callTool("search_issues", {
  jql: "project = CB AND status = 'In Progress'",
  maxResults: 10
});
```

### Create a new issue:
```javascript
await mcp.callTool("create_issue", {
  project: "CB",
  summary: "Implement new feature",
  description: "Detailed description of the feature",
  issueType: "Story",
  priority: "Medium"
});
```

### Add a comment to an issue:
```javascript
await mcp.callTool("add_comment", {
  issueKey: "CB-123",
  comment: "This issue has been reviewed and approved"
});
```

### Log work on an issue:
```javascript
await mcp.callTool("add_worklog", {
  issueKey: "CB-123",
  timeSpent: "2h 30m",
  comment: "Implemented the core functionality"
});
```

## Error Handling

The server includes comprehensive error handling for:
- Authentication failures
- Invalid API requests
- Network connectivity issues
- Malformed parameters

Errors are returned with descriptive messages to help with debugging.

## Development

To run the server locally:
```bash
npm start
```

The server will start and listen for MCP protocol messages on stdio.