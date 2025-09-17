# Real-time Jira Dashboard

A real-time agile metrics dashboard that connects to Jira via MCP (Model Context Protocol) to display project analytics and team performance metrics.

## Features

- **Real-time Data**: All metrics are fetched live from Jira API through MCP integration
- **Agile Metrics**: Velocity, bug percentage, team health, cycle time evolution
- **Effort Tracking**: Real worklog data with monthly breakdowns
- **Auto-refresh**: Dashboard updates every 30 seconds automatically
- **Brazilian Timezone**: Timestamps properly formatted for Brazil timezone

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  FastAPI Backend│────▶│  MCP Atlassian  │
│   (TypeScript)  │     │    (Python)     │     │     Server      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     Port 5173              Port 8089                 Jira API
```

## Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- MCP Atlassian server configured
- Jira project with API access

## Installation

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

If requirements.txt doesn't exist, install manually:
```bash
pip install fastapi uvicorn pydantic python-dotenv requests aiohttp
```

4. Configure MCP connection:
- Ensure your MCP config file exists at `/Users/andrenunes/go-realtime-event-system/mcp-config.json`
- Or update the path in `mcp_client.py`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Start Backend Server

From the backend directory:
```bash
python main.py
```

The FastAPI server will start on http://localhost:8089

### Start Frontend Development Server

From the frontend directory:
```bash
npm run dev
```

The React app will be available at http://localhost:5173

## Project Structure

```
ProjetoJira/
├── backend/
│   ├── main.py              # FastAPI server with Jira integration
│   ├── mcp_client.py         # MCP Atlassian client bridge
│   └── requirements.txt      # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── AgileDashboard.tsx  # Main dashboard component
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## Dashboard Metrics

- **Velocity**: Story points or issues completed in current period
- **Bugs %**: Percentage of bug issues in the project
- **Team Health**: Combined metric (50% completion rate + 50% quality)
- **Cycle Time**: Average time from issue creation to resolution
- **Effort Evolution**: Real monthly worklog hours from Jira
- **Burn Rate**: Weekly average hours worked by the team

## API Endpoints

- `GET /api/agile-metrics` - Returns all dashboard metrics
- `GET /health` - Health check endpoint

## Configuration

The application uses the following configuration sources:

1. **MCP Configuration**: Located at `/Users/andrenunes/go-realtime-event-system/mcp-config.json`
2. **Jira Project**: Default project key is "CB" (can be modified in backend code)

## Troubleshooting

### Backend not connecting to MCP
- Check if MCP config file exists at the specified path
- Verify Jira API credentials in MCP configuration
- Ensure MCP server is running

### Frontend not updating
- Check browser console for errors
- Verify backend is running on port 8089
- Check CORS settings if running on different domains

### Wrong timezone in timestamps
- Backend uses Brazilian timezone (America/Sao_Paulo)
- Verify system timezone settings

## Development

### Adding New Metrics

1. Update backend calculation in `main.py`
2. Add to the response model
3. Update TypeScript interface in `AgileDashboard.tsx`
4. Add visualization component

### Testing

Run backend in development mode:
```bash
uvicorn main:app --reload --port 8089
```

## License

This project is proprietary and confidential.

## Support

For issues or questions, please contact the development team.