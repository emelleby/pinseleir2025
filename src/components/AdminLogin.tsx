
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';

interface AdminLoginProps {
  onLogin: (sessionId: string) => void;
}

const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      // Check password
      if (password !== 'Pinseleir2025') {
        throw new Error('Feil passord');
      }

      // Create a simple session token with expiration
      const sessionData = {
        sessionId: crypto.randomUUID(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        createdAt: Date.now()
      };

      // Store session data in localStorage with expiration
      localStorage.setItem('admin_session_data', JSON.stringify(sessionData));

      return sessionData.sessionId;
    },
    onSuccess: (sessionId) => {
      onLogin(sessionId);
      toast({
        title: "Innlogget",
        description: "Velkommen til admin-panelet.",
      });
    },
    onError: (error: Error) => {
      console.error('Login error:', error);
      toast({
        title: "Innlogging feilet",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast({
        title: "Passord påkrevd",
        description: "Vennligst skriv inn passordet.",
        variant: "destructive"
      });
      return;
    }
    loginMutation.mutate(password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Admin Innlogging
          </CardTitle>
          <CardDescription className="text-center">
            Skriv inn passord for å få tilgang til tilbakemeldingsstatistikk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Passord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Skriv inn passord"
                className="mt-1"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Logger inn...' : 'Logg inn'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
