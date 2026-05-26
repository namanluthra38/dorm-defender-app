
import React, { useState, useEffect } from 'react';
import { useWardenAuth } from '@/contexts/WardenAuthContext';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

const WardenSettings = () => {
  const { user } = useWardenAuth();
  const settingsKey = user?.id ? `warden_settings_${user.id}` : 'warden_settings_guest';

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [autoApproveLowImpact, setAutoApproveLowImpact] = useState(false);
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
        if (typeof parsed.autoApproveLowImpact === 'boolean') {
          setAutoApproveLowImpact(parsed.autoApproveLowImpact);
        }
      }
    } catch (e) {
      console.error('Failed to load warden settings from localStorage', e);
    }
  }, [settingsKey]);

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      try {
        const preferences = {
          emailNotifications,
          smsNotifications,
          autoApproveLowImpact
        };
        localStorage.setItem(settingsKey, JSON.stringify(preferences));
        setSaving(false);
        toast.success('Warden preferences saved successfully!');
      } catch (err) {
        setSaving(false);
        console.error('Failed to save settings', err);
        toast.error('Failed to save preferences.');
      }
    }, 800);
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-on-surface">Settings</h2>
        <p className="text-sm text-on-surface-variant">Account and notification settings for wardens</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 max-w-2xl space-y-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-on-surface border-b border-outline-variant/30 pb-2 mb-3">Notifications</p>
          <div className="flex flex-col gap-3">
            <label className="inline-flex items-center cursor-pointer group text-sm text-on-surface-variant">
              <input 
                type="checkbox" 
                checked={emailNotifications} 
                onChange={e => setEmailNotifications(e.target.checked)} 
                className="form-checkbox h-4.5 w-4.5 rounded border-outline-variant text-primary focus:ring-primary/20 focus:ring-offset-0 transition-colors" 
              />
              <span className="ml-3 group-hover:text-primary transition-colors">Email notifications for complaints and leaves</span>
            </label>

            <label className="inline-flex items-center cursor-pointer group text-sm text-on-surface-variant">
              <input 
                type="checkbox" 
                checked={smsNotifications} 
                onChange={e => setSmsNotifications(e.target.checked)} 
                className="form-checkbox h-4.5 w-4.5 rounded border-outline-variant text-primary focus:ring-primary/20 focus:ring-offset-0 transition-colors" 
              />
              <span className="ml-3 group-hover:text-primary transition-colors">SMS notifications for urgent/high-priority complaints</span>
            </label>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-on-surface border-b border-outline-variant/30 pb-2 mb-3">Preferences</p>
          <div className="flex items-center">
            <label className="inline-flex items-center cursor-pointer group text-sm text-on-surface-variant">
              <input 
                type="checkbox" 
                checked={autoApproveLowImpact} 
                onChange={e => setAutoApproveLowImpact(e.target.checked)} 
                className="form-checkbox h-4.5 w-4.5 rounded border-outline-variant text-primary focus:ring-primary/20 focus:ring-offset-0 transition-colors" 
              />
              <span className="ml-3 group-hover:text-primary transition-colors">Auto-approve low impact requests (e.g. extension of stay)</span>
            </label>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-on-surface border-b border-outline-variant/30 pb-2 mb-2">Security</p>
          <div className="text-xs text-secondary font-label-sm leading-relaxed">To change your password, use the account page or contact admin.</div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-outline-variant/20">
          <button 
            onClick={save} 
            disabled={saving}
            className={`px-6 py-2.5 rounded-lg text-white font-medium text-sm flex items-center gap-2 shadow-lg active:scale-[0.98] transition-all ${
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
          <button 
            onClick={() => window.location.reload()} 
            className="px-5 py-2.5 rounded-lg border border-outline-variant text-sm font-medium text-on-surface-variant hover:bg-surface-variant/10 active:scale-[0.98] transition-all"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default WardenSettings;

