"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenueTrendPoint = {
  label: string;
  revenue: number;
};

type BookingTrendPoint = {
  label: string;
  bookings: number;
};

type CategoryPerformancePoint = {
  categoryName: string;
  revenue: number;
};

type OccupancyPoint = {
  categoryName: string;
  utilizationRate: number;
};

export function RevenueTrendChart({ data }: { data: RevenueTrendPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={24} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: unknown) => `$${(Number(value) / 100).toFixed(2)}`} />
          <Line type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={2.4} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BookingsTrendChart({ data }: { data: BookingTrendPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={24} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: unknown) => `${value}`} />
          <Bar dataKey="bookings" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryPerformanceChart({ data }: { data: CategoryPerformancePoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 10, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="categoryName" tick={{ fontSize: 12 }} width={120} />
          <Tooltip formatter={(value: unknown) => `$${(Number(value) / 100).toFixed(2)}`} />
          <Bar dataKey="revenue" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OccupancyChart({ data }: { data: OccupancyPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="categoryName" tick={{ fontSize: 12 }} minTickGap={12} />
          <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
          <Tooltip formatter={(value: unknown) => `${value}%`} />
          <Bar dataKey="utilizationRate" fill="#f59e0b" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
