'use client';

import React from 'react';
import { Issue, useApp } from '@/App';
import { HeartIcon, CommentIcon, ShareIcon } from './Icons';
import { StatusBadge } from './ui/StatusBadge';
import { format } from 'date-fns';

interface IssuePostProps {
  issue: Issue;
  onClick: () => void;
}

export const IssuePost: React.FC<IssuePostProps> = ({ issue, onClick }) => {
  const { currentUser, toggleLike, navigate } = useApp();

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(issue.id);
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('issueDetail', issue.id);
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
    >
      {issue.imageUrl && (
        <img src={issue.imageUrl} alt={issue.title} className="w-full h-48 object-cover" />
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg flex-1">{issue.title}</h3>
          <StatusBadge status={issue.status} />
        </div>
        <p className="text-gray-600 text-sm mb-3">{issue.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{issue.ward} • {format(new Date(issue.dateReported), 'MMM d, yyyy')}</span>
          <div className="flex gap-3">
            <button onClick={handleLike} className="flex items-center gap-1 hover:text-red-500">
              <HeartIcon className={w-4 h-4 } />
              <span>{issue.likes.length}</span>
            </button>
            <button onClick={handleComment} className="flex items-center gap-1 hover:text-blue-500">
              <CommentIcon className="w-4 h-4" />
              <span>{issue.comments.length}</span>
            </button>
            <button className="hover:text-green-500">
              <ShareIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
