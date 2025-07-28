'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Edit3, 
  Mail, 
  Calendar,
  Check,
  X
} from 'lucide-react';
import { useUserStore, UserProfile } from '@/stores/userStore';
import { useSession } from 'next-auth/react';

interface ProfileHeaderProps {
  className?: string;
}

export default function ProfileHeader({ className }: ProfileHeaderProps) {
  const session = useSession();
  const userData = session.data?.user;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { profile, setProfile, updateAvatar } = useUserStore();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // profile이 undefined인 경우를 대비한 안전장치
  if (!profile) {
    return (
      <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">프로필을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  const handleEditStart = () => {
    setEditedName(userData?.name || '');
    setEditedEmail(userData?.email || '');
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    setIsUpdating(true);
    
    // 실제 구현에서는 서버 API 호출
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setProfile({
      name: editedName,
      email: editedEmail,
    });
    
    setIsEditing(false);
    setIsUpdating(false);
  };

  const handleEditCancel = () => {
    setEditedName(userData?.name || '');
    setEditedEmail(userData?.email || '');
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updateAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (date: Date) => {
    if (!isClient) return '로딩 중...';
    
    try {
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(date));
    } catch (error) {
      return '날짜 오류';
    }
  };

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-lg border border-border p-6 ${className}`}
    >
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar Section */}
        <div className="flex-shrink-0">
          <div className="relative">
            <button
              onClick={handleAvatarClick}
              className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-colors group"
            >
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xl font-semibold">
                  {getInitials(userData?.name || '')}
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </button>
            
            {/* Camera Icon Badge */}
            {isEditing && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                <Camera className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-4">
              {/* Name Input */}
              <div>
                {/* <label className="block text-sm font-medium text-muted-foreground mb-1">
                  이름
                </label> */}
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="이름을 입력해주세요"
                />
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{userData?.email || '이메일 없음'}</span>
              </div>

              {/* Email Input */}
              {/* <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  value={editedEmail}
                  onChange={(e) => setEditedEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="이메일을 입력해주세요"
                />
              </div> */}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEditSave}
                  disabled={isUpdating || !editedName.trim() || !editedEmail.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isUpdating ? '저장 중...' : '저장'}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleEditCancel}
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-accent disabled:opacity-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  취소
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Name and Edit Button */}
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground">
                  {userData?.name || '사용자'}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleEditStart}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                  aria-label="프로필 편집"
                >
                  <Edit3 className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{userData?.email || '이메일 없음'}</span>
              </div>

              {/* Join Date */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {userData?.created_at
                    ? `${formatDate(new Date(userData.created_at))} 가입`
                    : '가입일 정보 없음'}
                </span>
              </div>

              {/* Last Login */}
              {/* <div className="text-xs text-muted-foreground">
                마지막 접속: {formatDate(profile.lastLoginAt)}
              </div> */}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}