"use client";
import React from 'react';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={(props.className ?? '') + ' border px-2 py-1 rounded w-full'} />;
}
