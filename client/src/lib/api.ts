// Backend API URL, configurable via environment variable
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// extend fetch options to include an "auth" boolean flag
interface ApiOptions extends RequestInit {
  auth?: boolean;
}

async function apiCall<T>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { auth = false, headers, ...rest } = options;

  const finalHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...headers,
  };

  // If the request must be authenticated, we retrieve the token
  // stored in localStorage and add it to the Authorization header
  if (auth) {
    const token = localStorage.getItem("token");
    if (token) {
      (finalHeaders as Record<string, string>)["Authorization"] =
        `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: finalHeaders,
  });

  const data = await response.json();

  // Check if the response is successful and transform an HTTP error into a proper JavaScript error
  if (!response.ok) {
    throw new Error(data.error || "An error occurred");
  }

  return data;
}

export default apiCall;
