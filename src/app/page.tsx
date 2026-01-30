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
  Users,
  Settings,
  Activity,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-white">
      {/* Navbar - Professional */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-linear-to-br from-blue-600 to-blue-700 rounded-xl p-2 shadow-lg">
                <Factory className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">PCMS</span>
                <p className="text-xs text-gray-500 font-medium">
                  Production Control Management System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/auth/login"
                className="text-gray-700 hover:text-gray-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-all"
              >
                Login
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Professional & Clean */}
      <section className="pt-32 pb-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              {/* <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" />
                Complete Production Solution
              </div> */}

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Transform Your
                <br />
                <span className="bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Garment Production
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Comprehensive production management system designed specifically
                for garment manufacturing. Track orders, monitor progress, and
                optimize your entire workflow.
              </p>

              {/* Stats Grid */}
              {/* <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-200">
                {[
                  {
                    icon: <Clock className="w-5 h-5 text-blue-600" />,
                    value: "40%",
                    label: "Faster",
                  },
                  {
                    icon: <Shield className="w-5 h-5 text-green-600" />,
                    value: "99.9%",
                    label: "Secure",
                  },
                  {
                    icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
                    value: "Real-time",
                    label: "Tracking",
                  },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="flex justify-center mb-2">{stat.icon}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div> */}
            </div>

            {/* Visual Element - Professional Dashboard Preview */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl blur-3xl opacity-20"></div>
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                      <h3 className="font-bold text-gray-900">
                        Production Overview
                      </h3>
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Active Orders", value: "24", color: "blue" },
                        {
                          label: "In Production",
                          value: "18",
                          color: "orange",
                        },
                        { label: "Completed", value: "156", color: "green" },
                        { label: "Efficiency", value: "94%", color: "purple" },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          <div className="text-sm text-gray-600 mb-1">
                            {item.label}
                          </div>
                          <div
                            className={`text-2xl font-bold text-${item.color}-600`}
                          >
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Professional Grid */}
      <section className="py-24 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Complete Production Management
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed specifically for garment manufacturing
              workflows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Package className="w-6 h-6" />,
                title: "Order Management",
                description:
                  "Track all production orders from start to finish with comprehensive monitoring and status updates",
                color: "blue",
              },
              {
                icon: <Factory className="w-6 h-6" />,
                title: "Production Tracking",
                description:
                  "Monitor every manufacturing step from cutting to shipping in real-time with detailed progress",
                color: "orange",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Analytics & Reports",
                description:
                  "Get actionable insights with detailed analytics and comprehensive performance reports",
                color: "purple",
              },
              {
                icon: <CheckCircle className="w-6 h-6" />,
                title: "Quality Control",
                description:
                  "Integrated QC system with reject tracking, quality management, and defect analysis",
                color: "green",
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: "Inventory Management",
                description:
                  "Manage materials and accessories with automatic stock tracking and reorder alerts",
                color: "indigo",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Multi-Department",
                description:
                  "Seamless coordination across all departments with role-based access control",
                color: "pink",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all"
              >
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 bg-${feature.color}-100 rounded-xl mb-4 group-hover:scale-110 transition-transform`}
                >
                  <div className={`text-${feature.color}-600`}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      {/* <section className="py-24 px-6 lg:px-8 bg-linear-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Production MS?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Built by production experts for production teams. Every feature
                is designed to solve real manufacturing challenges.
              </p>
              <div className="space-y-6">
                {[
                  {
                    icon: <Zap className="w-5 h-5" />,
                    title: "Increase Efficiency",
                    desc: "Reduce production time by up to 40% with streamlined workflows",
                  },
                  {
                    icon: <Shield className="w-5 h-5" />,
                    title: "Data Security",
                    desc: "Enterprise-grade security to protect your production data",
                  },
                  {
                    icon: <Settings className="w-5 h-5" />,
                    title: "Easy Integration",
                    desc: "Seamlessly integrate with your existing systems and processes",
                  },
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="bg-blue-100 rounded-lg p-3 text-blue-600">
                      {benefit.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">
                        {benefit.title}
                      </h4>
                      <p className="text-gray-600">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Key Metrics
              </h3>
              <div className="space-y-6">
                {[
                  { label: "Production Efficiency", value: 94, color: "blue" },
                  { label: "On-Time Delivery", value: 98, color: "green" },
                  { label: "Quality Rate", value: 96, color: "purple" },
                  { label: "Resource Utilization", value: 92, color: "orange" },
                ].map((metric, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {metric.label}
                      </span>
                      <span
                        className={`text-sm font-bold text-${metric.color}-600`}
                      >
                        {metric.value}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`bg-${metric.color}-600 h-2.5 rounded-full transition-all`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section - Professional */}
      {/* <section className="py-24 px-6 lg:px-8 bg-linear-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Production?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join leading garment manufacturers who have optimized their
            operations with Production MS
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all font-semibold shadow-lg"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="/auth/login"
              className="inline-flex items-center gap-2 bg-blue-700 border-2 border-white text-white px-8 py-4 rounded-xl hover:bg-blue-800 transition-all font-semibold"
            >
              Sign In
            </a>
          </div>
        </div>
      </section> */}

      {/* Footer - Professional */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-linear-to-br from-blue-600 to-blue-700 rounded-xl p-2">
                  <Factory className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">
                  Production MS
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Complete production management system for garment manufacturing.
                Built to optimize your workflow and increase efficiency.
              </p>
              <p className="text-gray-500 text-xs">
                © 2025 Total Quality Indonesia. All rights reserved.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a
                    href="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
