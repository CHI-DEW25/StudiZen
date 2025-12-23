import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { 
  CheckCircle, 
  Timer, 
  Target, 
  BarChart3, 
  Sparkles, 
  ArrowRight,
  Play,
  Star,
  Zap,
  Brain
} from 'lucide-react';

const Landing = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Smart Task Manager',
      description: 'Organize tasks with priorities, deadlines, and dependencies. Auto-detect overdue items.',
    },
    {
      icon: <Timer className="w-6 h-6" />,
      title: 'Pomodoro Focus Timer',
      description: 'Customizable focus sessions with breaks. Track your daily focus time.',
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Weekly Goals',
      description: 'Set achievable weekly objectives and track your progress visually.',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics Dashboard',
      description: 'Visualize your productivity with charts and actionable insights.',
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'AI Study Coach',
      description: 'Get personalized study tips based on your patterns and habits.',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Task Breakdown',
      description: 'AI breaks down large tasks into smaller, manageable steps.',
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Noise texture */}
      <div className="fixed inset-0 noise pointer-events-none z-0" />
      
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-600/20 via-background to-background z-0" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 lg:px-24 py-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading text-xl font-bold text-foreground">StudySmart</span>
        </div>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button className="rounded-full px-6 glow-primary" data-testid="go-to-dashboard-btn">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="rounded-full" data-testid="login-nav-btn">
                  Log In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="rounded-full px-6 glow-primary" data-testid="get-started-nav-btn">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-[85vh] flex flex-col lg:flex-row items-center gap-12 px-6 md:px-12 lg:px-24 py-12">
        {/* Left Content */}
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">AI-Powered Study Assistant</span>
          </div>
          
          <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight">
            <span className="text-foreground">Master Your</span>
            <br />
            <span className="text-primary">Study Habits</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            The all-in-one productivity dashboard for students. Plan tasks, track focus, 
            set goals, and get AI-powered coaching to achieve academic excellence.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link to={isAuthenticated ? "/dashboard" : "/register"}>
              <Button 
                size="lg" 
                className="rounded-full px-8 py-6 text-lg glow-primary hover:scale-105 transition-transform"
                data-testid="hero-start-free-btn"
              >
                Start Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full px-8 py-6 text-lg border-white/10 hover:bg-white/5"
              data-testid="watch-demo-btn"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>
          
          {/* Social Proof */}
          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-3">
              {[1,2,3,4].map((i) => (
                <div 
                  key={i} 
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 border-2 border-background"
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-amber text-amber" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Loved by 10,000+ students</p>
            </div>
          </div>
        </div>

        {/* Right Content - Dashboard Preview */}
        <div className="flex-1 relative">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-card/50 backdrop-blur-xl shadow-2xl">
            {/* Mock Dashboard */}
            <div className="p-6 space-y-4">
              {/* Header dots */}
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose" />
                <div className="w-3 h-3 rounded-full bg-amber" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              
              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-secondary/50 border border-white/5">
                  <p className="text-sm text-muted-foreground">Today's Focus</p>
                  <p className="text-2xl font-bold text-primary font-mono">4h 32m</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-white/5">
                  <p className="text-sm text-muted-foreground">Tasks Done</p>
                  <p className="text-2xl font-bold text-cyan font-mono">12/15</p>
                </div>
              </div>
              
              {/* AI Coach Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">AI Coach Says</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  "You're most productive at 9 AM. Schedule your hardest tasks then!"
                </p>
              </div>
            </div>
          </div>
          
          {/* Floating glow effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary to-violet-600 rounded-3xl blur-3xl opacity-20 -z-10" />
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-5xl font-bold mb-4">
            Everything You Need to <span className="text-primary">Excel</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A complete productivity system designed specifically for students
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-8 rounded-2xl bg-card/50 border border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-glow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="font-heading text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
        <div className="relative rounded-3xl bg-gradient-to-r from-primary/20 to-violet-600/20 border border-primary/30 p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
          
          <h2 className="relative font-heading text-3xl md:text-5xl font-bold mb-4">
            Ready to Transform Your Study Habits?
          </h2>
          <p className="relative text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already achieving more with StudySmart
          </p>
          
          <Link to={isAuthenticated ? "/dashboard" : "/register"}>
            <Button 
              size="lg" 
              className="relative rounded-full px-12 py-6 text-lg glow-primary hover:scale-105 transition-transform"
              data-testid="cta-get-started-btn"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-12 lg:px-24 py-8 border-t border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold">StudySmart</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 StudySmart. Built for students, by students.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
