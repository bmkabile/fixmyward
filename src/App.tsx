'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppContextType, Issue, User, UserType, Status, Category } from './types';
import { v4 as uuidv4 } from 'uuid';

// Mock data
const mockUsers: User[] = [
  { id: '1', fullName: 'John Citizen', email: 'john@ward.co.za', ward: 'Ward 5', userType: UserType.Citizen, password: '123' },
  { id: '2', fullName: 'Cllr. Maria', email: 'maria@council.co.za', ward: 'Ward 5', userType: UserType.Councillor, password: '123' },
];

const mockIssues: Issue[] = [
  {
    id: '1',
    title: 'Pothole on Main Road',
    description: 'Large pothole causing accidents',
    category: Category.Infrastructure,
    province: 'Eastern Cape',
    ward: 'Ward 5',
    reporterId: '1',
    imageUrl: 'https://picsum.photos/800/600?random=1',
    location: { lat: -33.9249, lng: 18.4241 },
    dateReported: new Date().toISOString(),
    status: Status.Reported,
    likes: ['1'],
    comments: [],
  },
];

const mockDemographics: Record<string, { population: number; households: number }> = {
  'Ward 5': { population: 12500, households: 3200 },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [issues, setIssues] = useState<Issue[]>(mockIssues);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [screen, setScreen] = useState<'splash' | 'auth' | 'home' | 'reportIssue' | 'issueDetail' | 'dashboard' | 'profile'>('splash');

  const navigate = (newScreen: typeof screen, issueId?: string) => {
    setScreen(newScreen);
    if (issueId) setSelectedIssueId(issueId);
  };

  const login = async (email: string, password: string) => {
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const signUp = async (userData: Omit<User, 'id'>) => {
    const exists = mockUsers.some(u => u.email === userData.email);
    if (exists) return false;
    const newUser = { ...userData, id: uuidv4() };
    mockUsers.push(newUser);
    setCurrentUser(newUser);
    return true;
  };

  const logout = () => setCurrentUser(null);

  const addIssue = (issueData: Omit<Issue, 'id' | 'reporterId' | 'dateReported' | 'status' | 'likes' | 'comments'>) => {
    const newIssue: Issue = {
      ...issueData,
      id: uuidv4(),
      reporterId: currentUser!.id,
      dateReported: new Date().toISOString(),
      status: Status.Reported,
      likes: [],
      comments: [],
    };
    setIssues(prev => [newIssue, ...prev]);
  };

  const updateIssueStatus = (issueId: string, status: Status) => {
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status } : i));
  };

  const toggleLike = (issueId: string) => {
    if (!currentUser) return;
    setIssues(prev => prev.map(i => {
      if (i.id === issueId) {
        const likes = i.likes.includes(currentUser.id)
          ? i.likes.filter(id => id !== currentUser.id)
          : [...i.likes, currentUser.id];
        return { ...i, likes };
      }
      return i;
    }));
  };

  const addComment = async (issueId: string, text: string) => {
    const newComment = {
      id: uuidv4(),
      userId: currentUser!.id,
      text,
      timestamp: new Date().toISOString(),
    };
    setIssues(prev => prev.map(i => 
      i.id === issueId ? { ...i, comments: [...i.comments, newComment] } : i
    ));
  };

  const getUserById = (id: string) => mockUsers.find(u => u.id === id);

  return (
    <AppContext.Provider value={{
      currentUser,
      issues,
      selectedIssueId,
      screen,
      navigate,
      login,
      signUp,
      logout,
      addIssue,
      updateIssueStatus,
      toggleLike,
      addComment,
      getUserById,
      demographics: mockDemographics,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
