import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Building2, Bell, Shield } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  return (
    <div className="p-6 space-y-6 max-w-225 mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Company Name</Label>
              <Input defaultValue="PeopleCore Solutions Inc." />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">TIN Number</Label>
              <Input defaultValue="000-123-456-789" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">SSS Employer Number</Label>
              <Input defaultValue="04-1234567-8" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">PhilHealth Employer Number</Label>
              <Input defaultValue="12-345678901-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">License Expiry Alerts</p>
              <p className="text-xs text-muted-foreground">Get notified 180 days before license expiration</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Probation Review Reminders</p>
              <p className="text-xs text-muted-foreground">Remind HR 30 days before review date</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Birthday Notifications</p>
              <p className="text-xs text-muted-foreground">Weekly birthday reminders for the team</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Contract Expiry Alerts</p>
              <p className="text-xs text-muted-foreground">Alert 30 days before contract end date</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Require 2FA for all HR admin accounts</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Audit Logging</p>
              <p className="text-xs text-muted-foreground">Track all changes to employee records</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Settings saved successfully!")} className="gap-2">
          Save Changes
        </Button>
      </div>
    </div>
  );
}