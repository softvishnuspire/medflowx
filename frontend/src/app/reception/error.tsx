'use client';

import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, AlertTriangle, KeyRound, RefreshCw } from 'lucide-react';

interface ReceptionErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ReceptionError({ error, reset }: ReceptionErrorProps) {
  useEffect(() => {
    console.error('Reception Panel Error Boundary:', error);
  }, [error]);

  const isConfigError = 
    error.message?.includes('Database not configured') ||
    error.message?.includes('NEXT_PUBLIC_SUPABASE_URL') ||
    error.message?.includes('anon key');

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-zinc-50/50 min-h-screen">
      {isConfigError ? (
        <Card className="max-w-md w-full shadow-lg border-zinc-150">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-inner">
              <Database className="h-9 w-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-zinc-950">Database Connection Required</h2>
              <p className="text-zinc-500 text-sm">
                MedflowX requires a connection to a Supabase PostgreSQL backend database instance.
              </p>
            </div>

            <div className="bg-zinc-50/50 border border-zinc-100 rounded-xl p-4 text-left text-xs text-zinc-600 space-y-3">
              <div className="flex gap-2 items-start">
                <KeyRound className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-zinc-800 block">Configure Environment Variables</span>
                  <span className="block mt-0.5 text-zinc-500">
                    Create a file named <code className="font-mono bg-zinc-100 text-zinc-700 px-1 py-0.5 rounded">.env.local</code> in the frontend folder.
                  </span>
                </div>
              </div>

              <div className="font-mono bg-zinc-900 text-zinc-300 p-3 rounded-lg text-[10px] space-y-1 select-all overflow-x-auto">
                <p>NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url</p>
                <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key</p>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={reset}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Configuration Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-md w-full shadow-lg border-zinc-150">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-inner">
              <AlertTriangle className="h-9 w-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-zinc-950">Something went wrong</h2>
              <p className="text-zinc-500 text-sm">
                An unexpected error occurred while loading the reception module.
              </p>
            </div>

            <p className="text-xs text-red-650 bg-red-50/30 border border-red-100 p-3 rounded-lg text-left font-mono max-h-36 overflow-y-auto">
              {error.message || 'Unknown clinical runtime error'}
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Reload
              </Button>
              <Button
                variant="primary"
                onClick={reset}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
