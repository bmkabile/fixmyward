export enum Category {
  Infrastructure = 'Infrastructure',
  Water = 'Water & Sanitation',
  Electricity = 'Electricity',
  Waste = 'Waste Management',
  Safety = 'Safety & Security',
  Other = 'Other',
}

export enum Status {
  Reported = 'Reported',
  InProgress = 'In Progress',
  Fixed = 'Fixed',
}

export enum UserType {
  Citizen = 'Citizen',
  Councillor = 'Councillor',
}

export type User = {
  id: string;
  fullName: string;
  email: string;
  ward: string;
  userType: UserType;
  password: string;
};

export type Comment = {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
};

export type Issue = {
  id: string;
  title: string;
  description: string;
  category: Category;
  province: string;
  ward: string;
  reporterId: string;
  imageUrl: string;
  location: { lat: number; lng: number };
  dateReported: string;
  status: Status;
  likes: string[];
  comments: Comment[];
};

export type AppContextType = {
  currentUser: User | null;
  issues: Issue[];
  selectedIssueId: string | null;
  screen: 'splash' | 'auth' | 'home' | 'reportIssue' | 'issueDetail' | 'dashboard' | 'profile';
  navigate: (screen: AppContextType['screen'], issueId?: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  signUp: (userData: Omit<User, 'id'>) => Promise<boolean>;
  logout: () => void;
  addIssue: (issueData: Omit<Issue, 'id' | 'reporterId' | 'dateReported' | 'status' | 'likes' | 'comments'>) => void;
  updateIssueStatus: (issueId: string, status: Status) => void;
  toggleLike: (issueId: string) => void;
  addComment: (issueId: string, text: string) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  demographics: Record<string, { population: number; households: number }>;
};
