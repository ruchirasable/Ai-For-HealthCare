// MongoDB API client for the diabetes app
// This connects to the Edge Function that handles MongoDB operations

const MONGODB_API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mongodb-api`;

interface User {
  id: string;
  email: string;
  fullName: string;
  assessmentComplete: boolean;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  userId?: string;
  error?: string;
}

interface AssessmentData {
  age: number;
  gender: string;
  pulseRate: number;
  systolicBp: number;
  diastolicBp: number;
  glucose: number;
  height: number;
  weight: number;
  familyDiabetes: boolean;
  hypertensive: boolean;
  familyHypertension: boolean;
  cardiovascularDisease: boolean;
  stroke: boolean;
  bmi: number;
  riskScore: number;
  riskLevel: string;
}

// Store user in localStorage for session persistence
const USER_KEY = 'diabetes_app_user';

export const mongodbClient = {
  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  // Set current user in localStorage
  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },

  // Signup
  signup: async (email: string, password: string, fullName: string): Promise<AuthResponse> => {
    const response = await fetch(`${MONGODB_API_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    });
    return response.json();
  },

  // Login
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${MONGODB_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    
    if (data.success && data.user) {
      mongodbClient.setCurrentUser(data.user);
    }
    
    return data;
  },

  // Logout
  logout: () => {
    mongodbClient.setCurrentUser(null);
  },

  // Save assessment
  saveAssessment: async (userId: string, assessmentData: AssessmentData): Promise<{ success: boolean; error?: string }> => {
    const response = await fetch(`${MONGODB_API_URL}/save-assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, assessmentData }),
    });
    const data = await response.json();
    
    // Update local user state
    if (data.success) {
      const currentUser = mongodbClient.getCurrentUser();
      if (currentUser) {
        mongodbClient.setCurrentUser({ ...currentUser, assessmentComplete: true });
      }
    }
    
    return data;
  },

  // Get assessment
  getAssessment: async (userId: string): Promise<{ assessment: AssessmentData | null }> => {
    const response = await fetch(`${MONGODB_API_URL}/get-assessment?userId=${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  // Get user
  getUser: async (userId: string): Promise<{ user?: User; error?: string }> => {
    const response = await fetch(`${MONGODB_API_URL}/get-user?userId=${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },
};
