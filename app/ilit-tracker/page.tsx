"use client";
import React, { Suspense } from 'react';
import { ILITTracker } from '../../components/ilit-tracker';

export default function ILITTrackerPage() {
  return (
    <main>
      <Suspense fallback={<div>Loading ILIT Tracker…</div>}>
        <ILITTracker />
      </Suspense>
    </main>
  );
}
