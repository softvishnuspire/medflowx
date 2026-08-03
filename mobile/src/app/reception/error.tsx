import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, AlertTriangle, KeyRound, RefreshCw } from 'lucide-react-native';
import { View, Text } from 'react-native';

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

  const handleReload = () => {
    reset();
  };

  return (
    <View className="flex-1 flex items-center justify-center p-6 bg-zinc-50/50 min-h-screen">
      {isConfigError ? (
        <Card className="max-w-md w-full shadow-lg border-zinc-150">
          <CardContent className="p-8 text-center space-y-6">
            <View className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-inner">
              <Database className="h-9 w-9" />
            </View>

            <View className="space-y-2">
              <Text className="text-xl font-bold text-zinc-950">Database Connection Required</Text>
              <Text className="text-zinc-500 text-sm">
                MedflowX requires a connection to a Supabase PostgreSQL backend database instance.
              </Text>
            </View>

            <View className="bg-zinc-50/50 border border-zinc-100 rounded-xl p-4 text-left text-xs text-zinc-600 space-y-3">
              <View className="flex gap-2 items-start">
                <KeyRound className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <View>
                  <Text className="font-semibold text-zinc-800 block">Configure Environment Variables</Text>
                  <Text className="block mt-0.5 text-zinc-500">
                    Create a file named <Text className="font-mono bg-zinc-100 text-zinc-700 px-1 py-0.5 rounded">.env.local</Text> in the frontend folder.
                  </Text>
                </View>
              </View>

              <View className="font-mono bg-zinc-900 p-3 rounded-lg space-y-1">
                <Text className="text-zinc-300 text-[10px]">NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url</Text>
                <Text className="text-zinc-300 text-[10px]">NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key</Text>
              </View>
            </View>

            <Button
              variant="primary"
              onPress={reset}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              <Text>Check Configuration Again</Text>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-md w-full shadow-lg border-zinc-150">
          <CardContent className="p-8 text-center space-y-6">
            <View className="mx-auto w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-inner">
              <AlertTriangle className="h-9 w-9" />
            </View>

            <View className="space-y-2">
              <Text className="text-xl font-bold text-zinc-950">Something went wrong</Text>
              <Text className="text-zinc-500 text-sm">
                An unexpected error occurred while loading the reception module.
              </Text>
            </View>

            <View className="bg-red-50/30 border border-red-100 p-3 rounded-lg">
              <Text className="text-xs text-red-650 font-mono">
                {error.message || 'Unknown clinical runtime error'}
              </Text>
            </View>

            <View className="flex-row gap-3">
              <Button
                variant="outline"
                onPress={handleReload}
                className="flex-1"
              >
                <Text>Reload</Text>
              </Button>
              <Button
                variant="primary"
                onPress={reset}
                className="flex-1"
              >
                <Text>Try Again</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
      )}
    </View>
  );
}
