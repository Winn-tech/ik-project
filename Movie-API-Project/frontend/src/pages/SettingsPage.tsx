
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Lock, User, Bell, Moon, LogOut, Shield } from "lucide-react";

const SettingsPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  React.useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to access settings");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    
    // Implement password change API call here
    toast.success("Password updated successfully");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };
  
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <h1 className="text-3xl font-bold mb-8 text-flicks-light">Settings</h1>
      
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="bg-flicks-dark border-b border-flicks-teal/30">
          <TabsTrigger value="account" className="text-flicks-light data-[state=active]:text-flicks-teal">
            <User className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="security" className="text-flicks-light data-[state=active]:text-flicks-teal">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-flicks-light data-[state=active]:text-flicks-teal">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-flicks-light data-[state=active]:text-flicks-teal">
            <Moon className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card className="bg-flicks-dark border-flicks-teal/20">
            <CardHeader>
              <CardTitle className="text-flicks-light">Account Information</CardTitle>
              <CardDescription className="text-flicks-light/70">
                Manage your account details and personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-flicks-light">Username</Label>
                <Input 
                  id="username" 
                  value={user?.username || ""} 
                  disabled 
                  className="bg-flicks-dark/70 border-flicks-teal/50 text-flicks-light"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-flicks-light">Email</Label>
                <Input 
                  id="email" 
                  value={user?.email || ""} 
                  disabled 
                  className="bg-flicks-dark/70 border-flicks-teal/50 text-flicks-light"
                />
              </div>
              
              <Separator className="my-4 bg-flicks-teal/20" />
              
              <div className="pt-2">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/profile")}
                  className="text-flicks-teal hover:text-flicks-light hover:bg-flicks-teal/20"
                >
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card className="bg-flicks-dark border-flicks-teal/20">
            <CardHeader>
              <CardTitle className="text-flicks-light flex items-center">
                <Shield className="h-5 w-5 mr-2 text-flicks-teal" />
                Security Settings
              </CardTitle>
              <CardDescription className="text-flicks-light/70">
                Update your password and manage account security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-flicks-light">Current Password</Label>
                  <Input 
                    id="current-password" 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-flicks-dark/70 border-flicks-teal/50 text-flicks-light"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-flicks-light">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-flicks-dark/70 border-flicks-teal/50 text-flicks-light"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-flicks-light">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-flicks-dark/70 border-flicks-teal/50 text-flicks-light"
                  />
                </div>
                
                <Button type="submit" className="bg-flicks-teal hover:bg-flicks-sage mt-2">
                  Change Password
                </Button>
              </form>
              
              <Separator className="my-6 bg-flicks-teal/20" />
              
              <div className="pt-2">
                <h3 className="text-lg font-medium text-flicks-light mb-4">Account Actions</h3>
                <Button 
                  variant="destructive" 
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card className="bg-flicks-dark border-flicks-teal/20">
            <CardHeader>
              <CardTitle className="text-flicks-light flex items-center">
                <Bell className="h-5 w-5 mr-2 text-flicks-teal" />
                Notification Settings
              </CardTitle>
              <CardDescription className="text-flicks-light/70">
                Control how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-flicks-light">Email Notifications</Label>
                  <p className="text-sm text-flicks-light/70">
                    Receive email updates about your activity
                  </p>
                </div>
                <Switch 
                  checked={emailNotifications} 
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <Separator className="bg-flicks-teal/20" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-flicks-light">Push Notifications</Label>
                  <p className="text-sm text-flicks-light/70">
                    Receive push notifications about new releases
                  </p>
                </div>
                <Switch 
                  checked={pushNotifications} 
                  onCheckedChange={setPushNotifications}
                />
              </div>
              
              <Separator className="bg-flicks-teal/20" />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-flicks-light">Weekly Newsletter</Label>
                  <p className="text-sm text-flicks-light/70">
                    Get weekly updates about new movies and shows
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-flicks-teal hover:bg-flicks-sage">
                Save Notification Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card className="bg-flicks-dark border-flicks-teal/20">
            <CardHeader>
              <CardTitle className="text-flicks-light flex items-center">
                <Moon className="h-5 w-5 mr-2 text-flicks-teal" />
                Appearance Settings
              </CardTitle>
              <CardDescription className="text-flicks-light/70">
                Customize how FlicksLounge looks for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-flicks-light">Dark Mode</Label>
                  <p className="text-sm text-flicks-light/70">
                    Use dark theme throughout the application
                  </p>
                </div>
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode}
                />
              </div>
              
              <Separator className="bg-flicks-teal/20" />
              
              <div className="pt-2">
                <h3 className="text-lg font-medium text-flicks-light mb-4">Theme</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="border-2 border-flicks-teal rounded-md p-4 text-center cursor-pointer">
                    <div className="h-20 bg-flicks-dark mb-2 rounded"></div>
                    <span className="text-flicks-light">Default</span>
                  </div>
                  <div className="border-2 border-transparent rounded-md p-4 text-center cursor-pointer">
                    <div className="h-20 bg-purple-900 mb-2 rounded"></div>
                    <span className="text-flicks-light">Purple</span>
                  </div>
                  <div className="border-2 border-transparent rounded-md p-4 text-center cursor-pointer">
                    <div className="h-20 bg-blue-900 mb-2 rounded"></div>
                    <span className="text-flicks-light">Ocean</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-flicks-teal hover:bg-flicks-sage">
                Save Appearance Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
