import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ExternalLink, Settings, Loader2 } from 'lucide-react';

// X (Twitter) icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// LinkedIn icon
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function SocialMediaLinks() {
  const { user } = useAuth();
  const [socialX, setSocialX] = useState('');
  const [socialLinkedin, setSocialLinkedin] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSocialLinks();
    }
  }, [user]);

  const fetchSocialLinks = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('social_x, social_linkedin')
      .eq('user_id', user!.id)
      .single();

    if (data) {
      setSocialX(data.social_x || '');
      setSocialLinkedin(data.social_linkedin || '');
    }
  };

  const saveSocialLinks = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        social_x: socialX || null,
        social_linkedin: socialLinkedin || null,
      })
      .eq('user_id', user!.id);

    if (error) {
      toast.error('خطأ في حفظ الروابط');
    } else {
      toast.success('تم حفظ الروابط');
      setDialogOpen(false);
    }
    setLoading(false);
  };

  const openLink = (url: string) => {
    if (url) {
      window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
    }
  };

  const hasLinks = socialX || socialLinkedin;

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">السوشل ميديا</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>روابط السوشل ميديا</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <XIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">X (Twitter)</span>
                  </div>
                  <Input
                    placeholder="رابط حسابك في X"
                    value={socialX}
                    onChange={(e) => setSocialX(e.target.value)}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <LinkedInIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">LinkedIn</span>
                  </div>
                  <Input
                    placeholder="رابط حسابك في LinkedIn"
                    value={socialLinkedin}
                    onChange={(e) => setSocialLinkedin(e.target.value)}
                    dir="ltr"
                  />
                </div>

                <Button onClick={saveSocialLinks} className="w-full btn-gradient" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {hasLinks ? (
          <div className="flex items-center gap-2">
            {socialX && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => openLink(socialX)}
              >
                <XIcon className="w-4 h-4" />
              </Button>
            )}
            {socialLinkedin && (
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => openLink(socialLinkedin)}
              >
                <LinkedInIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            لم تضف روابط بعد
          </p>
        )}
      </CardContent>
    </Card>
  );
}
