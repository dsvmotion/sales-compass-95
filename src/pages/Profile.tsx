import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Mail, Calendar, Shield, Loader2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { UserMenu } from '@/components/auth/UserMenu';

export default function Profile() {
  const { user, signOut, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const fullName = user.user_metadata?.full_name ?? 'Not set';
  const email = user.email ?? '—';
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';
  const provider = user.app_metadata?.provider ?? 'email';
  const lastSignInAt = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
  const userId = user.id;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 md:px-6 bg-gray-50 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <UserMenu />
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Account Information */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-600">Full Name</Label>
                <Input
                  readOnly
                  value={fullName}
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  readOnly
                  value={email}
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Account created
                </Label>
                <Input
                  readOnly
                  value={createdAt}
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Auth provider
                </Label>
                <Input
                  readOnly
                  value={provider}
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>
            </CardContent>
          </Card>

          {/* Session */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-600">Last sign in</Label>
                <Input
                  readOnly
                  value={lastSignInAt}
                  className="bg-gray-50 border-gray-200 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600">User ID</Label>
                <p className="text-xs text-gray-500 truncate bg-gray-50 border border-gray-200 rounded-md px-3 py-2 font-mono">
                  {userId}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-gray-200 bg-white border-red-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => signOut()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
