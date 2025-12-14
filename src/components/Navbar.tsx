import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Stethoscope, User, LogOut, Settings, Pill, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
  const navigate = useNavigate();
  const [isDoctor, setIsDoctor] = useState(false);

  useEffect(() => {
    if (user) {
      checkDoctorRole();
    }
  }, [user]);

  const checkDoctorRole = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .eq('role', 'doctor')
      .maybeSingle();
    
    setIsDoctor(!!data);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { name: "الرئيسية", href: "/" },
    { name: "الأطباء", href: "/doctors" },
    { name: "تحليل النتائج", href: "/lab-results" },
    { name: "المساعد الذكي", href: "/ai-triage" },
    { name: "الصيدليات", href: "/pharmacies" },
  ];

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
            {loading ? (
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
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <User className="w-4 h-4 mr-2" />
                      لوحة التحكم
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/patient-profile')}>
                      <UserCircle className="w-4 h-4 mr-2" />
                      ملفي الشخصي
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/prescriptions')}>
                      <Pill className="w-4 h-4 mr-2" />
                      الوصفات الطبية
                    </DropdownMenuItem>
                    {isDoctor && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/doctor-dashboard')}>
                          <Stethoscope className="w-4 h-4 mr-2" />
                          لوحة الطبيب
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/doctor-profile')}>
                          <Settings className="w-4 h-4 mr-2" />
                          إعدادات الملف
                        </DropdownMenuItem>
                      </>
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
                    <Button variant="outline" className="w-full" onClick={() => { navigate('/dashboard'); setIsOpen(false); }}>
                      لوحة التحكم
                    </Button>
                    {isDoctor && (
                      <>
                        <Button variant="outline" className="w-full" onClick={() => { navigate('/doctor-dashboard'); setIsOpen(false); }}>
                          لوحة الطبيب
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => { navigate('/doctor-profile'); setIsOpen(false); }}>
                          إعدادات الملف
                        </Button>
                      </>
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
