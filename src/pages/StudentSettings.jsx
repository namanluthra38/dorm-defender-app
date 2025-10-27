import React from 'react';

const StudentSettings = () => {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-gray-500">Account and notification settings</p>
      </div>

      <div className="bg-white border rounded-md p-4 max-w-2xl space-y-4">
        <div>
          <p className="text-sm text-gray-500">Notifications</p>
          <div className="mt-2 flex items-center gap-3">
            <label className="inline-flex items-center">
              <input type="checkbox" className="form-checkbox" defaultChecked />
              <span className="ml-2">Email notifications</span>
            </label>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">Privacy</p>
          <div className="mt-2 text-sm text-gray-700">Manage your privacy preferences</div>
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-2 bg-sky-500 text-white rounded-md">Save Settings</button>
        </div>
      </div>
    </div>
  );
};

export default StudentSettings;
