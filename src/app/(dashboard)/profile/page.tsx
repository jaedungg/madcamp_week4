'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Download, 
  AlertTriangle, 
  Key,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Smartphone
} from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PlanCard from '@/components/profile/PlanCard';
import StatsCard from '@/components/profile/StatsCard';
import SettingsSection, { 
  SettingItem, 
  SettingButton,
  SettingInput
} from '@/components/settings/SettingsSection';
import Toggle from '@/components/settings/Toggle';
import { useUserStore } from '@/stores/userStore';
import { signOut, useSession } from 'next-auth/react';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const userId = session?.user?.id;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords_1, setShowPasswords_1] = useState(false);
  const [showPasswords_2, setShowPasswords_2] = useState(false);
  const [showPasswords_3, setShowPasswords_3] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { 
    twoFactorEnabled, 
    setTwoFactorEnabled, 
    exportUserData, 
    requestAccountDeletion 
  } = useUserStore();

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
  
    setIsChangingPassword(true);
  
    try {
      const res = await fetch(`/api/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        alert(data.error || '비밀번호 변경에 실패했습니다.');
      } else {
        alert(data.message || '비밀번호가 성공적으로 변경되었습니다.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('')
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsChangingPassword(false);
    }
  };
  

  const handleExportData = async () => {
    setIsExporting(true);
    
    try {
      const blob = await exportUserData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `from-user-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('데이터 내보내기에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'applicaiton/json',
        },
      })

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '계정 삭제 요청이 실패했습니다.');
      } else {
        alert(data.message || '계정이 삭제되었습니다.');
        
        await signOut({ callbackUrl: '/login' });
      }

      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">프로필</h1>
          <p className="text-muted-foreground mt-1">
            계정 정보와 보안 설정을 관리하세요
          </p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Profile Header */}
          <ProfileHeader />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column */}
            <div className="space-y-6">
              {/* Plan Information */}
              <PlanCard userId={userId}/>

              {/* Password Change */}
              <SettingsSection
                title="비밀번호 변경"
                description="정기적으로 비밀번호를 변경하여 보안을 유지하세요"
              >
                <SettingItem
                  label="현재 비밀번호"
                  direction="vertical"
                >
                  <div className="relative">
                    <SettingInput
                      type={showPasswords_1 ? "text" : "password"}
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      placeholder="현재 비밀번호를 입력하세요"
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords_1(!showPasswords_1)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords_1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </SettingItem>

                <SettingItem
                  label="새 비밀번호"
                  direction="vertical"
                >
                  <div className="relative">
                    <SettingInput
                      type={showPasswords_2 ? "text" : "password"}
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder="새 비밀번호를 입력하세요"
                      className="w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords_2(!showPasswords_2)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords_2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </SettingItem>

                <SettingItem
                  label="비밀번호 확인"
                  direction="vertical"
                >
                  <div className="relative">
                    <SettingInput
                      type={showPasswords_3 ? "text" : "password"}
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="새 비밀번호를 다시 입력하세요"
                      className="w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords_3(!showPasswords_3)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPasswords_3 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </SettingItem>

                <div className="pt-2">
                  <SettingButton
                    onClick={handlePasswordChange}
                    variant="primary"
                    loading={isChangingPassword}
                    disabled={!currentPassword || !newPassword || !confirmPassword}
                    className="flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
                  </SettingButton>
                </div>
              </SettingsSection>

              {/* Danger Zone */}
              <SettingsSection
                title="위험 구역"
                description="신중하게 진행해주세요"
                className="border-red-200 dark:border-red-800"
                headerClassName="text-red-600 dark:text-red-400"
              >
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <h5 className="font-medium text-red-800 dark:text-red-200 mb-1">
                        계정 삭제
                      </h5>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                        계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 
                        이 작업은 되돌릴 수 없습니다.
                      </p>
                      
                      {showDeleteConfirm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mb-3 p-3 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 rounded"
                        >
                          <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                            정말로 계정을 삭제하시겠습니까?
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.
                          </p>
                        </motion.div>
                      )}
                      
                      <div className="flex gap-2">
                        <SettingButton
                          onClick={handleDeleteAccount}
                          variant="danger"
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          {showDeleteConfirm ? '확인: 계정 삭제' : '계정 삭제'}
                        </SettingButton>
                        
                        {showDeleteConfirm && (
                          <SettingButton
                            onClick={() => setShowDeleteConfirm(false)}
                            variant="secondary"
                          >
                            취소
                          </SettingButton>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </SettingsSection>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Activity Statistics */}
              <StatsCard/>

              {/* Data Management */}
              <SettingsSection
                title="데이터 관리"
                description="개인 데이터를 관리하고 제어하세요"
              >
                <SettingItem
                  label="내 데이터 내보내기"
                  description="작성한 문서와 설정을 JSON 파일로 다운로드합니다"
                  direction="vertical"
                >
                  <SettingButton
                    onClick={handleExportData}
                    variant="secondary"
                    loading={isExporting}
                    className="flex items-center gap-2 w-full"
                  >
                    <Download className="w-4 h-4" />
                    {isExporting ? '내보내는 중...' : '데이터 내보내기'}
                  </SettingButton>
                </SettingItem>
              </SettingsSection>


            </div>

          </div>
        </div>
      </div>
    </div>
  );
}