"use client";
import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/use-settings';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToaster } from '../../components/ui/toaster';

export default function SettingsPage() {
  const { reminderLeadDays, updateReminderLeadDays, isLoaded } = useSettings();
  const [localLeadDays, setLocalLeadDays] = useState<number>(reminderLeadDays);
  const [isSaved, setIsSaved] = useState(false);
  const toaster = useToaster();

  useEffect(() => {
    if (isLoaded) {
      setLocalLeadDays(reminderLeadDays);
    }
  }, [reminderLeadDays, isLoaded]);

  function handleSaveSettings() {
    if (localLeadDays < 1) {
      toaster.push({
        id: Date.now().toString(),
        message: 'Lead time must be at least 1 day',
        type: 'error'
      });
      return;
    }

    updateReminderLeadDays(localLeadDays);
    setIsSaved(true);
    toaster.push({
      id: Date.now().toString(),
      message: `Reminder lead time set to ${localLeadDays} days`,
      type: 'success'
    });

    // Reset the "saved" indicator after 3 seconds
    setTimeout(() => setIsSaved(false), 3000);
  }

  function handleReset() {
    setLocalLeadDays(reminderLeadDays);
    setIsSaved(false);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
        <p className="text-gray-600 mt-2">Configure app preferences and reminder settings.</p>
      </div>

      {/* Reminders Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">📅 Reminder Settings</h3>
        
        <div className="space-y-6">
          {/* Lead Days Setting */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Crummey Letter Lead Time
            </label>
            <p className="text-xs text-gray-600 mb-3">
              How many days before a premium is due should we remind you to send a Crummey letter?
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={localLeadDays}
                  onChange={e => {
                    const val = parseInt(e.currentTarget.value);
                    if (!isNaN(val)) setLocalLeadDays(val);
                  }}
                  className="w-24"
                />
                <span className="text-sm text-gray-700 font-medium">days</span>
              </div>
              <div className="ml-4 p-3 bg-white border border-gray-200 rounded">
                <p className="text-xs text-gray-600">Current setting:</p>
                <p className="text-lg font-bold text-slate-900">{localLeadDays} days</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 Example: If set to 35 days and a premium is due on March 20, you'll be reminded on February 13.
            </p>
          </div>

          {/* How It Works */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-amber-900 mb-2">How This Works</h4>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>✓ When you import a new Excel file, the lead time is used to calculate "when to send Crummey letter"</li>
              <li>✓ If a Crummey send date is already in your file, that date is used instead</li>
              <li>✓ The Reminders page shows letters that need to be sent based on this setting</li>
              <li>✓ Changing this setting only affects future imports, not existing records</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSaveSettings}
              className={`${
                isSaved
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isSaved ? '✓ Saved' : 'Save Settings'}
            </Button>
            {localLeadDays !== reminderLeadDays && (
              <Button
                onClick={handleReset}
                className="bg-gray-400 hover:bg-gray-500 text-white"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Information Section */}
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-gray-50">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">ℹ️ About These Settings</h3>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-slate-900 mb-1">Storage</h4>
            <p>Settings are stored locally in your browser. They persist even after closing the app.</p>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-1">Future Updates</h4>
            <p>More settings will be added here, including email notifications and other preferences.</p>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-1">Data</h4>
            <p>Settings are stored privately in your browser. No data is sent to any server.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
