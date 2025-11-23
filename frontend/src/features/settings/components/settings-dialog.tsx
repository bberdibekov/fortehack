import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { useTheme } from "@/shared/components/theme-provider";

interface SettingsDialogProps {
  children: React.ReactNode;
}

export const SettingsDialog = ({ children }: SettingsDialogProps) => {
  const { setTheme } = useTheme();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          
          {/* General Tab */}
          <TabsContent value="general" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Appearance</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" onClick={() => setTheme('light')}>Light</Button>
                <Button variant="outline" onClick={() => setTheme('dark')}>Dark</Button>
                <Button variant="outline" onClick={() => setTheme('system')}>System</Button>
              </div>
            </div>
            
            <div className="space-y-2">
               <Label htmlFor="api-key">OpenAI / Claude API Key (Optional)</Label>
               <Input id="api-key" type="password" placeholder="sk-..." />
               <p className="text-[10px] text-muted-foreground">
                 This is a frontend demo. Keys aren't actually sent anywhere yet.
               </p>
            </div>
          </TabsContent>
          
          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input id="name" defaultValue="Senior Analyst" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue="user@example.com" disabled />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};