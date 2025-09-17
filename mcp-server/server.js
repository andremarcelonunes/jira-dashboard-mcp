#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE_URL = process.env.ATLASSIAN_URL || 'https://your-domain.atlassian.net';
const API_EMAIL = process.env.ATLASSIAN_EMAIL || '';
const API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';

class AtlassianServer {
  constructor() {
    this.server = new Server(
      {
        name: "atlassian-api",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Jira Issue Management
        {
          name: "search_issues",
          description: "Search for Jira issues using JQL",
          inputSchema: {
            type: "object",
            properties: {
              jql: {
                type: "string",
                description: "JQL query string",
              },
              maxResults: {
                type: "number",
                description: "Maximum number of results (default: 50)",
                default: 50,
              },
              startAt: {
                type: "number",
                description: "Start index for pagination (default: 0)",
                default: 0,
              },
              fields: {
                type: "array",
                description: "Fields to include in response",
                items: { type: "string" },
              },
            },
            required: ["jql"],
          },
        },
        {
          name: "get_issue",
          description: "Get details of a specific Jira issue",
          inputSchema: {
            type: "object",
            properties: {
              issueKey: {
                type: "string",
                description: "Issue key (e.g., CB-140)",
              },
              fields: {
                type: "array",
                description: "Fields to include in response",
                items: { type: "string" },
              },
              expand: {
                type: "array",
                description: "Additional fields to expand",
                items: { type: "string" },
              },
            },
            required: ["issueKey"],
          },
        },
        {
          name: "create_issue",
          description: "Create a new Jira issue",
          inputSchema: {
            type: "object",
            properties: {
              project: {
                type: "string",
                description: "Project key",
              },
              summary: {
                type: "string",
                description: "Issue summary",
              },
              description: {
                type: "string",
                description: "Issue description",
              },
              issueType: {
                type: "string",
                description: "Issue type (Bug, Task, Story, etc.)",
                default: "Task",
              },
              priority: {
                type: "string",
                description: "Priority (Highest, High, Medium, Low, Lowest)",
              },
              assignee: {
                type: "string",
                description: "Assignee account ID",
              },
              labels: {
                type: "array",
                description: "Issue labels",
                items: { type: "string" },
              },
              components: {
                type: "array",
                description: "Issue components",
                items: { type: "string" },
              },
              customFields: {
                type: "object",
                description: "Custom field values",
              },
            },
            required: ["project", "summary"],
          },
        },
        {
          name: "update_issue",
          description: "Update an existing Jira issue",
          inputSchema: {
            type: "object",
            properties: {
              issueKey: {
                type: "string",
                description: "Issue key (e.g., CB-140)",
              },
              fields: {
                type: "object",
                description: "Fields to update",
              },
              notifyUsers: {
                type: "boolean",
                description: "Send notifications to users (default: true)",
                default: true,
              },
            },
            required: ["issueKey", "fields"],
          },
        },
        {
          name: "transition_issue",
          description: "Transition an issue to a different status",
          inputSchema: {
            type: "object",
            properties: {
              issueKey: {
                type: "string",
                description: "Issue key (e.g., CB-140)",
              },
              transitionId: {
                type: "string",
                description: "Transition ID",
              },
              fields: {
                type: "object",
                description: "Fields to update during transition",
              },
              comment: {
                type: "string",
                description: "Comment to add with transition",
              },
            },
            required: ["issueKey", "transitionId"],
          },
        },
        {
          name: "get_issue_transitions",
          description: "Get available transitions for an issue",
          inputSchema: {
            type: "object",
            properties: {
              issueKey: {
                type: "string",
                description: "Issue key (e.g., CB-140)",
              },
            },
            required: ["issueKey"],
          },
        },
        // Comments
        {
          name: "add_comment",
          description: "Add a comment to a Jira issue",
          inputSchema: {
            type: "object",
            properties: {
              issueKey: {
                type: "string",
                description: "Issue key (e.g., CB-140)",
              },
              comment: {
                type: "string",
                description: "Comment text",
              },
              visibility: {
                type: "object",
                description: "Comment visibility restrictions",
                properties: {
                  type: { type: "string" },
                  value: { type: "string" },
                },
              },
            },
            required: ["issueKey", "comment"],
          },
        },
        {
          name: "get_comments",
          description: "Get comments for a Jira issue",
          inputSchema: {
            type: "object",
            properties: {
              issueKey: {
                type: "string",
                description: "Issue key (e.g., CB-140)",
              },
              startAt: {
                type: "number",
                description: "Start index for pagination (default: 0)",
                default: 0,
              },
              maxResults: {
                type: "number",
                description: "Maximum number of results (default: 50)",
                default: 50,
              },
            },
            required: ["issueKey"],
          },
        },
        // Project Management
        {
          name: "get_projects",
          description: "Get list of accessible projects",
          inputSchema: {
            type: "object",
            properties: {
              expand: {
                type: "array",
                description: "Additional fields to expand",
                items: { type: "string" },
              },
              recent: {
                type: "number",
                description: "Number of recent projects to return",
              },
            },
          },
        },
        {
          name: "get_project",
          description: "Get details of a specific project",
          inputSchema: {
            type: "object",
            properties: {
              projectKey: {
                type: "string",
                description: "Project key",
              },
              expand: {
                type: "array",
                description: "Additional fields to expand",
                items: { type: "string" },
              },
            },
            required: ["projectKey"],
          },
        },
        // User Management
        {
          name: "search_users",
          description: "Search for users in Jira",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query",
              },
              maxResults: {
                type: "number",
                description: "Maximum number of results (default: 50)",
                default: 50,
              },
              startAt: {
                type: "number",
                description: "Start index for pagination (default: 0)",
                default: 0,
              },
            },
            required: ["query"],
          },
        },
        {
          name: "get_current_user",
          description: "Get current user information",
          inputSchema: {
            type: "object",
            properties: {
              expand: {
                type: "array",
                description: "Additional fields to expand",
                items: { type: "string" },
              },
            },
          },
        },
        // Worklog Management
        {
          name: "add_worklog",
          description: "Add worklog to an issue",
          inputSchema: {
            type: "object",
            properties: {
              issueKey: {
                type: "string",
                description: "Issue key (e.g., CB-140)",
              },
              timeSpent: {
                type: "string",
                description: "Time spent (e.g., '3h 30m')",
              },
              comment: {
                type: "string",
                description: "Worklog comment",
              },
              started: {
                type: "string",
                description: "Start time (ISO 8601 format)",
              },
              adjustEstimate: {
                type: "string",
                description: "How to adjust remaining estimate (new, leave, manual, auto)",
                default: "auto",
              },
              newEstimate: {
                type: "string",
                description: "New estimate (if adjustEstimate is 'new')",
              },
              reduceBy: {
                type: "string",
                description: "Reduce estimate by (if adjustEstimate is 'manual')",
              },
            },
            required: ["issueKey", "timeSpent"],
          },
        },
        {
          name: "get_worklogs",
          description: "Get worklogs for an issue",
          inputSchema: {
            type: "object",
            properties: {
              issueKey: {
                type: "string",
                description: "Issue key (e.g., CB-140)",
              },
              startAt: {
                type: "number",
                description: "Start index for pagination (default: 0)",
                default: 0,
              },
              maxResults: {
                type: "number",
                description: "Maximum number of results (default: 1048576)",
                default: 1048576,
              },
            },
            required: ["issueKey"],
          },
        },
        // Issue Types and Statuses
        {
          name: "get_issue_types",
          description: "Get all issue types",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_statuses",
          description: "Get all statuses",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "get_priorities",
          description: "Get all priorities",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "search_issues":
            return await this.searchIssues(args);
          case "get_issue":
            return await this.getIssue(args);
          case "create_issue":
            return await this.createIssue(args);
          case "update_issue":
            return await this.updateIssue(args);
          case "transition_issue":
            return await this.transitionIssue(args);
          case "get_issue_transitions":
            return await this.getIssueTransitions(args);
          case "add_comment":
            return await this.addComment(args);
          case "get_comments":
            return await this.getComments(args);
          case "get_projects":
            return await this.getProjects(args);
          case "get_project":
            return await this.getProject(args);
          case "search_users":
            return await this.searchUsers(args);
          case "get_current_user":
            return await this.getCurrentUser(args);
          case "add_worklog":
            return await this.addWorklog(args);
          case "get_worklogs":
            return await this.getWorklogs(args);
          case "get_issue_types":
            return await this.getIssueTypes(args);
          case "get_statuses":
            return await this.getStatuses(args);
          case "get_priorities":
            return await this.getPriorities(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  async makeRequest(endpoint, method = 'GET', body = null, params = null) {
    const url = new URL(`${API_BASE_URL}/rest/api/3${endpoint}`);
    
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          if (Array.isArray(params[key])) {
            params[key].forEach(value => url.searchParams.append(key, value));
          } else {
            url.searchParams.append(key, params[key]);
          }
        }
      });
    }

    const auth = Buffer.from(`${API_EMAIL}:${API_TOKEN}`).toString('base64');
    
    const options = {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  async searchIssues(args) {
    const { jql, maxResults = 50, startAt = 0, fields } = args;
    
    const params = {
      jql,
      maxResults,
      startAt,
    };
    
    if (fields && fields.length > 0) {
      params.fields = fields.join(',');
    }

    const result = await this.makeRequest('/search', 'GET', null, params);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async getIssue(args) {
    const { issueKey, fields, expand } = args;
    
    const params = {};
    if (fields && fields.length > 0) {
      params.fields = fields.join(',');
    }
    if (expand && expand.length > 0) {
      params.expand = expand.join(',');
    }

    const result = await this.makeRequest(`/issue/${issueKey}`, 'GET', null, params);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async createIssue(args) {
    const { 
      project, 
      summary, 
      description, 
      issueType = 'Task',
      priority,
      assignee,
      labels,
      components,
      customFields
    } = args;

    const issueData = {
      fields: {
        project: { key: project },
        summary,
        issuetype: { name: issueType },
      }
    };

    if (description) {
      issueData.fields.description = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: description
              }
            ]
          }
        ]
      };
    }

    if (priority) {
      issueData.fields.priority = { name: priority };
    }

    if (assignee) {
      issueData.fields.assignee = { accountId: assignee };
    }

    if (labels && labels.length > 0) {
      issueData.fields.labels = labels;
    }

    if (components && components.length > 0) {
      issueData.fields.components = components.map(name => ({ name }));
    }

    if (customFields) {
      Object.assign(issueData.fields, customFields);
    }

    const result = await this.makeRequest('/issue', 'POST', issueData);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async updateIssue(args) {
    const { issueKey, fields, notifyUsers = true } = args;

    const params = { notifyUsers };
    const result = await this.makeRequest(`/issue/${issueKey}`, 'PUT', { fields }, params);
    
    return {
      content: [
        {
          type: "text",
          text: `Issue ${issueKey} updated successfully`,
        },
      ],
    };
  }

  async transitionIssue(args) {
    const { issueKey, transitionId, fields, comment } = args;

    const transitionData = {
      transition: { id: transitionId }
    };

    if (fields) {
      transitionData.fields = fields;
    }

    if (comment) {
      transitionData.update = {
        comment: [
          {
            add: {
              body: {
                type: "doc",
                version: 1,
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: comment
                      }
                    ]
                  }
                ]
              }
            }
          }
        ]
      };
    }

    await this.makeRequest(`/issue/${issueKey}/transitions`, 'POST', transitionData);
    
    return {
      content: [
        {
          type: "text",
          text: `Issue ${issueKey} transitioned successfully`,
        },
      ],
    };
  }

  async getIssueTransitions(args) {
    const { issueKey } = args;
    
    const result = await this.makeRequest(`/issue/${issueKey}/transitions`);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async addComment(args) {
    const { issueKey, comment, visibility } = args;

    const commentData = {
      body: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: comment
              }
            ]
          }
        ]
      }
    };

    if (visibility) {
      commentData.visibility = visibility;
    }

    const result = await this.makeRequest(`/issue/${issueKey}/comment`, 'POST', commentData);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async getComments(args) {
    const { issueKey, startAt = 0, maxResults = 50 } = args;
    
    const params = { startAt, maxResults };
    const result = await this.makeRequest(`/issue/${issueKey}/comment`, 'GET', null, params);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async getProjects(args) {
    const { expand, recent } = args;
    
    const params = {};
    if (expand && expand.length > 0) {
      params.expand = expand.join(',');
    }
    if (recent) {
      params.recent = recent;
    }

    const result = await this.makeRequest('/project/search', 'GET', null, params);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async getProject(args) {
    const { projectKey, expand } = args;
    
    const params = {};
    if (expand && expand.length > 0) {
      params.expand = expand.join(',');
    }

    const result = await this.makeRequest(`/project/${projectKey}`, 'GET', null, params);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async searchUsers(args) {
    const { query, maxResults = 50, startAt = 0 } = args;
    
    const params = { query, maxResults, startAt };
    const result = await this.makeRequest('/user/search', 'GET', null, params);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async getCurrentUser(args) {
    const { expand } = args;
    
    const params = {};
    if (expand && expand.length > 0) {
      params.expand = expand.join(',');
    }

    const result = await this.makeRequest('/myself', 'GET', null, params);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async addWorklog(args) {
    const { 
      issueKey, 
      timeSpent, 
      comment, 
      started, 
      adjustEstimate = 'auto',
      newEstimate,
      reduceBy 
    } = args;

    const worklogData = { timeSpent };

    if (comment) {
      worklogData.comment = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: comment
              }
            ]
          }
        ]
      };
    }

    if (started) {
      worklogData.started = started;
    }

    const params = { adjustEstimate };
    if (newEstimate) {
      params.newEstimate = newEstimate;
    }
    if (reduceBy) {
      params.reduceBy = reduceBy;
    }

    const result = await this.makeRequest(`/issue/${issueKey}/worklog`, 'POST', worklogData, params);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async getWorklogs(args) {
    const { issueKey, startAt = 0, maxResults = 1048576 } = args;
    
    const params = { startAt, maxResults };
    const result = await this.makeRequest(`/issue/${issueKey}/worklog`, 'GET', null, params);
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async getIssueTypes(args) {
    const result = await this.makeRequest('/issuetype');
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async getStatuses(args) {
    const result = await this.makeRequest('/status');
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async getPriorities(args) {
    const result = await this.makeRequest('/priority');
    
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Atlassian MCP server running on stdio");
  }
}

const server = new AtlassianServer();
server.run().catch(console.error);