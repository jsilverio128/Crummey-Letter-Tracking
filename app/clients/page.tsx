"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalData } from '../../hooks/use-portal-data';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Table, THead, TBody } from '../../components/ui/table';

function formatCurrency(amount?: number) {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount);
}

export default function ClientsPage() {
  const { clients } = usePortalData();
  const router = useRouter();
  const [sortBy, setSortBy] = useState<'name' | 'premium' | 'count'>('name');

  const sorted = [...clients].sort((a, b) => {
    if (sortBy === 'name') return a.insuredName.localeCompare(b.insuredName);
    if (sortBy === 'count') return b.policyCount - a.policyCount;
    if (sortBy === 'premium') return (b.totalPremium || 0) - (a.totalPremium || 0);
    return 0;
  });

  const totalClients = clients.length;
  const totalPolicies = clients.reduce((sum, c) => sum + c.policyCount, 0);
  const totalPremiums = clients.reduce((sum, c) => sum + (c.totalPremium || 0), 0);
  const totalUpcoming = clients.reduce((sum, c) => sum + c.upcomingPremiums.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Clients</h2>
        <p className="text-gray-600 text-sm">Overview of all insured persons and their policies</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{totalClients}</div>
          <div className="text-xs text-gray-600 mt-1">Total Clients</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-slate-900">{totalPolicies}</div>
          <div className="text-xs text-gray-600 mt-1">Total Policies</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPremiums)}</div>
          <div className="text-xs text-gray-600 mt-1">Total Premiums</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">{totalUpcoming}</div>
          <div className="text-xs text-gray-600 mt-1">Upcoming (60d)</div>
        </Card>
      </div>

      {/* Clients Table */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Client List</h3>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="count">Sort by # Policies</option>
                <option value="premium">Sort by Premium Total</option>
              </select>
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg">No clients yet. Upload an Excel file to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <tr>
                    <th className="p-2">Insured Name</th>
                    <th className="p-2 text-center"># Policies</th>
                    <th className="p-2 text-right">Total Premium</th>
                    <th className="p-2 text-center">Upcoming (60d)</th>
                    <th className="p-2 text-center">Pending Letters</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </THead>
                <TBody>
                  {sorted.map((client) => (
                    <tr key={client.insuredName} className="border-t text-sm">
                      <td className="p-2 font-medium">{client.insuredName || 'Unknown'}</td>
                      <td className="p-2 text-center">
                        <Badge color="blue">{client.policyCount}</Badge>
                      </td>
                      <td className="p-2 text-right font-medium">{formatCurrency(client.totalPremium)}</td>
                      <td className="p-2 text-center">
                        {client.upcomingPremiums.length > 0 ? (
                          <Badge color="orange">{client.upcomingPremiums.length}</Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {client.pendingLetters.length > 0 ? (
                          <Badge color="red">{client.pendingLetters.length}</Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-2">
                        <Button
                          onClick={() => router.push(`/ilit-tracker?client=${encodeURIComponent(client.insuredName)}`)}
                          className="text-xs px-2 py-1"
                        >
                          View Policies
                        </Button>
                      </td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
