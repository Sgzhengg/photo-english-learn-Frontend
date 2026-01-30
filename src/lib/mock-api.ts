// =============================================================================
// PhotoEnglish - Mock API (Development Mode)
// =============================================================================

import type { User } from '@/types';

// -----------------------------------------------------------------------------
// Mock Data Storage (localStorage simulation)
// -----------------------------------------------------------------------------

const STORAGE_KEY = 'photoenglish_mock_users';
const CURRENT_USER_KEY = 'photoenglish_mock_current_user';
const MOCK_USER_ID_KEY = 'photoenglish_mock_user_id';

interface MockUser extends User {
  password: string;
}

const getMockUsers = (): MockUser[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveMockUsers = (users: MockUser[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Save current user to localStorage (for AuthContext)
const saveCurrentUser = (user: User) => {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  localStorage.setItem(MOCK_USER_ID_KEY, user.id);
};

const getCurrentUserFromStorage = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

// -----------------------------------------------------------------------------
// Mock API Functions
// -----------------------------------------------------------------------------

export const mockAuthApi = {
  /**
   * Mock login
   */
  login: async (emailOrPhone: string, password: string) => {
    await delay(500); // Simulate network delay

    const users = getMockUsers();
    const user = users.find(
      (u) => (u.email === emailOrPhone || u.phone === emailOrPhone) && u.password === password
    );

    if (!user) {
      throw new Error('邮箱或手机号与密码不匹配');
    }

    const { password: _, ...userWithoutPassword } = user;

    // Save current user to localStorage for AuthContext
    saveCurrentUser(userWithoutPassword);

    return {
      accessToken: generateMockToken(user.id),
      refreshToken: generateMockToken(user.id, 'refresh'),
      expiresAt: Date.now() + 3600 * 1000, // 1 hour
      user: userWithoutPassword,
    };
  },

  /**
   * Mock register
   */
  register: async (emailOrPhone: string, verificationCode: string, password: string) => {
    await delay(800); // Simulate network delay

    // Development mode: accept any 6-digit code
    if (!/^\d{6}$/.test(verificationCode)) {
      throw new Error('验证码格式不正确（开发模式：请输入任意6位数字）');
    }

    const users = getMockUsers();

    // Check if user already exists
    const exists = users.some((u) => u.email === emailOrPhone || u.phone === emailOrPhone);
    if (exists) {
      throw new Error('该邮箱或手机号已被注册');
    }

    // Create new user
    const newUser: MockUser = {
      id: generateId(),
      username: emailOrPhone.includes('@') ? emailOrPhone.split('@')[0] : emailOrPhone,
      email: emailOrPhone.includes('@') ? emailOrPhone : '',
      phone: emailOrPhone.includes('@') ? undefined : emailOrPhone,
      nickname: emailOrPhone.includes('@') ? emailOrPhone.split('@')[0] : emailOrPhone,
      avatar: undefined,
      englishLevel: 'beginner',
      dailyGoal: '20',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      hasCompletedOnboarding: false,
      password,
    };

    users.push(newUser);
    saveMockUsers(users);

    const { password: _, ...userWithoutPassword } = newUser;

    // Save current user to localStorage for AuthContext
    saveCurrentUser(userWithoutPassword);

    return {
      accessToken: generateMockToken(newUser.id),
      refreshToken: generateMockToken(newUser.id, 'refresh'),
      expiresAt: Date.now() + 3600 * 1000,
      user: userWithoutPassword,
    };
  },

  /**
   * Mock send verification code
   */
  sendVerificationCode: async (emailOrPhone: string) => {
    await delay(300);

    console.log('📱 ===== MOCK VERIFICATION CODE =====');
    console.log('📱 Email/Phone:', emailOrPhone);
    console.log('📱 Verification Code: ANY 6-DIGIT NUMBER');
    console.log('📱 Example: 123456');
    console.log('📱 =================================');

    return { message: '验证码已发送（开发模式：任意6位数字均可）' };
  },

  /**
   * Mock refresh token
   */
  refreshToken: async (_refreshToken: string) => {
    await delay(300);

    // In development, always return a new token
    const userId = 'mock-user-id';

    return {
      accessToken: generateMockToken(userId),
      refreshToken: generateMockToken(userId, 'refresh'),
      expiresAt: Date.now() + 3600 * 1000,
    };
  },

  /**
   * Mock get current user
   */
  getCurrentUser: async () => {
    await delay(300);

    // Try to get current user from localStorage first
    const currentUser = getCurrentUserFromStorage();
    if (currentUser) {
      return currentUser;
    }

    throw new Error('未登录');
  },

  /**
   * Mock reset password
   */
  resetPassword: async (emailOrPhone: string, verificationCode: string, newPassword: string) => {
    await delay(800);

    if (!/^\d{6}$/.test(verificationCode)) {
      throw new Error('验证码格式不正确');
    }

    const users = getMockUsers();
    const userIndex = users.findIndex(
      (u) => u.email === emailOrPhone || u.phone === emailOrPhone
    );

    if (userIndex === -1) {
      throw new Error('该邮箱或手机号未注册');
    }

    users[userIndex].password = newPassword;
    saveMockUsers(users);

    return { message: '密码重置成功' };
  },

  /**
   * Mock logout
   */
  logout: async () => {
    await delay(200);
    localStorage.removeItem(MOCK_USER_ID_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    return { message: '登出成功' };
  },
};

export const mockUserApi = {
  /**
   * Mock update preferences
   */
  updatePreferences: async (preferences: {
    englishLevel: 'beginner' | 'intermediate' | 'advanced';
    dailyGoal: '10' | '20' | '30' | '50';
  }) => {
    await delay(500);

    const currentUser = getCurrentUserFromStorage();
    if (!currentUser) {
      throw new Error('未登录');
    }

    const users = getMockUsers();
    const userIndex = users.findIndex((u) => u.id === currentUser.id);

    if (userIndex === -1) {
      throw new Error('用户不存在');
    }

    // Update user data
    users[userIndex].englishLevel = preferences.englishLevel;
    users[userIndex].dailyGoal = preferences.dailyGoal;
    users[userIndex].hasCompletedOnboarding = true;
    saveMockUsers(users);

    const { password: _, ...userWithoutPassword } = users[userIndex];

    // Update current user in localStorage
    saveCurrentUser(userWithoutPassword);

    return userWithoutPassword;
  },

  /**
   * Mock update profile
   */
  updateProfile: async (data: { nickname?: string; avatar?: string }) => {
    await delay(500);

    const currentUser = getCurrentUserFromStorage();
    if (!currentUser) {
      throw new Error('未登录');
    }

    const users = getMockUsers();
    const userIndex = users.findIndex((u) => u.id === currentUser.id);

    if (userIndex === -1) {
      throw new Error('用户不存在');
    }

    if (data.nickname) {
      users[userIndex].nickname = data.nickname;
    }
    if (data.avatar) {
      users[userIndex].avatar = data.avatar;
    }
    saveMockUsers(users);

    const { password: _, ...userWithoutPassword } = users[userIndex];

    // Update current user in localStorage
    saveCurrentUser(userWithoutPassword);

    return userWithoutPassword;
  },
};

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateMockToken(userId: string, type: 'access' | 'refresh' = 'access') {
  const payload = {
    userId,
    type,
    exp: type === 'access' ? Date.now() + 3600 * 1000 : Date.now() + 7 * 24 * 3600 * 1000,
  };
  return btoa(JSON.stringify(payload)); // Simple base64 encoding for mock
}

// Save user ID when they log in/register (to be called from auth methods)
// Note: This is now handled automatically by saveCurrentUser()
export function setMockUserId(_userId: string) {
  // Deprecated: saveCurrentUser() handles this now
  console.warn('setMockUserId is deprecated, using saveCurrentUser instead');
}
