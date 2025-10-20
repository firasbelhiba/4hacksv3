# WebSocket Real-Time Events Documentation

## Overview

The 4Hacks backend provides real-time updates via WebSocket using Socket.IO. This allows clients to receive instant notifications about analysis progress, AI jury execution, and other asynchronous operations.

**WebSocket Namespace:** `/events`
**URL:** `http://localhost:4000/events`

## Authentication

All WebSocket connections require JWT authentication.

### Connection with Token

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000/events', {
  auth: {
    token: 'your-jwt-token-here'  // JWT from login/register
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});
```

### Alternative: Header Authentication

```javascript
const socket = io('http://localhost:4000/events', {
  extraHeaders: {
    Authorization: 'Bearer your-jwt-token-here'
  }
});
```

## Connection Events

### Connected
Emitted when successfully connected and authenticated.

```javascript
socket.on('connected', (data) => {
  console.log(data);
  // {
  //   message: 'Successfully connected to real-time events',
  //   clientId: 'socket-id-123'
  // }
});
```

### Error
Emitted when authentication fails.

```javascript
socket.on('error', (error) => {
  console.error(error);
  // { message: 'Authentication failed' }
});
```

### Disconnect
Emitted when connection is lost.

```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

## Subscription Events

### Subscribe to Project Updates

Subscribe to receive real-time updates for a specific project.

```javascript
socket.emit('subscribe:project', { projectId: 'proj123' });

// Confirmation response
socket.on('subscribe:project', (response) => {
  console.log(response);
  // { success: true, message: 'Subscribed to project proj123' }
});
```

### Unsubscribe from Project

```javascript
socket.emit('unsubscribe:project', { projectId: 'proj123' });

socket.on('unsubscribe:project', (response) => {
  console.log(response);
  // { success: true, message: 'Unsubscribed from project proj123' }
});
```

### Subscribe to AI Jury Session

```javascript
socket.emit('subscribe:ai-jury', { sessionId: 'session123' });

socket.on('subscribe:ai-jury', (response) => {
  console.log(response);
  // { success: true, message: 'Subscribed to AI Jury session session123' }
});
```

### Unsubscribe from AI Jury

```javascript
socket.emit('unsubscribe:ai-jury', { sessionId: 'session123' });
```

## Project Analysis Events

### Analysis Progress

Emitted periodically during analysis execution.

```javascript
socket.on('analysis:progress', (update) => {
  console.log(update);
});
```

**Update Structure:**
```typescript
{
  projectId: string;
  analysisType: 'innovation' | 'coherence' | 'hedera' | 'code-quality';
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress: number;              // 0-100
  currentStage: string;          // e.g., "Analyzing code structure"
  estimatedTimeRemaining?: number; // milliseconds
  details?: any;                 // Additional context
}
```

**Example:**
```javascript
socket.on('analysis:progress', (update) => {
  const { projectId, analysisType, progress, currentStage } = update;

  console.log(`${analysisType} analysis: ${progress}% - ${currentStage}`);

  // Update UI progress bar
  updateProgressBar(analysisType, progress);
});
```

### Analysis Completed

Emitted when analysis finishes successfully.

```javascript
socket.on('analysis:completed', (data) => {
  console.log(data);
});
```

**Data Structure:**
```typescript
{
  projectId: string;
  analysisType: string;
  reportId: string;
  score: number;
  timestamp: string;
  summary?: string;
}
```

**Example:**
```javascript
socket.on('analysis:completed', (data) => {
  console.log(`Analysis complete! Score: ${data.score}`);

  // Fetch full report
  fetch(`/api/projects/${data.projectId}/review/${data.analysisType}/${data.reportId}`)
    .then(res => res.json())
    .then(report => displayReport(report));
});
```

### Analysis Failed

Emitted when analysis encounters an error.

```javascript
socket.on('analysis:failed', (error) => {
  console.error(error);
});
```

**Error Structure:**
```typescript
{
  projectId: string;
  analysisType: string;
  error: {
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

## AI Jury Events

### Jury Progress

Emitted during AI jury layer execution.

```javascript
socket.on('ai-jury:progress', (update) => {
  console.log(update);
});
```

**Update Structure:**
```typescript
{
  sessionId: string;
  layer: number;                 // 1-4
  projectId?: string;            // Current project being evaluated
  projectName?: string;
  status: 'started' | 'processing' | 'completed' | 'failed';
  progress: number;              // 0-100
  eliminated?: number;           // Projects eliminated
  advanced?: number;             // Projects advanced
}
```

**Example:**
```javascript
socket.on('ai-jury:progress', (update) => {
  const { layer, progress, projectName, eliminated, advanced } = update;

  console.log(`Layer ${layer}: ${progress}%`);
  if (projectName) {
    console.log(`Evaluating: ${projectName}`);
  }
  if (eliminated) {
    console.log(`Eliminated: ${eliminated}, Advanced: ${advanced}`);
  }
});
```

### Layer Completed

Emitted when a jury layer finishes.

```javascript
socket.on('ai-jury:layer-completed', (data) => {
  console.log(data);
});
```

**Data Structure:**
```typescript
{
  sessionId: string;
  layer: number;
  eliminated: number;
  advanced: number;
  results: Array<{
    projectId: string;
    projectName: string;
    passed: boolean;
    score: number;
    reasoning: string;
  }>;
  timestamp: string;
}
```

### Jury Completed

Emitted when all jury layers finish.

```javascript
socket.on('ai-jury:completed', (data) => {
  console.log(data);
});
```

**Data Structure:**
```typescript
{
  sessionId: string;
  finalResults: Array<{
    projectId: string;
    projectName: string;
    finalScore: number;
    rank: number;
  }>;
  timestamp: string;
}
```

## Utility Events

### Ping/Pong

Test connection health.

```javascript
socket.emit('ping');

socket.on('pong', (data) => {
  console.log(data);
  // { pong: true, timestamp: '2025-10-04T12:00:00.000Z' }
});
```

## Complete Usage Examples

### Example 1: Real-time Project Analysis

```javascript
import io from 'socket.io-client';

// Connect with JWT token
const socket = io('http://localhost:4000/events', {
  auth: { token: localStorage.getItem('auth_token') }
});

// Handle connection
socket.on('connected', (data) => {
  console.log('Connected to WebSocket');

  // Subscribe to project updates
  socket.emit('subscribe:project', { projectId: 'proj123' });
});

// Track analysis progress
socket.on('analysis:progress', (update) => {
  const progressBar = document.getElementById('progress-bar');
  const statusText = document.getElementById('status-text');

  progressBar.style.width = `${update.progress}%`;
  statusText.textContent = update.currentStage;
});

// Handle completion
socket.on('analysis:completed', (data) => {
  showNotification(`${data.analysisType} analysis complete! Score: ${data.score}`);

  // Refresh UI with new data
  fetchAndDisplayReport(data.reportId);
});

// Handle errors
socket.on('analysis:failed', (error) => {
  showError(`Analysis failed: ${error.error.message}`);
});

// Clean up on unmount
function cleanup() {
  socket.emit('unsubscribe:project', { projectId: 'proj123' });
  socket.disconnect();
}
```

### Example 2: AI Jury Monitoring

```javascript
const socket = io('http://localhost:4000/events', {
  auth: { token: getAuthToken() }
});

let sessionId = null;

// Start AI jury session
async function startJurySession(hackathonId) {
  const response = await fetch('/api/ai-jury/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ hackathonId, eligibilityCriteria: [...] })
  });

  const data = await response.json();
  sessionId = data.id;

  // Subscribe to session updates
  socket.emit('subscribe:ai-jury', { sessionId });
}

// Monitor progress
socket.on('ai-jury:progress', (update) => {
  updateLayerProgress(update.layer, update.progress);

  if (update.projectName) {
    showCurrentProject(update.projectName);
  }
});

// Handle layer completion
socket.on('ai-jury:layer-completed', (data) => {
  console.log(`Layer ${data.layer} complete`);
  console.log(`Advanced: ${data.advanced}, Eliminated: ${data.eliminated}`);

  displayLayerResults(data.layer, data.results);
});

// Handle final results
socket.on('ai-jury:completed', (data) => {
  displayFinalRankings(data.finalResults);
  showNotification('AI Jury evaluation complete!');
});
```

### Example 3: React Hook

```typescript
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface AnalysisProgress {
  projectId: string;
  analysisType: string;
  progress: number;
  currentStage: string;
}

export function useProjectAnalysis(projectId: string, token: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:4000/events', {
      auth: { token }
    });

    newSocket.on('connected', () => {
      newSocket.emit('subscribe:project', { projectId });
    });

    newSocket.on('analysis:progress', (update: AnalysisProgress) => {
      setProgress(update);
    });

    newSocket.on('analysis:completed', (data) => {
      setIsCompleted(true);
      setProgress(null);
    });

    newSocket.on('analysis:failed', (err) => {
      setError(err.error.message);
      setProgress(null);
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.emit('unsubscribe:project', { projectId });
      newSocket.disconnect();
    };
  }, [projectId, token]);

  return { socket, progress, isCompleted, error };
}
```

## Error Handling

### Connection Errors

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);

  if (error.message === 'Authentication failed') {
    // Redirect to login
    window.location.href = '/login';
  }
});
```

### Reconnection Logic

```javascript
socket.io.on('reconnect', (attemptNumber) => {
  console.log(`Reconnected after ${attemptNumber} attempts`);

  // Re-subscribe to channels
  socket.emit('subscribe:project', { projectId: currentProjectId });
});

socket.io.on('reconnect_failed', () => {
  console.error('Failed to reconnect');
  showNotification('Connection lost. Please refresh the page.');
});
```

## Best Practices

### 1. Always Clean Up Subscriptions
```javascript
// When component unmounts or user navigates away
socket.emit('unsubscribe:project', { projectId });
socket.emit('unsubscribe:ai-jury', { sessionId });
```

### 2. Handle Disconnections Gracefully
```javascript
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server disconnected, reconnect manually
    socket.connect();
  }
  // else: automatic reconnection will occur
});
```

### 3. Debounce UI Updates
```javascript
import { debounce } from 'lodash';

const updateUI = debounce((progress) => {
  // Update UI with progress
}, 100); // Max once per 100ms

socket.on('analysis:progress', updateUI);
```

### 4. Use Heartbeat for Long Connections
```javascript
setInterval(() => {
  socket.emit('ping');
}, 30000); // Ping every 30 seconds

socket.on('pong', (data) => {
  console.log('Connection alive:', data.timestamp);
});
```

## Troubleshooting

### Connection Refused
- Ensure backend server is running
- Check WebSocket URL and port (4000)
- Verify firewall isn't blocking WebSocket

### Authentication Failed
- Check JWT token is valid and not expired
- Ensure token is passed in `auth` or `extraHeaders`
- Verify user has permission to access

### Not Receiving Events
- Confirm subscription was successful
- Check console for errors
- Verify project/session ID is correct
- Ensure you're listening for the correct event names

### Memory Leaks
- Always unsubscribe when done
- Disconnect socket on component unmount
- Remove event listeners properly

## Resources

- **Socket.IO Client Docs:** https://socket.io/docs/v4/client-api/
- **Socket.IO Events:** https://socket.io/docs/v4/emitting-events/
- **Backend Implementation:** `backend/src/modules/events/events.gateway.ts`

---

**Last Updated:** October 4, 2025
