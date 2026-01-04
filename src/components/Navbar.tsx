import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Stethoscope, User, LogOut, Settings, Pill, UserCircle, Users, Video, Shield, Building, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const { role, loading: roleLoading, getDashboardRoute, getRoleName } = useUserRole();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Navigation links based on role
  const getNavLinks = () => {
    const commonLinks = [
      { name: "الرئيسية", href: "/" },
    ];

    // Patient-specific links
    if (role === 'patient' || !role) {
      return [
        ...commonLinks,
        { name: "الأطباء", href: "/doctors" },
        { name: "تحليل النتائج", href: "/lab-results" },
        { name: "المساعد الذكي", href: "/ai-triage" },
        { name: "الصيدليات", href: "/pharmacies" },
      ];
    }

    // Pharmacist - don't show doctors or lab results
    if (role === 'pharmacist') {
      return [
        ...commonLinks,
        { name: "الصيدليات", href: "/pharmacies" },
      ];
    }

    // Clinic owner
    if (role === 'clinic') {
      return [
        ...commonLinks,
        { name: "الصيدليات", href: "/pharmacies" },
      ];
    }

    // Doctor
    if (role === 'doctor') {
      return [
        ...commonLinks,
        { name: "الأطباء", href: "/doctors" },
        { name: "الصيدليات", href: "/pharmacies" },
      ];
    }

    // Admin - full access
    if (role === 'admin') {
      return [
        ...commonLinks,
        { name: "الأطباء", href: "/doctors" },
        { name: "تحليل النتائج", href: "/lab-results" },
        { name: "المساعد الذكي", href: "/ai-triage" },
        { name: "الصيدليات", href: "/pharmacies" },
      ];
    }

    return commonLinks;
  };

  const navLinks = getNavLinks();

  // Get profile route based on role
  const getProfileRoute = () => {
    switch (role) {
      case 'doctor': return '/doctor-profile';
      case 'pharmacist': return '/profile';
      case 'clinic': return '/profile';
      default: return '/profile';
    }
  };

  // Get profile label based on role
  const getProfileLabel = () => {
    switch (role) {
      case 'doctor': return 'ملف الطبيب';
      case 'pharmacist': return 'ملف الصيدلية';
      case 'clinic': return 'ملف العيادة';
      default: return 'ملفي الشخصي';
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft group-hover:shadow-elevated transition-all duration-300">
              <Stethoscope className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              MED<span className="text-gradient">LINK</span> DZ
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-muted-foreground hover:text-primary font-medium transition-colors duration-300"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {loading || roleLoading ? (
              <div className="w-24 h-10 bg-muted animate-pulse rounded-lg" />
            ) : user ? (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <User className="w-4 h-4" />
                      <span className="max-w-24 truncate">
                        {user.user_metadata?.full_name || user.email?.split('@')[0]}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate(getDashboardRoute())}>
                      <User className="w-4 h-4 mr-2" />
                      لوحة التحكم
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(getProfileRoute())}>
                      <UserCircle className="w-4 h-4 mr-2" />
                      {getProfileLabel()}
                    </DropdownMenuItem>
                    
                    {/* Patient-only menu items */}
                    {role === 'patient' && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/prescriptions')}>
                          <Pill className="w-4 h-4 mr-2" />
                          الوصفات الطبية
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/family')}>
                          <Users className="w-4 h-4 mr-2" />
                          أفراد العائلة
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/telemedicine')}>
                          <Video className="w-4 h-4 mr-2" />
                          الطب عن بعد
                        </DropdownMenuItem>
                      </>
                    )}

                    {/* Doctor-specific */}
                    {role === 'doctor' && (
                      <DropdownMenuItem onClick={() => navigate('/doctor-profile')}>
                        <Settings className="w-4 h-4 mr-2" />
                        إعدادات الملف
                      </DropdownMenuItem>
                    )}

                    {/* Admin link */}
                    {role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="w-4 h-4 mr-2" />
                        لوحة الإدارة
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      تسجيل الخروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                  تسجيل الدخول
                </Button>
                <Button variant="hero" size="sm" onClick={() => navigate('/auth')}>
                  حساب جديد
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-up">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-muted-foreground hover:text-primary font-medium transition-colors px-2 py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                {user ? (
                  <>
                    <Button variant="outline" className="w-full" onClick={() => { navigate(getDashboardRoute()); setIsOpen(false); }}>
                      لوحة التحكم
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => { navigate(getProfileRoute()); setIsOpen(false); }}>
                      {getProfileLabel()}
                    </Button>
                    {role === 'patient' && (
                      <Button variant="outline" className="w-full" onClick={() => { navigate('/prescriptions'); setIsOpen(false); }}>
                        الوصفات الطبية
                      </Button>
                    )}
                    <Button variant="ghost" className="w-full text-destructive" onClick={handleSignOut}>
                      تسجيل الخروج
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full" onClick={() => { navigate('/auth'); setIsOpen(false); }}>
                      تسجيل الدخول
                    </Button>
                    <Button variant="hero" className="w-full" onClick={() => { navigate('/auth'); setIsOpen(false); }}>
                      حساب جديد
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
