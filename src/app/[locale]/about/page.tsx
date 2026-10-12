import { Link } from '@/i18n/routing';
import { ArrowRight, Target, Zap, Globe, Shield, Users, TrendingUp } from 'lucide-react';

export default function AboutPage() {
  const features = [
    {
      icon: Target,
      title: 'Comprehensive Discovery',
      description: 'We aggregate events from Eventbrite, Tiket.com, Ticketmaster, Loket.com, and dozens more sources — 24/7.',
    },
    {
      icon: Zap,
      title: 'AI-Powered',
      description: 'Our 4 AI agents work around the clock to discover, enrich, and verify events across Indonesia.',
    },
    {
      icon: Globe,
      title: 'All of Indonesia',
      description: 'From Jakarta to Bali, Surabaya to Yogyakarta — we cover events in every major Indonesian city.',
    },
    {
      icon: Shield,
      title: 'Verified Quality',
      description: 'Every event goes through our review process to ensure accurate information and legitimate listings.',
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Built for event-goers, by event-goers. We listen to our community to constantly improve.',
    },
    {
      icon: TrendingUp,
      title: 'Growing Fast',
      description: 'Starting with 26 events and growing daily. Our goal: list every event in Indonesia.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-50 via-white to-blue-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
            🇮🇩 Made in Indonesia
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Making Every Event
            <br />
            <span className="text-blue-600">Discoverable</span>
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
            yukgo.live is Indonesia&apos;s event discovery platform. We believe no event should go unnoticed.
            Our mission is to aggregate every event in Indonesia and make them accessible to everyone.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-gray max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              Indonesia has a vibrant events scene — from tech conferences in Jakarta to music festivals in Bali,
              from business expos to community meetups. But finding these events was scattered across dozens of
              platforms and websites.
            </p>
            <p>
              We built yukgo.live to solve this. Using AI agents that work 24/7, we automatically discover
              events from multiple sources, verify the information, and present them in one clean, searchable platform.
            </p>
            <p>
              Started in 2026, we&apos;re growing fast — with plans to cover every major city in Indonesia and
              expand into venues, vendors, and event planning services.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">What Makes Us Different</h2>
            <p className="text-gray-500 mt-2">Technology meets event discovery</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Our Roadmap</h2>
        <div className="space-y-8">
          {[
            { phase: 'Phase 1', date: 'June 2026', title: 'Launch Event Discovery', desc: 'Aggregating events from Eventbrite, covering Jakarta and major cities.', active: true },
            { phase: 'Phase 2', date: 'Q3 2026', title: 'Venue & Vendor Directory', desc: 'Adding venue listings and vendor profiles for event planning.', active: false },
            { phase: 'Phase 3', date: 'Q4 2026', title: 'AI Content & Social', desc: 'Automated articles, social media management, and outreach.', active: false },
            { phase: 'Phase 4', date: '2027', title: 'Full Platform', desc: 'Ticketing integration, user accounts, recommendations, and more.', active: false },
          ].map((item, i) => (
            <div key={i} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full border-2 ${item.active ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`} />
                {i < 3 && <div className="w-0.5 h-full bg-gray-200 mt-1" />}
              </div>
              <div className="pb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase ${item.active ? 'text-blue-600' : 'text-gray-400'}`}>
                    {item.phase}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{item.date}</span>
                  {item.active && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      Current
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-500 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Discover Events?</h2>
          <p className="text-gray-800 mb-8 text-lg">
            Start exploring events across Indonesia today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-semibold px-8 py-3.5 rounded-full transition-colors"
            >
              Browse Events
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/venues"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 font-semibold px-8 py-3.5 rounded-full transition-colors border border-gray-200"
            >
              Explore Venues
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
