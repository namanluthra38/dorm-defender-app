
import React, { useState } from 'react';

const WardenSettings = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [autoApproveLowImpact, setAutoApproveLowImpact] = useState(false);

  const save = () => {
    // placeholder: wire to API to persist settings
    alert(`Saved settings:\nEmail: ${emailNotifications}\nSMS: ${smsNotifications}\nAuto-approve: ${autoApproveLowImpact}`);
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-gray-500">Account and notification settings for wardens</p>
      </div>

      <div className="bg-white border rounded-md p-4 max-w-2xl space-y-4">
        <div>
          <p className="text-sm text-gray-500">Notifications</p>
          <div className="mt-2 flex flex-col gap-2">
            <label className="inline-flex items-center">
              <input type="checkbox" checked={emailNotifications} onChange={e => setEmailNotifications(e.target.checked)} className="form-checkbox" />
              <span className="ml-2">Email notifications</span>
            </label>

            <label className="inline-flex items-center">
              <input type="checkbox" checked={smsNotifications} onChange={e => setSmsNotifications(e.target.checked)} className="form-checkbox" />
              <span className="ml-2">SMS notifications</span>
            </label>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">Preferences</p>
          <div className="mt-2 flex items-center gap-3">
            <label className="inline-flex items-center">
              <input type="checkbox" checked={autoApproveLowImpact} onChange={e => setAutoApproveLowImpact(e.target.checked)} className="form-checkbox" />
              <span className="ml-2">Auto-approve low impact requests (e.g. extension of stay)</span>
            </label>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">Security</p>
          <div className="mt-2 text-sm text-gray-700">To change your password, use the account page or contact admin.</div>
        </div>

        <div className="flex gap-2">
          <button onClick={save} className="px-3 py-2 bg-sky-500 text-white rounded-md">Save Settings</button>
          <button onClick={() => window.location.reload()} className="px-3 py-2 rounded-md border">Reset</button>
        </div>
      </div>
    </div>
  );
};

export default WardenSettings;

