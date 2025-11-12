'use client';

import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../App';
import { AppContextType, Category, Status, User, UserType } from '../types';
import { CATEGORIES, WARDS, USER_TYPES, PROVINCES } from '../constants';
import { LogoIcon, HeartIcon, CommentIcon, ShareIcon, PlusIcon, UserCircleIcon, MapIcon, ListIcon } from '../components/Icons';
import { Button, Input, Select, StatusBadge } from '../components/ui';
import { IssuePost } from '../components/IssuePost';
import toast, { Toaster } from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// --- TIME FORMATTING UTILITY ---
function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

// --- LOCATION PICKER COMPONENT ---
interface LocationPickerProps {
    onLocation: (lat: number, lng: number) => void;
}
const LocationPicker: React.FC<LocationPickerProps> = ({ onLocation }) => {
    useMapEvents({
        click(e) {
            onLocation(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

// --- GEOGRAPHICAL MAP COMPONENT ---
const MapView: React.FC = () => {
    const appContext = useContext(AppContext);
    const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
    const [selectedWard, setSelectedWard] = useState<string | null>(null);

    const issueCountsByProvince = useMemo(() => {
        const counts: Record<string, number> = {};
        PROVINCES.forEach(p => (counts[p] = 0));
        (appContext?.issues ?? []).forEach(issue => {
            if (issue.province in counts) {
                counts[issue.province]++;
            }
        });
        return counts;
    }, [appContext?.issues]);

    const getProvinceColor = (province: string) => {
        const count = issueCountsByProvince[province];
        if (count > 2) return 'fill-red-500 hover:fill-red-600';
        if (count > 0) return 'fill-yellow-400 hover:fill-yellow-500';
        return 'fill-green-500 hover:fill-green-600';
    };

    if (selectedProvince && selectedWard) {
        const wardIssues = (appContext?.issues ?? []).filter(i => i.province === selectedProvince && i.ward === selectedWard);
        const demographics = appContext?.demographics[selectedWard];
        return (
            <div className="p-4">
                <Button variant="secondary" onClick={() => setSelectedWard(null)} className="mb-4 w-auto">
                    Back to {selectedProvince}
                </Button>
                <h2 className="text-2xl font-bold mb-4">{selectedWard} Details</h2>

                {demographics && (
                    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Ward Demographics</h3>
                        <div className="flex items-center justify-around border-t pt-2">
                            <div className="text-center">
                                <p className="text-xl font-bold text-[#007A33]">{demographics.population.toLocaleString()}</p>
                                <p className="text-sm text-gray-600">Population</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-[#007A33]">{demographics.households.toLocaleString()}</p>
                                <p className="text-sm text-gray-600">Households</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Reported Issues</h3>
                    <ul className="space-y-2">
                        {wardIssues.length > 0 ? wardIssues.map(issue => (
                            <li key={issue.id} onClick={() => appContext?.navigate('issueDetail', issue.id)} className="flex justify-between items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                                <div>
                                    <p className="font-semibold">{issue.title}</p>
                                    <p className="text-sm text-gray-500">{issue.category}</p>
                                </div>
                                <StatusBadge status={issue.status} />
                            </li>
                        )) : <p className="text-gray-500 italic">No issues reported in this ward.</p>}
                    </ul>
                </div>
            </div>
        );
    }

    if (selectedProvince) {
        const wardsInProvince = Array.from(
            new Set(
                (appContext?.issues ?? [])
                    .filter(i => i.province === selectedProvince)
                    .map(i => i.ward)
            )
        );
        return (
            <div className="p-4">
                <Button variant="secondary" onClick={() => setSelectedProvince(null)} className="mb-4 w-auto">
                    Back to South Africa Map
                </Button>
                <h2 className="text-2xl font-bold mb-4">{selectedProvince} Wards Overview</h2>
                <div className="space-y-4">
                    {wardsInProvince.map(ward => {
                        const wardIssues = (appContext?.issues ?? []).filter(i => i.ward === ward);
                        const demographics = appContext?.demographics[ward];
                        return (
                            <div
                                key={ward}
                                onClick={() => setSelectedWard(ward)}
                                className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => e.key === 'Enter' && setSelectedWard(ward)}
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold">{ward}</h3>
                                    <span className="px-3 py-1 text-sm font-semibold text-white bg-red-500 rounded-full">{wardIssues.length} Issues</span>
                                </div>
                                {demographics && (
                                    <div className="mt-2 pt-2 border-t text-sm text-gray-600 flex space-x-4">
                                        <span>Population: {demographics.population.toLocaleString()}</span>
                                        <span>Households: {demographics.households.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 text-center">
            <h2 className="text-xl font-bold mb-2">Issue Hotspots by Province</h2>
            <p className="text-sm text-gray-500 mb-4">Click a province to see ward details.</p>
            <svg viewBox="0 0 1024 890" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                {PROVINCES.map(province => (
                    <path
                        key={province}
                        d={getPathForProvince(province)}
                        className={`${getProvinceColor(province)} cursor-pointer`}
                        onClick={() => setSelectedProvince(province)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && setSelectedProvince(province)}
                    >
                        <title>{province}</title>
                    </path>
                ))}
            </svg>
        </div>
    );
};

// Mock path function – replace with real GeoJSON in production
const getPathForProvince = (province: string) => {
    const paths: Record<string, string> = {
        'Western Cape': "M412 888l-60-44-44-44-68-26-44-40-20-48 24-44 52-24 24-20-32-60-24-44 28-40 40-16 44 4 24 32 60 40 40 20 60z",
        'Northern Cape': "M472 488l-60-40-40-20-24-32-4-44 16-40 40-28 44-24 32 20 44 40 20 32-20 44-32 40-20 32z",
        'Eastern Cape': "M412 888l40-20 64-60 40-40 60-12 80-60 44-60-20-80-60-60-40-20-60 40-40 20-32 60 20 44 32 40 20-32 20-44 32-40-52 24-24 44 20 48 44 40 68 26 44 44 60 44z",
        'Free State': "M552 428l-44-40-32-20-44-24-40-28-16-40 20-40 44-20 60-4 40 4 60 20 40 20 24 20 20 40-20 40-40 20-40 20z",
        'KwaZulu-Natal': "M756 608l-44-60-80-60-60-12-40 40-64 60-40 20-40 80 20 60 60 40 80 20 88 12 40-40 40-60z",
        'Gauteng': "M692 288l-40-20-60-20-40-4-60 4-44 20-20 40 20 40 40 20 40 20 20-40 24-20 40-20 60-20 40 4 20-40z",
        'Mpumalanga': "M692 288l-20 40-40 4 20 40 40 20-24 20 20 40-20 40-40-20-60 20 40 60 40 60 44 60-20 40 20 20 40-20 40-40 60 20-40 40-20 20-40 20-20 40-20 20-40-20-40-20-40-40-20-40-20-20-40-20z",
        'North West': "M552 428l20-40 20-40 40-20 60-20 40-4 40-4 20-40-20-40-40-20-60-20-40-20-40-20-20-40 20-40-20-40 4-44 4-20 20-40 40-20z",
        'Limpopo': "M732 88l-20 40-40 20-40 20-40 20-60 20-40 20-40 20 20 40 20 40 40 4 60-4 40 4 40 20 60 20 40 20 20 40-20-20-20-40-20-60-20z",
    };
    return paths[province] || '';
};

// --- SPLASH SCREEN ---
export const SplashScreen: React.FC = () => {
    const appContext = useContext(AppContext);
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
            <LogoIcon className="h-32 w-32 mb-6" />
            <h1 className="text-4xl font-bold text-gray-900">FixMyWard</h1>
            <p className="mt-2 text-lg text-gray-600">Report. Track. Fix.</p>
            <div className="mt-12 w-full max-w-xs">
                <Button onClick={() => appContext?.navigate('auth')}>Get Started</Button>
            </div>
        </div>
    );
};

// --- AUTH SCREEN ---
export const AuthScreen: React.FC = () => {
    const appContext = useContext(AppContext);
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Sign Up State
    const [fullName, setFullName] = useState('');
    const [signUpEmail, setSignUpEmail] = useState('');
    const [signUpPassword, setSignUpPassword] = useState('');
    const [ward, setWard] = useState('');
    const [userType, setUserType] = useState<UserType>(UserType.Citizen);

    const validateEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateEmail(loginEmail)) return toast.error('Invalid email');
        setLoading(true);
        const success = await appContext?.login(loginEmail, loginPassword);
        setLoading(false);
        if (success) {
            appContext?.navigate('home');
        } else {
            toast.error('Invalid credentials');
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !validateEmail(signUpEmail) || !signUpPassword || !ward || !userType) {
            toast.error('Please fill all fields correctly');
            return;
        }
        setLoading(true);
        const success = await appContext?.signUp({
            fullName,
            email: signUpEmail,
            password: signUpPassword,
            ward,
            userType
        });
        setLoading(false);
        if (success) {
            appContext?.navigate('home');
        } else {
            toast.error('User with this email already exists.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <Toaster position="top-center" />
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <LogoIcon className="mx-auto h-16 w-auto" />
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {isLogin ? 'Sign in to your account' : 'Create a new account'}
                </h2>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
                    {isLogin ? (
                        <form className="space-y-6" onSubmit={handleLogin}>
                            <Input id="login-email" label="Email address" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                            <Input id="login-password" label="Password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSignUp}>
                            <Input id="fullName" label="Full Name" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required />
                            <Input id="signUp-email" label="Email address" type="email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} required />
                            <Input id="signUp-password" label="Password" type="password" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} required />
                            <Select id="ward" label="Ward" options={WARDS} value={ward} onChange={e => setWard(e.target.value)} required />
                            <Select id="userType" label="User Type" options={USER_TYPES} value={userType} onChange={e => setUserType(e.target.value as UserType)} required />
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Creating...' : 'Sign Up'}
                            </Button>
                        </form>
                    )}
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or</span>
                            </div>
                        </div>
                        <div className="mt-6">
                            <Button variant="secondary" onClick={() => setIsLogin(!isLogin)} disabled={loading}>
                                {isLogin ? 'Create a new account' : 'Sign in to an existing account'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- HOME SCREEN ---
export const HomeScreen: React.FC = () => {
    const appContext = useContext(AppContext);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [wardFilter, setWardFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [viewMode, setViewMode] = useState<'feed' | 'map'>('feed');
    const [showFilters, setShowFilters] = useState(false);

    const filteredIssues = useMemo(() => {
        const issues = appContext?.issues ?? [];
        return issues
            .filter(issue =>
                (!categoryFilter || issue.category === categoryFilter) &&
                (!wardFilter || issue.ward === wardFilter) &&
                (!statusFilter || issue.status === statusFilter)
            )
            .sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime());
    }, [appContext?.issues, categoryFilter, wardFilter, statusFilter]);

    if (!appContext) return <div>Loading...</div>;

    return (
        <div className="bg-gray-50 min-h-screen">
            <Toaster />
            <div className="p-4 space-y-4">
                <div className="flex justify-center bg-gray-200 rounded-lg p-1">
                    <button onClick={() => setViewMode('feed')} className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${viewMode === 'feed' ? 'bg-white shadow' : 'text-gray-600'}`}>
                        <ListIcon className="h-5 w-5 inline mr-2" /> Feed
                    </button>
                    <button onClick={() => setViewMode('map')} className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${viewMode === 'map' ? 'bg-white shadow' : 'text-gray-600'}`}>
                        <MapIcon className="h-5 w-5 inline mr-2" /> Map
                    </button>
                </div>

                {viewMode === 'feed' && (
                    <>
                        <button onClick={() => setShowFilters(!showFilters)} className="md:hidden w-full py-2 bg-white rounded-lg shadow text-sm font-medium">
                            {showFilters ? 'Hide' : 'Show'} Filters
                        </button>
                        <div className={`${showFilters ? 'block' : 'hidden'} md:block md:space-x-4 space-y-4 md:space-y-0`}>
                            <Select label="Category" options={CATEGORIES} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} />
                            <Select label="Ward" options={WARDS} value={wardFilter} onChange={e => setWardFilter(e.target.value)} />
                            <Select label="Status" options={Object.values(Status)} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} />
                        </div>
                    </>
                )}
            </div>

            {viewMode === 'feed' ? (
                <div className="p-4 space-y-6">
                    {filteredIssues.map(issue => (
                        <IssuePost key={issue.id} issue={issue} appContext={appContext} />
                    ))}
                </div>
            ) : (
                <MapView />
            )}

            <button
                onClick={() => appContext.navigate('reportIssue')}
                className="fixed bottom-6 right-6 bg-[#FFD100] text-black h-16 w-16 rounded-full shadow-lg flex items-center justify-center transition-transform transform hover:scale-110 active:scale-95 z-20"
                aria-label="Report New Issue"
            >
                <PlusIcon className="h-8 w-8" />
            </button>
        </div>
    );
};

// --- REPORT ISSUE SCREEN ---
export const ReportIssueScreen: React.FC = () => {
    const appContext = useContext(AppContext);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<Category>(Category.Other);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [province, setProvince] = useState('');

    useEffect(() => {
        if (image) {
            const url = URL.createObjectURL(image);
            setImagePreview(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [image]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !category || !image || !location || !province) {
            toast.error('Please complete all fields and pin a location.');
            return;
        }

        const imageUrl = imagePreview; // In real app: upload to server

        appContext?.addIssue({
            title,
            description,
            category,
            province,
            ward: appContext.currentUser?.ward || 'Unknown',
            imageUrl,
            location,
        });
        toast.success('Issue reported!');
        appContext?.navigate('home');
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Toaster />
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input id="title" label="Title" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Pothole on Main St" required />
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea id="description" rows={4} value={description} onChange={e => setDescription(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#007A33] focus:border-[#007A33] sm:text-sm" placeholder="Provide details about the issue" required />
                </div>
                <Select id="category" label="Category" options={CATEGORIES} value={category} onChange={e => setCategory(e.target.value as Category)} required />
                <Select id="province" label="Province" options={PROVINCES} value={province} onChange={e => setProvince(e.target.value)} required />
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                    <input type="file" accept="image/*" onChange={e => e.target.files && setImage(e.target.files[0])} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-[#007A33] hover:file:bg-green-100" required />
                    {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 h-48 w-full object-cover rounded-md" />}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <div className="h-64 rounded-md overflow-hidden">
                        <MapContainer center={[-28.0473, 24.0]} zoom={5} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            {location && <Marker position={[location.lat, location.lng]} />}
                            <LocationPicker onLocation={(lat, lng) => setLocation({ lat, lng })} />
                        </MapContainer>
                    </div>
                    {location && <p className="mt-1 text-sm text-green-600">Location pinned!</p>}
                </div>
                <Button type="submit">Submit Report</Button>
            </form>
        </div>
    );
};

// --- ISSUE DETAIL SCREEN ---
export const IssueDetailScreen: React.FC = () => {
    const appContext = useContext(AppContext);
    const [newComment, setNewComment] = useState("");
    const issue = appContext?.issues.find(i => i.id === appContext.selectedIssueId);

    if (!issue || !appContext) return <div className="p-6">Issue not found.</div>;

    const { currentUser, updateIssueStatus, toggleLike, addComment, getUserById } = appContext;
    const isLiked = currentUser ? issue.likes.includes(currentUser.id) : false;
    const reporter = getUserById(issue.reporterId);

    const handleUpdateStatus = (status: Status) => {
        updateIssueStatus(issue.id, status);
        toast.success(`Status updated to ${status}`);
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        await addComment(issue.id, newComment);
        setNewComment("");
        toast.success('Comment added');
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            await navigator.share({ title: issue.title, url });
        } else {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied!');
        }
    };

    return (
        <div className="bg-white min-h-screen">
            <Toaster />
            <img src={issue.imageUrl} alt={issue.title} className="w-full h-64 object-cover" />
            <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <UserCircleIcon className="h-10 w-10 text-gray-400" />
                    <div>
                        <p className="font-bold">{reporter?.fullName || 'Anonymous'}</p>
                        <p className="text-sm text-gray-500">
                            {timeAgo(issue.dateReported)} in {issue.ward}, {issue.province}
                        </p>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">{issue.title}</h1>
                    <StatusBadge status={issue.status} />
                </div>
                <p className="mt-4 text-gray-700">{issue.description}</p>

                <div className="mt-6 flex items-center justify-around border-y py-3">
                    <button onClick={() => currentUser ? toggleLike(issue.id) : toast.error("Please log in.")} className={`flex items-center space-x-2 font-semibold transition-colors ${isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}>
                        <HeartIcon className={`h-7 w-7 ${isLiked ? 'fill-current' : ''}`} />
                        <span>{issue.likes.length}</span>
                    </button>
                    <div className="flex items-center space-x-2 text-gray-600 font-semibold">
                        <CommentIcon className="h-7 w-7" />
                        <span>{issue.comments.length}</span>
                    </div>
                    <button onClick={handleShare} className="flex items-center space-x-2 text-gray-600 font-semibold hover:text-green-600">
                        <ShareIcon className="h-7 w-7" />
                        <span>Share</span>
                    </button>
                </div>

                {currentUser?.userType === UserType.Councillor && currentUser.ward === issue.ward && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Update Status</h3>
                        <div className="flex space-x-2 flex-wrap">
                            {Object.values(Status).map(s => (
                                <Button key={s} variant={issue.status === s ? 'primary' : 'secondary'} onClick={() => handleUpdateStatus(s)} className="flex-1 min-w-[80px] mt-1">
                                    {s}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Comments</h3>
                    <div className="space-y-4">
                        {issue.comments.map(comment => {
                            const user = getUserById(comment.userId);
                            return (
                                <div key={comment.id} className="flex items-start space-x-3">
                                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                                    <div className="flex-1 bg-gray-100 rounded-lg px-4 py-2">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-sm">{user?.fullName || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{timeAgo(comment.timestamp)}</p>
                                        </div>
                                        <p className="text-sm text-gray-800">{comment.text}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {currentUser && (
                        <div className="mt-6 flex space-x-3">
                            <UserCircleIcon className="h-10 w-10 text-gray-400" />
                            <Input id="newComment" label="" type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1" onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
                            <Button onClick={handleAddComment} className="w-auto">Post</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- DASHBOARD & PROFILE (unchanged logic, just optimized) ---
export const DashboardScreen: React.FC = () => {
    const appContext = useContext(AppContext);
    const councillor = appContext?.currentUser;

    if (!councillor || councillor.userType !== UserType.Councillor) {
        return <div className="p-6">Access Denied.</div>;
    }

    const stats = useMemo(() => {
        const wardIssues = appContext.issues.filter(i => i.ward === councillor.ward);
        return {
            total: wardIssues.length,
            fixed: wardIssues.filter(i => i.status === Status.Fixed).length,
            inProgress: wardIssues.filter(i => i.status === Status.InProgress).length,
            reported: wardIssues.filter(i => i.status === Status.Reported).length,
            viral: [...wardIssues].sort((a, b) => (b.likes.length + b.comments.length) - (a.likes.length + a.comments.length)).slice(0, 5),
        };
    }, [appContext.issues, councillor.ward]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen space-y-8">
            <Toaster />
            <h2 className="text-2xl font-bold">Dashboard for {councillor.ward}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white p-4 rounded-lg shadow"><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-gray-500">Total</p></div>
                <div className="bg-white p-4 rounded-lg shadow"><p className="text-2xl font-bold text-[#007A33]">{stats.fixed}</p><p className="text-sm text-gray-500">Fixed</p></div>
                <div className="bg-white p-4 rounded-lg shadow"><p className="text-2xl font-bold text-[#FFD100]">{stats.inProgress}</p><p className="text-sm text-gray-500">In Progress</p></div>
                <div className="bg-white p-4 rounded-lg shadow"><p className="text-2xl font-bold text-[#EF3340]">{stats.reported}</p><p className="text-sm text-gray-500">Outstanding</p></div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold mb-4">Top Viral Issues</h3>
                <ul className="space-y-2">
                    {stats.viral.map(issue => (
                        <li key={issue.id} onClick={() => appContext.navigate('issueDetail', issue.id)} className="flex justify-between items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                            <div><p className="font-semibold">{issue.title}</p><p className="text-sm text-gray-500">{issue.ward}</p></div>
                            <div className="flex items-center space-x-4">
                                <span className="flex items-center text-sm"><HeartIcon className="h-4 w-4 mr-1"/> {issue.likes.length}</span>
                                <span className="flex items-center text-sm"><CommentIcon className="h-4 w-4 mr-1"/> {issue.comments.length}</span>
                                <StatusBadge status={issue.status} />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export const ProfileScreen: React.FC = () => {
    const appContext = useContext(AppContext);
    const user = appContext?.currentUser;
    if (!user || !appContext) return null;

    const myIssues = useMemo(() => appContext.issues.filter(i => i.reporterId === user.id), [appContext.issues, user.id]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen space-y-6">
            <Toaster />
            <div className="bg-white p-6 rounded-lg shadow text-center">
                <UserCircleIcon className="h-24 w-24 mx-auto text-gray-400" />
                <h2 className="text-2xl font-bold mt-4">{user.fullName}</h2>
                <p className="text-gray-600">{user.email}</p>
                <p className="mt-2 inline-block bg-gray-200 text-gray-800 text-sm font-semibold mr-2 px-2.5 py-0.5 rounded-full">{user.ward}</p>
                <p className="mt-1 inline-block bg-green-100 text-[#007A33] text-sm font-semibold mr-2 px-2.5 py-0.5 rounded-full">{user.userType}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold mb-4">My Reported Issues ({myIssues.length})</h3>
                <ul className="space-y-2">
                    {myIssues.map(issue => (
                        <li key={issue.id} onClick={() => appContext.navigate('issueDetail', issue.id)} className="flex justify-between items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                            <div><p className="font-semibold">{issue.title}</p><p className="text-sm text-gray-500">{new Date(issue.dateReported).toLocaleDateString()}</p></div>
                            <StatusBadge status={issue.status} />
                        </li>
                    ))}
                </ul>
            </div>

            {user.userType === UserType.Councillor && (
                <Button variant="primary" onClick={() => appContext.navigate('dashboard')}>
                    View My Ward Dashboard
                </Button>
            )}

            <Button variant="danger" onClick={appContext.logout}>Logout</Button>
        </div>
    );
};