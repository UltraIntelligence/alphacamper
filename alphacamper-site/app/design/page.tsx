import { WatchMapBackground } from '@/components/watch/WatchMapBackground'
import { CalendarDays, Lock, Tent, CarFront, Zap, Waves, CheckCircle2, ChevronDown, Check, Star } from 'lucide-react'

export default function DesignShowcase() {
  return (
    <main className="min-h-screen relative flex flex-col items-center py-20 px-6 font-sans">
      <WatchMapBackground campgroundName="Porteau Cove" />

      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col gap-16">
        <div className="text-center">
          <h1 className="text-4xl text-white font-black tracking-tight" style={{ fontFamily: 'var(--font-momo, sans-serif)' }}>
            Wizard Redesign
          </h1>
          <p className="text-white/70 mt-3 text-lg">Dark, premium outdoor aesthetic showcase.</p>
        </div>

        {/* STEP 2 - STATE A */}
        <section className="flex flex-col gap-4">
          <h2 className="text-white/50 font-bold uppercase tracking-widest text-sm">Step 2 - State A (Specific Dates)</h2>
          <div className="wizard-glass-dark rounded-[32px] p-8 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#2F847C] bg-[#2F847C]/20 text-[#2F847C] font-black text-lg" style={{ fontFamily: 'var(--font-momo)' }}>
                2
              </div>
              <h3 className="text-2xl text-white font-bold" style={{ fontFamily: 'var(--font-momo)' }}>When are you going?</h3>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-8">
              {/* Toggle Pills */}
              <div className="flex bg-white/5 p-1.5 rounded-[100px] border border-white/10 max-w-fit">
                <button className="px-6 py-2.5 rounded-full bg-[#2F847C] text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2">
                  <CalendarDays size={16} />
                  My trip
                </button>
                <button className="px-6 py-2.5 rounded-full text-white/60 hover:text-white font-medium text-sm transition-all flex items-center gap-2">
                  <Star size={14} className="text-amber-400" fill="currentColor" />
                  Any opening
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-8">
                {/* Mock Dark Calendar Area */}
                <div className="bg-[#121214]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                  <div className="flex justify-between items-center text-white mb-6">
                    <span className="font-bold">September 2026</span>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">←</button>
                      <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">→</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-y-4 gap-x-1 text-center text-sm">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="text-white/40 font-medium mb-2">{day}</div>
                    ))}
                    {Array.from({ length: 30 }).map((_, i) => {
                      const day = i + 1;
                      const isPast = day < 12;
                      const isStart = day === 15;
                      const isEnd = day === 17;
                      const inRange = day > 15 && day < 17;
                      
                      let classes = "w-10 h-10 mx-auto flex items-center justify-center rounded-full transition-colors cursor-pointer ";
                      if (isPast) classes += "text-white/20 cursor-not-allowed";
                      else if (isStart || isEnd) classes += "bg-[#2F847C] text-white font-bold shadow-lg ring-4 ring-[#2F847C]/20";
                      else if (inRange) classes += "bg-[#2F847C]/20 text-white font-bold";
                      else classes += "text-white/80 hover:bg-white/10";
                      
                      return <div key={i} className={classes}>{day}</div>;
                    })}
                  </div>
                </div>

                {/* Summary Panel */}
                <div className="flex flex-col gap-6">
                  <div className="bg-[#121214]/60 backdrop-blur-md rounded-2xl p-6 border border-white/5 flex-1">
                    <div className="mb-6">
                      <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Campground</div>
                      <div className="text-white font-medium">Porteau Cove Prov. Park</div>
                    </div>
                    <hr className="border-white/10 mb-6" />
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Check-in</div>
                        <div className="text-white font-medium">Tue, Sep 15</div>
                      </div>
                      <div>
                        <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Check-out</div>
                        <div className="text-white font-medium">Thu, Sep 17</div>
                      </div>
                    </div>
                    <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#2F847C]/10 border border-[#2F847C]/30 text-[#2F847C] text-xs font-bold uppercase tracking-wide">
                      2 Nights
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full py-4 bg-[#2F847C] hover:bg-[#256963] text-white rounded-[100px] font-bold text-lg transition-colors shadow-xl">
                Continue to Preferences
              </button>
            </div>
          </div>
        </section>

        {/* STEP 2 - STATE B */}
        <section className="flex flex-col gap-4">
          <h2 className="text-white/50 font-bold uppercase tracking-widest text-sm">Step 2 - State B (Any Opening)</h2>
          <div className="wizard-glass-dark rounded-[32px] p-8 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#2F847C] bg-[#2F847C]/20 text-[#2F847C] font-black text-lg" style={{ fontFamily: 'var(--font-momo)' }}>
                2
              </div>
              <h3 className="text-2xl text-white font-bold" style={{ fontFamily: 'var(--font-momo)' }}>When are you going?</h3>
            </div>

            <div className="flex flex-col gap-8">
              {/* Toggle Pills */}
              <div className="flex bg-white/5 p-1.5 rounded-[100px] border border-white/10 max-w-fit">
                <button className="px-6 py-2.5 rounded-full text-white/60 hover:text-white font-medium text-sm transition-all flex items-center gap-2">
                  <CalendarDays size={16} />
                  My trip
                </button>
                <button className="px-6 py-2.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 font-semibold text-sm shadow-sm transition-all flex items-center gap-2">
                  <Star size={14} fill="currentColor" />
                  Any opening
                </button>
              </div>

              {/* Locked State Container */}
              <div className="relative rounded-3xl overflow-hidden border border-amber-500/20 bg-gradient-to-br from-[#1E1A17] to-[#121214] p-10 text-center flex flex-col items-center justify-center">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-amber-500/10 blur-[60px] rounded-full point-events-none" />
                
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 relative z-10">
                  <Lock className="text-amber-500" size={28} />
                </div>
                
                <h4 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-momo)' }}>Unlock "Any Opening" mode</h4>
                <p className="text-white/60 max-w-md mx-auto mb-8 leading-relaxed">
                  Don't have specific dates? Give Alpha an entire season to track and well instantly grab the absolute first cancellation that pops up for Porteau Cove. 
                </p>
                
                <button className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-[100px] font-bold text-lg transition-colors shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  Upgrade to Alpha Pro
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 3 */}
        <section className="flex flex-col gap-4">
          <h2 className="text-white/50 font-bold uppercase tracking-widest text-sm">Step 3 - Site Preference</h2>
          <div className="wizard-glass-dark rounded-[32px] p-8 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#2F847C] bg-[#2F847C]/20 text-[#2F847C] font-black text-lg" style={{ fontFamily: 'var(--font-momo)' }}>
                3
              </div>
              <h3 className="text-2xl text-white font-bold" style={{ fontFamily: 'var(--font-momo)' }}>Site Preference</h3>
            </div>

            <div className="flex flex-col gap-10">
              
              {/* Site Type Selector */}
              <div>
                <label className="block text-white/90 font-bold mb-4">What are you camping in?</label>
                <div className="grid grid-cols-3 gap-3">
                  <button className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white/70 transition-all">
                    <CarFront size={24} />
                    <span className="font-semibold text-sm">RV / Trailer</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white/70 transition-all">
                    <Tent size={24} />
                    <span className="font-semibold text-sm">Tent</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 border-[#2F847C] bg-[#2F847C]/10 text-white transition-all shadow-[0_4px_20px_rgba(47,132,124,0.15)] relative overflow-hidden">
                    <div className="absolute top-2 right-2 text-[#2F847C]"><CheckCircle2 size={16} fill="currentColor" stroke="black"/></div>
                    <span className="font-bold">Any</span>
                    <span className="text-xs text-[#2F847C] font-medium mt-1">Highest success rate</span>
                  </button>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-white/90 font-bold mb-4">Required Amenities <span className="text-white/40 font-normal ml-2">(Optional)</span></label>
                <div className="flex flex-wrap gap-3">
                  <button className="flex items-center gap-2 px-5 py-3 rounded-[100px] border border-white/10 bg-[#121214] hover:border-white/20 text-white/80 transition-colors">
                     <Zap size={16} className="text-blue-400" />
                     <span>Power Hookup</span>
                  </button>
                  <button className="flex items-center gap-2 px-5 py-3 rounded-[100px] border border-[#2F847C] bg-[#2F847C]/10 text-white font-medium transition-colors">
                     <Waves size={16} className="text-[#2F847C]" />
                     <span>Waterfront</span>
                     <Check size={14} className="text-[#2F847C] ml-1" />
                  </button>
                </div>
              </div>

              {/* Loop Selector */}
              <div>
                <div className="flex items-end justify-between mb-4">
                  <label className="block text-white/90 font-bold">Specific Loops or Areas</label>
                  <span className="text-xs text-[#2F847C] bg-[#2F847C]/10 px-2 py-1 rounded-md font-medium border border-[#2F847C]/20">Loaded for Porteau Cove</span>
                </div>
                <div className="bg-[#121214]/60 backdrop-blur-md rounded-2xl border border-white/5 p-2 grid grid-cols-2 lg:grid-cols-3 gap-2">
                  <button className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5 text-left transition-colors border-2 border-transparent hover:border-white/5 group">
                    <div>
                      <div className="text-white font-medium group-hover:text-white">Oceanfront Sites</div>
                      <div className="text-white/40 text-xs">14 sites</div>
                    </div>
                    <div className="w-5 h-5 rounded border border-white/20 group-hover:border-white/40 flex items-center justify-center"></div>
                  </button>
                  <button className="flex justify-between items-center p-3 rounded-xl bg-[#2F847C]/10 border-2 border-[#2F847C]/50 text-left transition-colors">
                    <div>
                      <div className="text-white font-medium">Walk-in Tents</div>
                      <div className="text-white/60 text-xs">8 sites</div>
                    </div>
                    <div className="w-5 h-5 rounded bg-[#2F847C] flex items-center justify-center">
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                  </button>
                  <button className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5 text-left transition-colors border border-transparent">
                    <div>
                      <div className="text-white font-medium">Drive-in Double</div>
                      <div className="text-white/40 text-xs text-left">4 sites</div>
                    </div>
                    <div className="w-5 h-5 rounded border border-white/20"></div>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex flex-col gap-4">
                <button className="w-full py-4 bg-[#2F847C] hover:bg-[#256963] text-white rounded-[100px] font-bold text-lg transition-colors shadow-xl">
                  Continue
                </button>
                <button className="text-white/50 hover:text-white font-medium transition-colors pb-2">
                  Skip — watch all sites
                </button>
              </div>

            </div>
          </div>
        </section>

      </div>
      
      {/* Global CSS for the dark glass panel - injecting here for the mock */}
      <style dangerouslySetInnerHTML={{__html: `
        .wizard-glass-dark {
          background: rgba(18, 18, 20, 0.65);
          backdrop-filter: blur(40px) saturate(140%);
          -webkit-backdrop-filter: blur(40px) saturate(140%);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
      `}} />
    </main>
  )
}
