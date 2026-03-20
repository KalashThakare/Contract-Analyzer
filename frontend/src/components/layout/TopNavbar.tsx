"use client";

import { useTheme } from "next-themes";
import { useState, useRef, useEffect } from "react";
import { useAnimationContext } from "@/context/AnimationContext";
import { useAnalysis } from "@/context/AnalysisContext";
import { Moon, Sun, Scale, Search, Bell, Activity, ActivitySquare, Monitor, X, CheckCircle2, Info, AlertTriangle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopNavbar() {
  const { theme, setTheme } = useTheme();
  const { animationsEnabled, toggleAnimations } = useAnimationContext();
  const { notifications, deleteNotification, markNotificationsAsRead } = useAnalysis();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    // Close dropdown on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpenDropdown = () => {
    setIsDropdownOpen(prev => !prev);
    if (!isDropdownOpen && unreadCount > 0) {
      markNotificationsAsRead();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 border-b border-border bg-background z-50 transition-colors duration-200 px-4 md:px-6 flex items-center justify-between">
      
      {/* Left: Branding */}
      <div className="flex items-center gap-3 min-w-[200px]">
        <div className="w-8 h-8 bg-foreground rounded-md flex items-center justify-center border border-border">
           <Scale className="w-4 h-4 text-background" strokeWidth={2} />
        </div>
        <div>
           <span className="font-semibold text-sm tracking-tight text-foreground block leading-none">Aethel AI</span>
           <span className="text-[10px] text-muted-foreground uppercase tracking-widest block font-medium mt-1">Legal Inference Platform</span>
        </div>
      </div>

      {/* Right: Controls & Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        
        {/* Status indicator removed per request */}

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleOpenDropdown}
            className="relative w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
          >
             <Bell className="w-4 h-4" />
             {unreadCount > 0 && (
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-background animate-pulse"></span>
             )}
          </button>

          {/* Notifications Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 bg-card border border-border shadow-lg rounded-lg overflow-hidden flex flex-col z-50">
              <div className="px-4 py-3 border-b border-border bg-muted/30 flex justify-between items-center">
                <span className="font-semibold text-sm text-foreground">Notifications</span>
                <span className="text-xs text-muted-foreground">{notifications.length} total</span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No new notifications.
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-border/50">
                    {notifications.map((noti) => (
                      <div key={noti.id} className="p-3 text-left hover:bg-muted/30 transition-colors flex items-start gap-3 group">
                        <div className="mt-0.5 shrink-0">
                          {noti.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {noti.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          {noti.type === 'info' && <Info className="w-4 h-4 text-indigo-500" />}
                        </div>
                        <div className="flex-1 pr-2">
                          <p className="text-xs font-semibold text-foreground mb-1 leading-tight">{noti.title}</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed break-words">{noti.message}</p>
                          <p className="text-[9px] text-muted-foreground/60 mt-1 uppercase tracking-widest">
                            {new Date(noti.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteNotification(noti.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
        >
           <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
           <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>

        {/* Global Animation Toggle */}
        <button 
           onClick={toggleAnimations}
           className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
           aria-label="Toggle Physics/Animations"
        >
          {animationsEnabled ? <Activity className="w-4 h-4" /> : <ActivitySquare className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
