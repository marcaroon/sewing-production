import React from "react";
import {
  Factory,
  Package,
  TrendingUp,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Zap,
  Clock,
  Shield,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar - Minimalis */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 rounded-lg p-1.5">
                <Factory className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                Production MS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Login
              </a>
              <a
                href="/auth/register"
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Clean & Minimalis */}
      <section className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              All-in-One Production Solution
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Streamline Your
              <br />
              <span className="text-blue-600">Garment Production</span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Complete production management system for garment factories. Track
              orders, monitor progress, and optimize your workflow.
            </p>

            <div className="flex items-center gap-4">
              <a
                href="/auth/register"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="/auth/login"
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-900 px-8 py-4 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
              >
                Sign In
              </a>
            </div>
          </div>

          {/* Stats - Minimalis */}
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-2xl">
            {[
              {
                icon: <Clock className="w-5 h-5" />,
                text: "40% Faster Production",
              },
              {
                icon: <Shield className="w-5 h-5" />,
                text: "99.9% Data Security",
              },
              {
                icon: <TrendingUp className="w-5 h-5" />,
                text: "Real-time Tracking",
              },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="text-blue-600">{stat.icon}</div>
                <span className="text-sm font-medium text-gray-700">
                  {stat.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Grid Minimalis */}
      <section className="py-20 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage production
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features designed for garment manufacturing workflows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Package className="w-6 h-6" />,
                title: "Order Management",
                description:
                  "Track all production orders from start to finish with comprehensive monitoring",
              },
              {
                icon: <Factory className="w-6 h-6" />,
                title: "Production Tracking",
                description:
                  "Monitor every step from cutting to shipping in real-time",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Analytics & Reports",
                description:
                  "Get insights with detailed analytics and performance reports",
              },
              {
                icon: <CheckCircle className="w-6 h-6" />,
                title: "Quality Control",
                description:
                  "Integrated QC system with reject tracking and management",
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: "Inventory Management",
                description:
                  "Manage materials and accessories with automatic stock tracking",
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Multi-Department",
                description: "Seamless coordination across all departments",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-blue-300 transition-all"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Minimalis */}
      <section className="py-20 px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to optimize your production?
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Join factories that have streamlined their operations
          </p>
          <a
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors font-semibold"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer - Minimalis */}
      <footer className="bg-white border-t border-gray-200 py-8 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 rounded-lg p-1.5">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600">
              © 2025 Total Quality Indonesia
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <a href="/terms" className="hover:text-gray-900">
              Terms
            </a>
            <a href="/privacy" className="hover:text-gray-900">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
