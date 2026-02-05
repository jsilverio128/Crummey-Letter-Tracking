"use client";
import React from 'react';

export function Table({ children }: { children: React.ReactNode }) {
  return <table className="min-w-full bg-white">{children}</table>;
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-gray-50 text-left text-sm font-medium">{children}</thead>;
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="text-sm text-gray-700">{children}</tbody>;
}
