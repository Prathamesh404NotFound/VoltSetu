import { Star, BatteryWarning, Route as RouteIcon, User, LogOut, Settings, History, DollarSign, Shield } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const { isAdmin, isAuthorized } = useAdminAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || ""} alt={user.displayName || user.email || ""} />
            <AvatarFallback>
              {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            {isAdmin && (
              <div className="flex items-center gap-1 text-xs text-primary">
                <Shield className="w-3 h-3" />
                Administrator
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/loyalty" className="flex items-center gap-2">
            <Star className="w-4 h-4 text-ev-green" />
            Loyalty
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/rescue" className="flex items-center gap-2">
            <BatteryWarning className="w-4 h-4 animate-pulse text-red-500" />
            Roadside Rescue
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/route" className="flex items-center gap-2">
            <RouteIcon className="w-4 h-4 text-primary" />
            Trip Planner
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Admin option - only visible to admin users */}
        {isAuthorized && (
          <>
            <DropdownMenuItem asChild>
              <Link to="/admin" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admin Panel
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/bookings" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Booking History
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/earnings" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            My Earnings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard/settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
