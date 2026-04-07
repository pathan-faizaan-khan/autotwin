import axios from 'axios';

// Ensure the FASTAPI_URL is properly configured based on environment
const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

/**
 * Creates an Axios instance specifically pre-configured for the FastAPI backend.
 * This can be used in your Next.js API route handlers to pass triggers securely 
 * without exposing the FastAPI URL to the client.
 */
export const fastApiClient = axios.create({
  baseURL: FASTAPI_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Operations might be slow, self-healing can take time
});

// A helper specifically designed for your Next.js API Routes to trigger AI tasks
export async function triggerAIFunction(taskType: string, payload: any) {
  try {
    // Expected to hit an endpoint like `POST /api/agents/task` on your FastAPI
    const response = await fastApiClient.post('/api/agents/task', {
      type: taskType,
      data: payload,
    });
    return response.data;
  } catch (error: any) {
    console.error(`FastAPI execution warning [${taskType}]:`, error.message);
    throw new Error('Failed to communicate with AI Engine.');
  }
}
