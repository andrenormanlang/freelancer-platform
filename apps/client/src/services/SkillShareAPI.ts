import axios from 'axios';
import { User, Skill, Lesson, Review, UserAuth } from '../types/types';


const api = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adding JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// Authentication and User Management

export const login = async (email: string, password: string): Promise<User> => {
  const response = await api.post("/auth/login", { email, password });
  localStorage.setItem('token', response.data.access_token);
  const profile = await getProfile(); // Fetch the full profile after login
  return profile;
};



export const logout = async (): Promise<void> => {
  localStorage.removeItem('token'); // Remove the JWT token
  // You might want to do additional cleanup here
};

export const getProfile = async (): Promise<User> => {
  try {
    const response = await api.get('/auth/profile');
    const profile: UserAuth = response.data;

    // Now, fetch the full user data using the user ID (sub) from the JWT payload
    const fullUserData = await getUserById(profile.sub);
    return fullUserData;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
};



export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  await api.post('/api/auth/forgot-password', { email });
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  await axios.post('/api/auth/forgot-password', { email });
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  await api.post(`/api/auth/reset-password?token=${token}`, { newPassword });
};


export const register = async (
  username: string, 
  password: string, 
  email: string, 
  avatarUrls: File [] | null, 
  skills: { title: string; description: string; price: number; isAvailable: boolean }[] = []
): Promise<User> => {
  const formData = new FormData();

  formData.append('username', username);
  formData.append('password', password);
  formData.append('email', email);

  if (avatarUrls) {
    avatarUrls.forEach((file, index) => {
      formData.append(`avatarUrls[${index}]`, file);
    });
  }

  if (skills && skills.length > 0) {
    skills.forEach((skill, index) => {
      if (skill.title && skill.description && skill.price != null && skill.isAvailable != null) {
        formData.append(`skills[${index}][title]`, skill.title);
        formData.append(`skills[${index}][description]`, skill.description);
        formData.append(`skills[${index}][price]`, skill.price.toString());
        formData.append(`skills[${index}][isAvailable]`, skill.isAvailable.toString());
      }
    });
  }

  const response = await axios.post('/api/users/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },

    
  });

  localStorage.setItem('token', response.data.access_token); 

  return response.data;
};


export const updateProfile = async (profileData: Partial<User>): Promise<User> => {
  const response = await api.put(`/users/${profileData.id}`, profileData);
  return response.data;
};


export const getAllUsers = async (): Promise<User[]> => {
  const response = await api.get('/users');
  return response.data;
};

export const getUserById = async (userId: string): Promise<User> => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  await api.delete(`/users/${userId}`);
};

export const updateUserWithSkills = async (profileData: Partial<User>): Promise<User> => {
  const response = await api.put(`/users/${profileData.id}`, profileData);
  return response.data;
};


// Skill Management

export const createSkill = async (skillData: Partial<Skill>): Promise<Skill> => {
  const response = await api.post('/skills', skillData);
  return response.data;
};

export const getAllSkills = async (): Promise<Skill[]> => {
  const response = await api.get('/skills');
  return response.data;
};

export const getSkillById = async (skillId: string): Promise<Skill> => {
  const response = await api.get(`/skills/${skillId}`);
  return response.data;
};

export const updateSkill = async (skillId: string, skillData: Partial<Skill>): Promise<Skill> => {
  const response = await api.put(`/skills/${skillId}`, skillData);
  return response.data;
};

export const deleteSkill = async (skillId: string): Promise<void> => {
  const response = await api.delete(`/skills/${skillId}`);
  return response.data;
};

// Booking Management

export const bookLesson = async (lessonData: Partial<Lesson>): Promise<Lesson> => {
  const response = await api.post('/lessons', lessonData);
  return response.data;
};

export const getAllBookings = async (): Promise<Lesson[]> => {
  const response = await api.get('/bookings');
  return response.data;
};

export const getBookingById = async (bookingId: string): Promise<Lesson> => {
  const response = await api.get(`/bookings/${bookingId}`);
  return response.data;
};

// Review Management

export const leaveReview = async (reviewData: Partial<Review>): Promise<Review> => {
  const response = await api.post('/reviews', reviewData);
  return response.data;
};

export const getReviewsForSkill = async (skillId: string): Promise<Review[]> => {
  const response = await api.get(`/reviews/skill/${skillId}`);
  return response.data;
};

export const getReviewsByUser = async (userId: string): Promise<Review[]> => {
  const response = await api.get(`/reviews/user/${userId}`);
  return response.data;
};

// Admin Management

export const manageUserRoles = async (userId: string, role: string): Promise<void> => {
  const response = await api.put(`/admin/users/${userId}/role`, { role });
  return response.data;
};