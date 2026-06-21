import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Shield, Mail, Phone, Settings, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Button } from '@/components/ui/button';
import ResponsiveContainer from '@/components/ui/responsive-container';

const AdminFooter: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <footer className="bg-muted/50 border-t border-border">
      <ResponsiveContainer size="xl" className="py-6">
        <div className="space-y-6">
          {/* Main Footer Content */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Brand and Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-lg text-foreground">
                  VoltSetu Admin
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Administrative control panel for managing EV charging infrastructure and user accounts.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Admin Panel v2.0</span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-muted-foreground"></div>
                  <span>Secure Environment</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Quick Actions</h4>
                <div className="flex flex-col gap-2">
                  <Link
                    to="/admin"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-3 h-3" />
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/users"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Shield className="w-3 h-3" />
                    User Management
                  </Link>
                  <Link
                    to="/admin/government-stations"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Zap className="w-3 h-3" />
                    Government Stations
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Support</h4>
                <div className="flex flex-col gap-2">
                  <Link
                    to="/admin/settings"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-3 h-3" />
                    Settings
                  </Link>
                  <a
                    href="mailto:admin@voltsetu.in"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Mail className="w-3 h-3" />
                    Admin Support
                  </a>
                  <a
                    href="tel:+919876543210"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                  >
                    <Phone className="w-3 h-3" />
                    +91 98765 43210
                  </a>
                </div>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex flex-col items-start lg:items-end gap-3">
              <div className="text-sm text-muted-foreground">
                Logged in as <span className="font-medium text-foreground">{user?.displayName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Out</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border pt-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground">
                © 2024 VoltSetu. All rights reserved. Admin Portal.
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Version 2.0.1</span>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">Last updated: Today</span>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    </footer>
  );
};

export default AdminFooter;
