// src/pages/StudentSettings.jsx
import React, { useState, useEffect } from 'react';
import { Settings, Save, Mail, Shield, Bell, Loader2 } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const StudentSettings = () => {
  const { user } = useAuth();
  const settingsKey = user?.id ? `student_settings_${user.id}` : 'student_settings_guest';

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [profilePrivacy, setProfilePrivacy] = useState(true);
  
  const [saving, setSaving] = useState(false);

  // Load preferences from localStorage when user is identified
  useEffect(() => {
    try {
      const saved = localStorage.getItem(settingsKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.emailNotifications === 'boolean') {
          setEmailNotifications(parsed.emailNotifications);
        }
        if (typeof parsed.smsNotifications === 'boolean') {
          setSmsNotifications(parsed.smsNotifications);
        }
        if (typeof parsed.profilePrivacy === 'boolean') {
          setProfilePrivacy(parsed.profilePrivacy);
        }
      }
    } catch (e) {
      console.error('Failed to load settings from localStorage', e);
    }
  }, [settingsKey]);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      try {
        const preferences = {
          emailNotifications,
          smsNotifications,
          profilePrivacy
        };
        localStorage.setItem(settingsKey, JSON.stringify(preferences));
        setSaving(false);
        toast.success('Account preferences saved successfully!');
      } catch (err) {
        setSaving(false);
        console.error('Failed to save settings', err);
        toast.error('Failed to save preferences.');
      }
    }, 800);
  };

  return (
    <PageContainer>
      <div className="max-w-[900px] mx-auto flex flex-col gap-stack-lg animate-in fade-in duration-300">
        
        {/* Header Section */}
        <header className="flex flex-col gap-stack-sm">
          <div className="flex items-center gap-stack-sm text-primary">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Settings</h1>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Manage your account preferences, notification parameters, and privacy settings.</p>
        </header>

        {/* Settings Container Panel */}
        <form onSubmit={handleSave} className="security-shadow glass-effect rounded-xl overflow-hidden bg-surface-container-lowest p-8 flex flex-col gap-8 border border-outline-variant max-w-2xl">
          
          {/* Notifications Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/30 pb-2">
              <Bell className="w-5 h-5 shrink-0" />
              <h3 className="font-label-md text-label-md uppercase tracking-wider text-on-surface">Notification Preferences</h3>
            </div>
            
            <div className="flex flex-col gap-3 font-body-md text-on-surface-variant text-sm mt-2">
              <label className="inline-flex items-center cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={emailNotifications} 
                  onChange={e => setEmailNotifications(e.target.checked)}
                  className="form-checkbox h-4.5 w-4.5 rounded border-outline-variant text-primary focus:ring-primary/20 focus:ring-offset-0 transition-colors" 
                />
                <span className="ml-3 group-hover:text-primary transition-colors">Receive email alerts for warden announcements</span>
              </label>

              <label className="inline-flex items-center cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={smsNotifications} 
                  onChange={e => setSmsNotifications(e.target.checked)}
                  className="form-checkbox h-4.5 w-4.5 rounded border-outline-variant text-primary focus:ring-primary/20 focus:ring-offset-0 transition-colors" 
                />
                <span className="ml-3 group-hover:text-primary transition-colors">Receive urgent SMS updates on registered mobile number</span>
              </label>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary border-b border-outline-variant/30 pb-2">
              <Shield className="w-5 h-5 shrink-0" />
              <h3 className="font-label-md text-label-md uppercase tracking-wider text-on-surface">Privacy Preferences</h3>
            </div>

            <div className="flex flex-col gap-3 font-body-md text-on-surface-variant text-sm mt-2">
              <label className="inline-flex items-center cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={profilePrivacy} 
                  onChange={e => setProfilePrivacy(e.target.checked)}
                  className="form-checkbox h-4.5 w-4.5 rounded border-outline-variant text-primary focus:ring-primary/20 focus:ring-offset-0 transition-colors" 
                />
                <span className="ml-3 group-hover:text-primary transition-colors">Allow roommates to view email & phone details</span>
              </label>
              <p className="text-xs text-secondary font-label-sm leading-relaxed max-w-lg mt-1">
                Your name and allocated seat occupancy remain authorized and visible within the room details panel to roommates at all times.
              </p>
            </div>
          </div>

          {/* Form Action save button */}
          <div className="flex justify-end pt-4 border-t border-outline-variant/20">
            <button 
              type="submit"
              disabled={saving}
              className={`w-full md:w-auto text-white font-label-md text-label-md px-8 py-3.5 rounded-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all group ${
                saving 
                  ? 'bg-rose-400 cursor-not-allowed opacity-80' 
                  : 'bg-portal-primary hover:bg-portal-primary/95 shadow-portal-primary/20 hover:scale-[1.01]'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 shrink-0 text-white" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </PageContainer>
  );
};

export default StudentSettings;
