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
  Brain,
  Shield,
  Clock,
  TrendingUp,
  Users,
  ChevronRight,
} from 'lucide-react';

const Landing = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'Be Task Ready',
      description: 'Organize tasks with smart priorities, deadlines, and AI-powered breakdowns.',
      metric: '89%',
      metricLabel: 'completion rate',
    },
    {
      icon: <Timer className="w-6 h-6" />,
      title: 'Be Focus Ready',
      description: 'Pomodoro sessions with tracking. Know exactly where your time goes.',
      metric: '4.2h',
      metricLabel: 'avg daily focus',
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Be Goal Ready',
      description: 'Set weekly objectives and watch your progress with visual indicators.',
      metric: '12',
      metricLabel: 'goals/month',
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'Be AI Ready',
      description: 'Get personalized study tips and burnout detection from your AI coach.',
      metric: '24/7',
      metricLabel: 'AI assistance',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Students' },
    { value: '2.5M', label: 'Tasks Completed' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '4.9', label: 'App Rating' },
  ];

  const testimonials = [
    {
      quote: "StudySmart helped me increase my GPA by 0.8 points in just one semester.",
      author: "Sarah Chen",
      role: "Stanford University",
      avatar: "SC",
    },
    {
      quote: "The AI coach is like having a personal tutor available 24/7.",
      author: "Alex Kumar",
      role: "MIT",
      avatar: "AK",
    },
    {
      quote: "Finally, a productivity app that actually understands how students work.",
      author: "Emma Wilson",
      role: "Oxford University",
      avatar: "EW",
    },
  ];

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 gradient-hero pointer-events-none" />
      <div className="fixed inset-0 ring-pattern pointer-events-none opacity-50" />
      
      {/* Floating orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-emerald-600/15 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 lg:px-24 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg glow-green">
            <Zap className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <span className="font-heading text-xl font-bold text-foreground">StudiZen</span>
            <span className="hidden md:block text-[10px] text-emerald-400 font-medium tracking-wider">PRODUCTIVITY</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground-400 hover:text-foreground transition-colors">Features</a>
          <a href="#testimonials" className="text-sm text-muted-foreground-400 hover:text-foreground transition-colors">Students</a>
          <a href="#pricing" className="text-sm text-muted-foreground-400 hover:text-foreground transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button className="btn-primary rounded-xl px-6" data-testid="go-to-dashboard-btn">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-muted-foreground-400 hover:text-foreground rounded-xl" data-testid="login-nav-btn">
                  Log In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="btn-primary rounded-xl px-6" data-testid="get-started-nav-btn">
                  Get started free
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center px-6 md:px-12 lg:px-24 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 animate-fade-up">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-muted-foreground-300">AI-Powered Study Assistant</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground-500" />
        </div>
        
        {/* Main headline */}
        <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold max-w-5xl mb-6 animate-fade-up stagger-1">
          <span className="text-gradient-foreground">Study Smarter.</span>
          <br />
          <span className="text-gradient-green glow-text">Achieve More.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground-400 max-w-2xl mb-10 animate-fade-up stagger-2">
          The all-in-one productivity dashboard that transforms how students plan, 
          focus, and succeed. Powered by AI, designed for excellence.
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16 animate-fade-up stagger-3">
          <Link to={isAuthenticated ? "/dashboard" : "/register"}>
            <Button 
              size="lg" 
              className="btn-primary rounded-xl px-8 py-6 text-lg"
              data-testid="hero-start-free-btn"
            >
              Get started free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Button 
            size="lg"
            className="btn-secondary rounded-xl px-8 py-6 text-lg"
            data-testid="watch-demo-btn"
          >
            <Play className="w-5 h-5 mr-2" />
            See a demo
          </Button>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 animate-fade-up stagger-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-foreground font-mono">{stat.value}</p>
              <p className="text-sm text-muted-foreground-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
        <div className="text-center mb-16">
          <p className="text-emerald-400 text-sm font-medium mb-4 tracking-wider uppercase">Features</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient-foreground">Everything You Need to</span>
            <br />
            <span className="text-gradient-green">Excel Academically</span>
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="glass-card glass-card-hover rounded-2xl p-8 group"
              data-testid={`feature-card-${index}`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform border border-emerald-500/20">
                  {feature.icon}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-foreground font-mono">{feature.metric}</p>
                  <p className="text-xs text-muted-foreground-500">{feature.metricLabel}</p>
                </div>
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
        <div className="text-center mb-16">
          <p className="text-emerald-400 text-sm font-medium mb-4 tracking-wider uppercase">Dashboard</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold">
            <span className="text-gradient-foreground">Results in Minutes,</span>
            <br />
            <span className="text-gradient-green">Not Hours</span>
          </h2>
        </div>

        {/* Mock Dashboard */}
        <div className="max-w-6xl mx-auto glass-card rounded-3xl p-2 overflow-hidden">
          <div className="bg-secondary rounded-2xl p-6">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Live Preview</span>
              </div>
            </div>
            
            {/* Dashboard content */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Stat cards */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-muted-foreground-400">Tasks Done</span>
                </div>
                <p className="text-3xl font-bold text-foreground font-mono">24<span className="text-muted-foreground-500">/30</span></p>
              </div>
              
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-violet-400" />
                  </div>
                  <span className="text-sm text-muted-foreground-400">Focus Time</span>
                </div>
                <p className="text-3xl font-bold text-foreground font-mono">4.5<span className="text-muted-foreground-500">h</span></p>
              </div>
              
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-sm text-muted-foreground-400">Score</span>
                </div>
                <p className="text-3xl font-bold text-foreground font-mono">92<span className="text-muted-foreground-500">%</span></p>
              </div>
            </div>

            {/* Chart area */}
            <div className="mt-6 glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground-400">Weekly Progress</span>
                <span className="text-xs text-emerald-400">+12% vs last week</span>
              </div>
              <div className="h-32 flex items-end justify-between gap-2">
                {[40, 65, 45, 80, 60, 90, 75].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground-600">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
        <div className="text-center mb-16">
          <p className="text-emerald-400 text-sm font-medium mb-4 tracking-wider uppercase">Testimonials</p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold">
            <span className="text-gradient-foreground">Students Love</span>
            <span className="text-gradient-green"> StudiZen</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="glass-card glass-card-hover rounded-2xl p-6">
              <div className="flex items-center gap-1 mb-4">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                ))}
              </div>
              <p className="text-muted-foreground-300 mb-6 leading-relaxed">"{testimonial.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-foreground text-sm font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-medium text-foreground">{testimonial.author}</p>
                  <p className="text-xs text-muted-foreground-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 lg:px-24 py-24">
        <div className="max-w-4xl mx-auto glass-card rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]" />
          
          <h2 className="relative font-heading text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient-foreground">Ready to</span>
            <span className="text-gradient-green"> Get Started?</span>
          </h2>
          <p className="relative text-muted-foreground-400 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of students already achieving more with StudiZen. Free forever for basic features.
          </p>
          
          <div className="relative flex flex-wrap justify-center gap-4">
            <Link to={isAuthenticated ? "/dashboard" : "/register"}>
              <Button 
                size="lg" 
                className="btn-primary rounded-xl px-10 py-6 text-lg"
                data-testid="cta-get-started-btn"
              >
                Get started free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button 
              size="lg"
              className="btn-secondary rounded-xl px-10 py-6 text-lg"
            >
              Talk to Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-12 lg:px-24 py-12 border-t border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-foreground" />
            </div>
            <span className="font-heading font-bold text-foreground">StudiZen</span>
          </div>
          
          <div className="flex items-center gap-8 text-sm text-muted-foreground-500">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-muted-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-ftransition-colors">Contact</a>
          </div>
          
          <p className="text-sm text-gray-600">
            © 2025 StudiZen. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;