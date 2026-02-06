import React from 'react';
import { Card } from '../../components/ui/card';

export default function RemindersPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Reminders</h2>
      <Card className="p-8 text-center text-gray-500">
        <p className="text-lg">🚀 Coming next</p>
        <p className="text-sm mt-2">Reminder management features are coming soon.</p>
      </Card>
    </div>
  );
}
