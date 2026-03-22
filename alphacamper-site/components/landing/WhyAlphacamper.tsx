export function WhyAlphacamper() {
  const benefits = [
    {
      title: 'Checkout Assist',
      body: 'We don\'t just send you a text and wish you luck. Our smart browser extension puts you directly on the booking page with your details already typed in.',
    },
    {
      title: 'The Spacebar Trick',
      body: 'If someone beats you to the first site, just hit the Spacebar! Our tool instantly jumps to your next backup spot so you don\'t waste precious seconds.',
    },
    {
      title: 'Always Watching',
      body: 'Sold out? Don\'t worry. We check for cancellations around the clock. Go to work, play with the kids, and let us do the boring part.',
    }
  ];

  return (
    <section className="why-section">
      <div className="why-header">
        <span className="section-eyebrow tracking-wider text-sm font-semibold uppercase" style={{ color: 'var(--horizon)' }}>YOUR SECRET WEAPON</span>
        <h2 className="section-title-premium" style={{ color: '#1a1a1a', marginTop: '12px' }}>Built to give you a real chance</h2>
      </div>
      
      {/* 3-Card Bento Grid */}
      <div className="why-grid">
        
        {/* Card 1: Checkout Assist */}
        <div className="why-card why-card-wide">
          <div className="why-card-content">
            <h3>{benefits[0].title}</h3>
            <p>{benefits[0].body}</p>
          </div>
          
          {/* Wireframe UI */}
          <div className="why-wireframe-ui">
            <div className="why-wf-group">
              <div className="why-wf-text-short"></div>
              <div className="why-wf-row">
                 <div className="why-wf-col">
                   <div className="why-wf-text-short"></div>
                   <div className="why-wf-input"></div>
                 </div>
                 <div className="why-wf-col">
                   <div className="why-wf-text-short"></div>
                   <div className="why-wf-input"></div>
                 </div>
              </div>
              <div className="why-wf-col">
                 <div className="why-wf-text-med"></div>
                 <div className="why-wf-input"></div>
              </div>
              <div className="why-wf-btn"></div>
            </div>
          </div>
        </div>

        {/* Card 2: Spacebar Trick */}
        <div className="why-card">
          <div className="why-card-content" style={{ marginBottom: '48px' }}>
            <h3>{benefits[1].title}</h3>
            <p>{benefits[1].body}</p>
          </div>
          
          {/* Wireframe Spacebar */}
          <div className="why-wireframe-spacebar">
             <span className="font-bold tracking-[0.2em] text-[0.8rem] uppercase" style={{ fontFamily: 'var(--font-momo, var(--font-display))', color: '#1a1a1a' }}>Spacebar</span>
          </div>
        </div>

        {/* Card 3: Always Watching */}
        <div className="why-card why-card-full">
           <div className="why-card-content" style={{ margin: 0, paddingRight: '16px', flex: 1 }}>
             <h3>{benefits[2].title}</h3>
             <p>{benefits[2].body}</p>
           </div>
           
           {/* Wireframe Notification */}
           <div className="why-wireframe-notif-wrap">
               <div className="why-wf-circle-outer"></div>
               <div className="why-wf-circle-mid"></div>
               <div className="why-wf-circle-inner"></div>
               
               <div className="why-wf-notif">
                  <div className="why-wf-notif-header">
                    <div className="why-wf-notif-avatar"></div>
                    <div className="why-wf-notif-lines">
                      <div className="why-wf-notif-line1"></div>
                      <div className="why-wf-notif-line2"></div>
                    </div>
                  </div>
                  <div className="why-wf-notif-body"></div>
               </div>
           </div>
        </div>
      </div>

      {/* Trust Banner Below Grid */}
      <div className="why-trust-banner">
         <div className="why-trust-item" style={{ background: 'var(--paradiso)', color: '#ffffff', border: 'none', boxShadow: '0 10px 25px -5px rgba(47, 132, 124, 0.3)' }}>
            <h4 style={{ color: '#ffffff' }}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#ffffff'}}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
               Built For Real Campers
            </h4>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)' }}>We made this to level the playing field so regular families can enjoy the outdoors without fighting broken websites.</p>
         </div>
         
         <div className="why-trust-item" style={{ background: 'var(--paradiso)', color: '#ffffff', border: 'none', boxShadow: '0 10px 25px -5px rgba(47, 132, 124, 0.3)' }}>
            <h4 style={{ color: '#ffffff' }}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color: '#ffffff'}}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
               Your Data Stays Yours
            </h4>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Our extension runs safely on your own computer, keeping your private info totally secure.</p>
         </div>
      </div>

    </section>
  )
}
